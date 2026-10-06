from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import joblib
import numpy as np
from pathlib import Path
from typing import List, Optional, Dict, Any
from resume_parser import parse_resume, resolve_file_path

app = FastAPI(title="SkillLensAI ML Service", version="2.0")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ML Artifacts Loading ---
ARTIFACT_DIR = Path(__file__).parent / "artifacts"
PIPELINE_PATH = ARTIFACT_DIR / "jobrole_pipeline.joblib"
LABEL_PATH = ARTIFACT_DIR / "label_encoder.joblib"
ROLE_SKILLS_PATH = ARTIFACT_DIR / "role_required_skills_top10.json"

pipeline = None
label_encoder = None
role_required = {}

if PIPELINE_PATH.exists() and LABEL_PATH.exists():
    try:
        pipeline = joblib.load(PIPELINE_PATH)
        label_encoder = joblib.load(LABEL_PATH)
    except Exception as e:
        print(f"[WARN] Failed loading pipeline/encoder: {e}")
        pipeline = None
        label_encoder = None

if ROLE_SKILLS_PATH.exists():
    try:
        with open(ROLE_SKILLS_PATH, "r", encoding="utf-8") as f:
            role_required = json.load(f)
    except Exception as e:
        print(f"[WARN] Failed loading role skills: {e}")
        role_required = {}


# --- Request Models ---

class ParseResumeRequest(BaseModel):
    filepath: Optional[str] = None
    resume_text: Optional[str] = None


class FileData(BaseModel):
    filepath: str


class JobRoleRequest(BaseModel):
    skills: List[str]
    academic_score: Optional[float] = None
    avg_skill_score: Optional[float] = None


class SkillGapRequest(BaseModel):
    role: str
    user_skills: List[str]


@app.post('/ml/job-role')
def predict_job_roles(req: JobRoleRequest):
    # prepare input text by joining skills
    skills = [s.strip().lower() for s in req.skills if s and isinstance(s, str)]
    if not skills:
        return {'roles': []}
    text = ' '.join(skills)
    # if pipeline is available, use it
    if pipeline is not None and label_encoder is not None:
        try:
            probs = None
            try:
                probs = pipeline.predict_proba([text])[0]
            except Exception:
                # try transform + clf
                vec = pipeline.named_steps.get('tfidf')
                clf = pipeline.named_steps.get('clf')
                Xv = vec.transform([text])
                probs = clf.predict_proba(Xv)[0]
            idx = np.argsort(probs)[::-1][:5]
            roles = [label_encoder.inverse_transform([int(i)])[0] for i in idx]
            return {'roles': roles}
        except Exception as e:
            # fallback to simple mapping
            pass

    # fallback heuristic: aggregate role suggestions from role_required map
    scores = {}
    for role, skills_req in role_required.items():
        matched = len(set(skills) & set([s.lower() for s in skills_req]))
        if matched > 0:
            scores[role] = matched
    sorted_roles = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    roles = [r for r,_ in sorted_roles][:5]
    return {'roles': roles}


@app.post('/career/skill-gap')
def skill_gap(req: SkillGapRequest):
    role = (req.role or '').strip()
    user_skills = [s.lower().strip() for s in req.user_skills if s]
    required = []
    # try role_required map
    if role in role_required:
        required = [s.lower() for s in role_required[role]]
    else:
        # try simple lookup by role key variants
        for k,v in role_required.items():
            if k.lower().replace(' ', '_') == role.lower().replace(' ', '_'):
                required = [s.lower() for s in v]
                break

    missing = [s for s in required if s not in user_skills]
    suggestion = ''
    if missing:
        suggestion = f'Acquire: {", ".join(missing)}'
    return {'missing_skills': missing, 'suggestion': suggestion}


@app.get("/")
def root():
    return {"message": "SkillLensAI ML Service Active", "version": "2.0"}


@app.post("/ml/parse-resume")
def handle_parse_resume(req: ParseResumeRequest):
    """
    Parses resume PDF or text into structured JSON using resume_parser.py (powered by Gemini LLM).
    Returns structured resume_data, skills list, and status.
    """
    result = parse_resume(filepath=req.filepath, resume_text=req.resume_text)
    return {
        "success": result.get("success", True),
        "resume_data": result.get("resume_data"),
        "skills": result.get("skills", []),
        "raw_text_length": len(result.get("raw_text", ""))
    }


@app.post("/extract-skills")
def extract_skill_endpoint(data: FileData):
    """
    Extracts skills and full resume_data from uploaded resume file using resume_parser.py.
    """
    result = parse_resume(filepath=data.filepath)
    return {
        "skills": result.get("skills", []),
        "resume_data": result.get("resume_data"),
        "success": result.get("success", True)
    }


class ResumeATSRequest(BaseModel):
    filepath: Optional[str] = None
    resume_data: Optional[Dict[str, Any]] = None
    resume_text: Optional[str] = None
    target_job_role: Optional[str] = "Software Developer / Engineer"


@app.post("/ml/resume-ats")
def handle_resume_ats(req: ResumeATSRequest):
    """
    Analyzes candidate resume against ATS standards and returns comprehensive
    scores, section completeness, skills gap, and improvement suggestions matching ats_result.json.
    """
    from resume_ats import analyze_resume_ats
    result = analyze_resume_ats(
        filepath=req.filepath,
        resume_data=req.resume_data,
        resume_text=req.resume_text,
        target_job_role=req.target_job_role or "Software Developer / Engineer"
    )
    return {
        "success": True,
        "ats_result": result
    }


