"""
Train job-role recommendation model (production-ready script).

Features:
- CLI with options for algorithm (tfidf | embed)
- Robust preprocessing and rare-class grouping
- Safe train/test split with fallback
- Saves artifacts to `ml-service/artifacts/` (pipeline, label encoder, config)
- Logging and reproducible random state

Usage:
  python train_jobrole_model.py --data ../dataset/candidate_job_role_dataset.csv --mode tfidf
  python train_jobrole_model.py --mode embed --min-count 3

"""
from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder


LOG = logging.getLogger("jobrole_trainer")


def setup_logging(level=logging.INFO):
    h = logging.StreamHandler()
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s - %(message)s")
    h.setFormatter(fmt)
    LOG.addHandler(h)
    LOG.setLevel(level)


def clean_skills(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = s.strip().lower()
    # remove parentheses content
    s = re.sub(r"\(.*?\)", " ", s)
    # keep commas and plus and alnum
    s = re.sub(r"[^a-z0-9,+\s]", " ", s)
    s = re.sub(r"[;|/]+", ",", s)
    s = re.sub(r"\s*,\s*", ",", s)
    toks = [t.strip() for t in s.split(",") if t.strip()]
    # dedupe preserving order
    seen = set(); uniq = []
    for t in toks:
        if t not in seen:
            seen.add(t); uniq.append(t)
    # join as space-separated tokens for vectorizer
    return " ".join(uniq)


def load_data(csv_path: Path) -> pd.DataFrame:
    LOG.info("Loading data from %s", csv_path)
    df = pd.read_csv(csv_path)
    if "skills" not in df.columns or "job_role" not in df.columns:
        raise ValueError("CSV must contain 'skills' and 'job_role' columns")
    df = df[["skills", "job_role"]].dropna().copy()
    df["skills_clean"] = df["skills"].apply(clean_skills)
    return df


def group_rare_labels(df: pd.DataFrame, min_count: int = 2) -> Tuple[pd.DataFrame, Dict[str, int]]:
    counts = df["job_role"].value_counts()
    rare = counts[counts < min_count].index.tolist()
    if rare:
        LOG.info("Grouping %d rare labels into 'Other' (min_count=%d)", len(rare), min_count)
        df = df.copy()
        df.loc[df["job_role"].isin(rare), "job_role"] = "Other"
    return df, counts.to_dict()


def train_tfidf_pipeline(X_train: List[str], y_train: np.ndarray, random_state: int = 42):
    vec = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
    clf = LogisticRegression(
        max_iter=2000,
        solver="saga",
        multi_class="multinomial",
        class_weight="balanced",
        random_state=random_state,
    )
    pipeline = Pipeline([("tfidf", vec), ("clf", clf)])
    pipeline.fit(X_train, y_train)
    return pipeline


def train_embedding_pipeline(X_train: List[str], y_train: np.ndarray, embed_model_name: str = "all-MiniLM-L6-v2", random_state: int = 42):
    try:
        from sentence_transformers import SentenceTransformer
    except Exception as e:
        raise RuntimeError("sentence-transformers is required for embed mode: pip install sentence-transformers") from e

    LOG.info("Loading embedding model %s", embed_model_name)
    emb = SentenceTransformer(embed_model_name)
    X_emb = emb.encode(X_train, show_progress_bar=True, convert_to_numpy=True)
    clf = LogisticRegression(max_iter=2000, solver="saga", multi_class="multinomial", class_weight="balanced", random_state=random_state)
    clf.fit(X_emb, y_train)
    # We will save embedding model name + classifier; inference will re-load SentenceTransformer
    return {"embed_model_name": embed_model_name, "clf": clf, "emb_encoder": emb}


def evaluate_and_report(pipeline_or_dict, X_test: List[str], y_test: np.ndarray, label_encoder: LabelEncoder, mode: str = "tfidf"):
    if mode == "tfidf":
        y_pred = pipeline_or_dict.predict(X_test)
    else:
        # embeddings dict
        emb = pipeline_or_dict["emb_encoder"]
        clf = pipeline_or_dict["clf"]
        X_emb = emb.encode(X_test, convert_to_numpy=True)
        y_pred = clf.predict(X_emb)

    acc = accuracy_score(y_test, y_pred)
    LOG.info("Test Accuracy: %.4f", acc)
    # Ensure `classification_report` receives matching labels and target_names.
    labels = list(range(len(label_encoder.classes_)) )
    report = classification_report(y_test, y_pred, labels=labels, target_names=list(label_encoder.classes_), zero_division=0)
    LOG.info("\n%s", report)
    return acc, report


def save_artifacts(out_dir: Path, *, mode: str, pipeline_or_dict, label_encoder: LabelEncoder, meta: Dict):
    out_dir.mkdir(parents=True, exist_ok=True)
    LOG.info("Saving artifacts to %s", out_dir)
    joblib.dump(label_encoder, out_dir / "label_encoder.joblib")
    if mode == "tfidf":
        joblib.dump(pipeline_or_dict, out_dir / "jobrole_pipeline.joblib")
    else:
        # embeddings: save classifier and metadata; do not attempt to joblib-save SentenceTransformer large object
        joblib.dump(pipeline_or_dict["clf"], out_dir / "jobrole_clf_emb.joblib")
        # save embed model name to metadata
        meta["embed_model_name"] = pipeline_or_dict.get("embed_model_name")
    # save metadata
    with open(out_dir / "meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)


def build_skill_role_map(pipeline, label_encoder: LabelEncoder, skills_list: List[str], k: int = 5):
    rows = []
    for tok in skills_list:
        probs = None
        try:
            probs = pipeline.predict_proba([tok])[0]
        except Exception:
            # safe fallback: predict but might not be available for embed-mode
            try:
                # attempt transform if pipeline has tfidf
                vec = pipeline.named_steps.get("tfidf")
                clf = pipeline.named_steps.get("clf")
                Xv = vec.transform([tok])
                probs = clf.predict_proba(Xv)[0]
            except Exception:
                probs = np.zeros(len(label_encoder.classes_))
        idx = np.argsort(probs)[::-1][:k]
        row = {"skill": tok}
        for i, ii in enumerate(idx, start=1):
            row[f"role_{i}"] = label_encoder.inverse_transform([ii])[0]
            row[f"prob_{i}"] = float(probs[ii])
        rows.append(row)
    return pd.DataFrame(rows)


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--data", type=Path, default=Path(__file__).parents[1] / "dataset" / "candidate_job_role_dataset.csv")
    p.add_argument("--out-dir", type=Path, default=Path(__file__).parents[1] / "artifacts")
    p.add_argument("--mode", choices=("tfidf", "embed"), default="tfidf")
    p.add_argument("--min-count", type=int, default=2, help="Minimum samples per class; classes with fewer will be grouped into 'Other'")
    p.add_argument("--random-state", type=int, default=42)
    p.add_argument("--embed-model", type=str, default="all-MiniLM-L6-v2")
    return p.parse_args()


def main():
    setup_logging()
    args = parse_args()
    LOG.info("Args: %s", args)

    df = load_data(args.data)
    df, counts = group_rare_labels(df, min_count=args.min_count)

    X = df["skills_clean"].astype(str).tolist()
    y = df["job_role"].astype(str).values

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    # safe stratified split
    from collections import Counter
    counts_after = Counter(y_enc)
    min_count = min(counts_after.values()) if counts_after else 0
    if min_count < 2:
        LOG.warning("Least populated class has %d samples after grouping — using non-stratified split", min_count)
        X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=args.random_state, shuffle=True)
    else:
        X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=args.random_state, stratify=y_enc)

    if args.mode == "tfidf":
        pipeline = train_tfidf_pipeline(X_train, y_train, random_state=args.random_state)
        evaluate_and_report(pipeline, X_test, y_test, le, mode="tfidf")
        save_artifacts(args.out_dir, mode="tfidf", pipeline_or_dict=pipeline, label_encoder=le, meta={"mode": "tfidf"})
        # build skill->roles map using pipeline
        # get unique tokens
        tokens = sorted({tok for s in df["skills_clean"] for tok in s.split()})
        map_df = build_skill_role_map(pipeline, le, tokens, k=5)
        map_df.to_csv(args.out_dir / "skill_to_roles_top5.csv", index=False)
        LOG.info("Wrote skill->top5 map to %s", args.out_dir / "skill_to_roles_top5.csv")
    else:
        emb_dict = train_embedding_pipeline(X_train, y_train, embed_model_name=args.embed_model, random_state=args.random_state)
        # evaluate
        evaluate_and_report(emb_dict, X_test, y_test, le, mode="embed")
        save_artifacts(args.out_dir, mode="embed", pipeline_or_dict=emb_dict, label_encoder=le, meta={"mode": "embed"})
        # For embeddings, create mapping by encoding tokens using the embedding model
        emb = emb_dict["emb_encoder"]
        tokens = sorted({tok for s in df["skills_clean"] for tok in s.split()})
        rows = []
        for tok in tokens:
            v = emb.encode([tok], convert_to_numpy=True)
            probs = emb_dict["clf"].predict_proba(v)[0]
            idx = np.argsort(probs)[::-1][:5]
            row = {"skill": tok}
            for i, ii in enumerate(idx, start=1):
                row[f"role_{i}"] = le.inverse_transform([ii])[0]
                row[f"prob_{i}"] = float(probs[ii])
            rows.append(row)
        pd.DataFrame(rows).to_csv(args.out_dir / "skill_to_roles_top5.csv", index=False)
        LOG.info("Wrote skill->top5 map to %s", args.out_dir / "skill_to_roles_top5.csv")


if __name__ == "__main__":
    main()
