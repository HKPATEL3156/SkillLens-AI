"""Train RandomForest job-role recommendation model.

Usage:
  python train_rf.py --data ../dataset/candidate_job_role_dataset.csv --out-dir ../artifacts

Creates:
  - jobrole_pipeline.joblib
  - label_encoder.joblib
  - role_required_skills_top10.json
  - skill_to_roles_top5.csv
"""
from pathlib import Path
import argparse
import json
import logging
import re
from collections import Counter

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

LOG = logging.getLogger("train_rf")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s - %(message)s")


def clean_skills(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = s.strip().lower()
    s = re.sub(r"\(.*?\)", " ", s)
    s = re.sub(r"[^a-z0-9,+\s]", " ", s)
    s = re.sub(r"[;|/]+", ",", s)
    s = re.sub(r"\s*,\s*", ",", s)
    toks = [t.strip() for t in s.split(",") if t.strip()]
    seen = set(); uniq = []
    for t in toks:
        if t not in seen:
            seen.add(t); uniq.append(t)
    return " ".join(uniq)


def build_role_required(df, topk=10):
    role_map = {}
    for role, group in df.groupby('job_role'):
        skills = " ".join(group['skills_clean'].astype(str).tolist()).split()
        c = Counter(skills)
        role_map[role] = [s for s,_ in c.most_common(topk)]
    return role_map


def build_skill_role_map(pipeline, le, tokens, k=5, out_csv=None):
    rows = []
    for tok in tokens:
        try:
            probs = pipeline.predict_proba([tok])[0]
        except Exception:
            # try transform + clf
            vec = pipeline.named_steps.get('tfidf')
            clf = pipeline.named_steps.get('clf')
            Xv = vec.transform([tok])
            probs = clf.predict_proba(Xv)[0]
        idx = np.argsort(probs)[::-1][:k]
        row = {"skill": tok}
        for i, ii in enumerate(idx, start=1):
            row[f"role_{i}"] = le.inverse_transform([ii])[0]
            row[f"prob_{i}"] = float(probs[ii])
        rows.append(row)
    df = pd.DataFrame(rows)
    if out_csv:
        df.to_csv(out_csv, index=False)
    return df


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--data', type=Path, default=Path(__file__).parents[1] / 'dataset' / 'candidate_job_role_dataset.csv')
    p.add_argument('--out-dir', type=Path, default=Path(__file__).parents[1] / 'artifacts')
    p.add_argument('--min-count', type=int, default=2)
    args = p.parse_args()

    LOG.info('Loading %s', args.data)
    df = pd.read_csv(args.data)
    if 'skills' not in df.columns or 'job_role' not in df.columns:
        raise RuntimeError('dataset must have skills and job_role columns')
    df = df[['skills', 'job_role']].dropna().copy()
    df['skills_clean'] = df['skills'].apply(clean_skills)

    # group rare labels
    counts = df['job_role'].value_counts()
    rare = counts[counts < args.min_count].index.tolist()
    if rare:
        LOG.info('Grouping %d rare labels into Other', len(rare))
        df.loc[df['job_role'].isin(rare), 'job_role'] = 'Other'

    X = df['skills_clean'].astype(str).tolist()
    y = df['job_role'].astype(str).values

    le = LabelEncoder(); y_enc = le.fit_transform(y)

    # split
    try:
        strat = y_enc
        if len(set(y_enc)) and min(list(Counter(y_enc).values())) > 1:
            X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)
        else:
            X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42)
    except Exception:
        X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42)

    # pipeline: tfidf + randomforest
    vec = TfidfVectorizer(ngram_range=(1,2), max_features=8000)
    clf = RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=42)
    pipeline = Pipeline([('tfidf', vec), ('clf', clf)])
    LOG.info('Training RandomForest pipeline...')
    pipeline.fit(X_train, y_train)

    # eval
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    LOG.info('Test accuracy: %.4f', acc)
    LOG.info('\n%s', classification_report(y_test, y_pred, target_names=list(le.classes_), zero_division=0))

    out = args.out_dir
    out.mkdir(parents=True, exist_ok=True)
    # save artifacts
    joblib.dump(pipeline, out / 'jobrole_pipeline.joblib')
    joblib.dump(le, out / 'label_encoder.joblib')
    LOG.info('Saved pipeline and label encoder to %s', out)

    # role required skills
    role_map = build_role_required(df, topk=10)
    with open(out / 'role_required_skills_top10.json', 'w', encoding='utf-8') as f:
        json.dump(role_map, f, indent=2)

    # skill->roles map
    tokens = sorted({tok for s in df['skills_clean'] for tok in s.split()})
    build_skill_role_map(pipeline, le, tokens, k=5, out_csv=str(out / 'skill_to_roles_top5.csv'))
    LOG.info('Wrote skill_to_roles_top5.csv and role_required_skills_top10.json')


if __name__ == '__main__':
    main()
