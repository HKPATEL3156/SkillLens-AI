import os
import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pdfplumber
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
client = None
if api_key:
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[WARN] Failed to initialize google-genai in resume_parser: {e}")
        client = None

MODEL_NAME = "gemini-2.5-flash"

# Comprehensive skill keyword list for regex fallback
FALLBACK_SKILLS = [
    "python", "java", "c", "c++", "c#", "javascript", "typescript", "go", "rust", "php", "ruby", "kotlin", "swift", "r",
    "html", "css", "bootstrap", "tailwind", "sass", "react", "nextjs", "vue", "angular", "redux",
    "node", "express", "django", "flask", "fastapi", "spring boot", "asp.net", "laravel",
    "mysql", "postgresql", "mongodb", "firebase", "redis", "oracle", "sqlite", "sql",
    "mern", "mean", "rest api", "graphql", "jwt", "authentication", "authorization",
    "docker", "kubernetes", "jenkins", "git", "github", "gitlab", "ci/cd", "aws", "azure", "gcp", "nginx", "linux",
    "machine learning", "deep learning", "data science", "data analysis", "pandas", "numpy", "scikit-learn", "tensorflow", "keras", "pytorch",
    "nlp", "computer vision", "opencv", "xgboost", "llm", "langchain", "huggingface", "transformers", "openai", "gemini",
    "etl pipelines", "data processing", "data warehousing", "hadoop", "spark", "airflow", "kafka",
    "problem solving", "teamwork", "communication", "leadership"
]


def resolve_file_path(filepath: str) -> str:
    """Resolve file path across backend and ml-service relative directories."""
    if not filepath:
        return ""
    if os.path.isabs(filepath) and os.path.exists(filepath):
        return filepath
    p1 = os.path.abspath(filepath)
    if os.path.exists(p1):
        return p1
    base_backend = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
    p2 = os.path.normpath(os.path.join(base_backend, filepath.lstrip("/\\")))
    if os.path.exists(p2):
        return p2
    return p1


import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path: str) -> str:
    """Extract all text from a DOCX resume by parsing its XML contents."""
    resolved = resolve_file_path(docx_path)
    if not resolved or not os.path.exists(resolved):
        print(f"[ERR] File not found: {docx_path}")
        return ""
    try:
        texts = []
        with zipfile.ZipFile(resolved) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            for el in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                if el.text:
                    texts.append(el.text)
        return "\n".join(texts).strip()
    except Exception as e:
        print(f"[ERR] Failed to extract text from DOCX: {e}")
        return ""


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF resume using pdfplumber."""
    resolved = resolve_file_path(pdf_path)
    if not resolved or not os.path.exists(resolved):
        print(f"[ERR] File not found: {pdf_path}")
        return ""
    
    text = ""
    try:
        with pdfplumber.open(resolved) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"[ERR] Failed to extract text from PDF: {e}")
    return text.strip()


def extract_text_from_file(filepath: str) -> str:
    """Extract text from either a PDF or a DOCX resume based on extension."""
    if not filepath:
        return ""
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(filepath)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(filepath)
    else:
        print(f"[ERR] Unsupported file format: {ext}")
        return ""



def find_skills_regex(text: str) -> List[str]:
    """Fallback skill matching using word-boundary regular expressions."""
    text_lower = text.lower()
    found = []
    for skill in FALLBACK_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.append(skill.title() if len(skill) > 3 and not skill.isupper() else skill.upper() if len(skill) <= 3 else skill)
    return sorted(list(set(found)))


def clean_json_response(raw_response: str) -> Optional[dict]:
    """Extract and parse clean JSON dictionary from LLM output with multi-stage recovery."""
    if not raw_response:
        return None

    clean_text = raw_response.strip()
    if clean_text.startswith("```"):
        clean_text = re.sub(r"^```(?:json)?\s*", "", clean_text, flags=re.MULTILINE)
        clean_text = re.sub(r"```$", "", clean_text, flags=re.MULTILINE).strip()

    # Pass 1: Direct JSON parsing
    try:
        return json.loads(clean_text)
    except Exception:
        pass

    # Pass 2: Extract outermost JSON object
    try:
        first = clean_text.find("{")
        last = clean_text.rfind("}")
        if first != -1 and last != -1 and last > first:
            substring = clean_text[first : last + 1]
            try:
                return json.loads(substring)
            except Exception:
                pass
            
            # Pass 3: Fix trailing commas
            fixed = re.sub(r",\s*([\]}])", r"\1", substring)
            try:
                return json.loads(fixed)
            except Exception:
                pass

            # Pass 4: Fix single quotes and unescaped newlines
            fixed_lines = []
            for line in fixed.splitlines():
                # remove line comments if any
                line_no_comment = re.sub(r"^\s*//.*$", "", line)
                fixed_lines.append(line_no_comment)
            fixed_str = "\n".join(fixed_lines)
            try:
                return json.loads(fixed_str)
            except Exception:
                pass
    except Exception as e:
        print(f"[ERR] JSON cleanup pass failed: {e}")

    return None


def extract_and_normalize_skills(resume_json: dict) -> List[str]:
    """Extract all technical and soft skills from parsed resume JSON and deduplicate."""
    technical_skills = resume_json.get("technical_skills", {})
    all_skills = []

    if isinstance(technical_skills, dict):
        for category, skills in technical_skills.items():
            if isinstance(skills, list):
                all_skills.extend(skills)
            elif isinstance(skills, str) and skills.strip():
                all_skills.append(skills.strip())
    elif isinstance(technical_skills, list):
        all_skills.extend(technical_skills)

    soft_skills = resume_json.get("soft_skills", [])
    if isinstance(soft_skills, list):
        all_skills.extend(soft_skills)

    # Normalize and deduplicate case-insensitively
    cleaned_skills = []
    seen = set()
    for s in all_skills:
        skill_str = str(s).strip()
        if skill_str and skill_str.lower() not in seen:
            seen.add(skill_str.lower())
            cleaned_skills.append(skill_str)

    return cleaned_skills


def parse_resume(filepath: Optional[str] = None, resume_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Main function to parse resume using Gemini LLM prompt matching resume_parsing.ipynb.
    Returns:
      {
        "success": True/False,
        "resume_data": { personal_information, summary, technical_skills, education, projects, ... },
        "skills": ["Python", "SQL", "Pandas", ...],
        "raw_text": "..."
      }
    """
    text = resume_text or ""
    if filepath and not text:
        text = extract_text_from_file(filepath)

    if not text or len(text.strip()) < 10:
        return {
            "success": False,
            "error": "No resume text could be extracted.",
            "resume_data": None,
            "skills": []
        }

    parsed_json = None

    if client:
        prompt = """
You are an expert Resume Parser.

Your task is to extract information from the resume and return ONLY a valid JSON object.

Rules:

- Return only JSON.
- Do not use markdown.
- Do not use ```json.
- Do not explain anything.
- Do not skip any field.
- If information is unavailable, use null or [].
- Do not guess information.
- Keep the original values from the resume.
- Remove duplicate skills.
- Keep skills as separate array items.
- Do not merge different technologies.

Resume Text:
""" + text[:12000] + """

Extract the following information.

{
  "personal_information": {
    "full_name": null,
    "current_role": null,
    "email": null,
    "phone": null,
    "location": null,
    "linkedin": null,
    "github": null,
    "portfolio": null,
    "other_links": []
  },

  "summary": null,

  "technical_skills": {
    "programming_languages": [],
    "frontend": [],
    "backend": [],
    "frameworks": [],
    "libraries": [],
    "databases": [],
    "cloud": [],
    "devops": [],
    "ai_ml": [],
    "tools": [],
    "operating_systems": [],
    "others": []
  },

  "soft_skills": [],

  "education": [
    {
      "degree": null,
      "specialization": null,
      "institution": null,
      "cgpa": null,
      "percentage": null,
      "start_date": null,
      "end_date": null,
      "status": null
    }
  ],

  "experience": [
    {
      "company": null,
      "role": null,
      "employment_type": null,
      "location": null,
      "start_date": null,
      "end_date": null,
      "duration": null,
      "responsibilities": [],
      "technologies": []
    }
  ],

  "projects": [
    {
      "project_name": null,
      "role": null,
      "description": null,
      "technologies": [],
      "github": null,
      "live_demo": null
    }
  ],

  "internships": [
    {
      "company": null,
      "role": null,
      "duration": null,
      "technologies": [],
      "description": []
    }
  ],

  "certifications": [],

  "achievements": [],

  "languages": [],

  "references": []
}
"""
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config={
                    "temperature": 0.1,
                    "max_output_tokens": 8192,
                    "response_mime_type": "application/json"
                }
            )
            parsed_json = clean_json_response(response.text)
            if not parsed_json:
                return {
                    "success": False,
                    "error": "Failed to parse valid JSON response from Gemini API.",
                    "resume_data": None,
                    "skills": []
                }
        except Exception as e:
            print(f"[ERR] Gemini API call failed in resume_parser: {e}")
            return {
                "success": False,
                "error": f"Gemini API call failed: {str(e)}",
                "resume_data": None,
                "skills": []
            }
    else:
        return {
            "success": False,
            "error": "Gemini API client not initialized. Check GEMINI_API_KEY.",
            "resume_data": None,
            "skills": []
        }

    skills = extract_and_normalize_skills(parsed_json)
    if not skills:
        skills = find_skills_regex(text)

    return {
        "success": True,
        "resume_data": parsed_json,
        "skills": skills,
        "raw_text": text
    }
