import os
import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
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
        print(f"[WARN] Failed to initialize google-genai in mock_interview: {e}")
        client = None

MODEL_NAME = "gemini-2.5-flash"


def build_fallback_questions(target_role: str, company_name: str = "", interview_type: str = "Comprehensive", num_questions: int = 6) -> Dict[str, Any]:
    """Fallback interview questions generator when API is offline."""
    role_lower = (target_role or "Software Developer").lower()
    
    tech_pool = [
        {
            "id": 1,
            "category": "Technical",
            "difficulty": "Easy",
            "question": f"Can you walk us through your core technical experience related to {target_role} and discuss a recent project where you applied your strongest technical skills?",
            "context_note": "Assesses foundational competency and project articulation.",
            "sample_ideal_points": [
                "Clear explanation of project architecture and tech stack",
                "Personal contributions and problem-solving approach",
                "Key technical outcomes and lessons learned"
            ]
        },
        {
            "id": 2,
            "category": "Technical",
            "difficulty": "Medium",
            "question": "How do you approach debugging complex runtime issues or performance bottlenecks in your applications? Can you share a concrete example?",
            "context_note": "Evaluates systematic problem solving and debugging methodologies.",
            "sample_ideal_points": [
                "Methodical profiling/logging strategies",
                "Root-cause isolation techniques",
                "Preventative measures implemented (testing, monitoring)"
            ]
        },
        {
            "id": 3,
            "category": "Technical",
            "difficulty": "Medium",
            "question": f"When building scalable systems for a role like {target_role}, how do you ensure security, data consistency, and API efficiency?",
            "context_note": "Tests architectural hygiene and production awareness.",
            "sample_ideal_points": [
                "Authentication and validation mechanisms",
                "Caching, database indexing, and query optimization",
                "Error handling and resilience"
            ]
        }
    ]

    behavioral_pool = [
        {
            "id": 4,
            "category": "Behavioral / HR",
            "difficulty": "Medium",
            "question": "Tell me about a time when you had to meet a tight project deadline or handle shifting requirements. How did you prioritize your work?",
            "context_note": "Evaluates time management, adaptability, and composure under pressure.",
            "sample_ideal_points": [
                "Structured STAR method (Situation, Task, Action, Result)",
                "Proactive communication with teammates or mentors",
                "Delivery of high-value core features first"
            ]
        },
        {
            "id": 5,
            "category": "Behavioral / HR",
            "difficulty": "Medium",
            "question": "Describe a scenario where you received critical constructive feedback on your code or project design. How did you respond and what was the outcome?",
            "context_note": "Measures growth mindset, receptiveness, and professional maturity.",
            "sample_ideal_points": [
                "Non-defensive, open attitude",
                "Action taken to incorporate suggestions and learn",
                "Improved code quality and collaboration"
            ]
        },
        {
            "id": 6,
            "category": "Problem Solving",
            "difficulty": "Hard",
            "question": f"If you were asked to design a key feature for {company_name or 'our platform'} from scratch within 2 weeks, what would be your step-by-step roadmap from requirements to deployment?",
            "context_note": "Tests end-to-end engineering discipline and delivery velocity.",
            "sample_ideal_points": [
                "Requirement breakdown and scoping",
                "Architecture and database schema drafting",
                "Milestone delivery, testing, and CI/CD rollout"
            ]
        }
    ]

    if interview_type == "Technical":
        questions = tech_pool + [
            {
                "id": 4,
                "category": "System Design",
                "difficulty": "Hard",
                "question": "How would you design a rate-limiting middleware and caching layer for high-throughput API endpoints?",
                "context_note": "Tests backend scaling and distributed cache understanding.",
                "sample_ideal_points": ["Token bucket / Leaky bucket algorithms", "Redis caching patterns", "Handling cache invalidation"]
            }
        ]
    elif interview_type == "Behavioral":
        questions = behavioral_pool
    else:
        questions = (tech_pool + behavioral_pool)[:num_questions]

    return {
        "interview_title": f"{target_role} AI Mock Interview",
        "target_role": target_role,
        "company_name": company_name or "General Industry Benchmark",
        "interview_type": interview_type,
        "estimated_duration_mins": len(questions) * 3,
        "questions": questions[:num_questions]
    }


def generate_mock_interview(
    resume_data: Optional[Dict[str, Any]] = None,
    resume_text: Optional[str] = None,
    target_role: str = "Software Developer",
    company_name: str = "",
    company_jd: str = "",
    interview_type: str = "Comprehensive",
    num_questions: int = 6
) -> Dict[str, Any]:
    """
    Generates a personalized, highly relevant AI Mock Interview question set
    based on candidate's resume, selected target role, and optional company JD.
    """
    target_role = (target_role or "Software Developer / Engineer").strip()
    company_name = (company_name or "").strip()
    company_jd = (company_jd or "").strip()
    interview_type = interview_type or "Comprehensive"
    num_questions = max(4, min(10, int(num_questions or 6)))

    resume_summary = ""
    if resume_data:
        try:
            resume_summary = json.dumps(resume_data, ensure_ascii=False, indent=1)
        except Exception:
            resume_summary = str(resume_data)
    elif resume_text:
        resume_summary = resume_text[:3000]

    if not client:
        print("[WARN] Gemini client not initialized. Using structured fallback interview generator.")
        return build_fallback_questions(target_role, company_name, interview_type, num_questions)

    prompt = f"""
You are a Principal Tech Interviewer and Hiring Director at top-tier software companies.

Your task is to generate a realistic, high-impact AI Mock Interview question set for a candidate.

=== INTERVIEW CONTEXT ===
- Target Role: {target_role}
- Target Company: {company_name or 'Top Tech Industry Standards'}
- Interview Mode: {interview_type} (e.g., Comprehensive Mix, Technical, Behavioral)
- Number of Questions to Generate: {num_questions}

=== CANDIDATE RESUME DATA ===
{resume_summary or 'No resume provided; evaluate based on target role standard competencies.'}

=== COMPANY JOB DESCRIPTION (JD) / REQUIREMENTS ===
{company_jd or 'Standard market expectations for this role.'}

=== GENERATION GUIDELINES ===
1. Tailor the questions specifically to the candidate's actual projects, technologies, and skills mentioned in their resume, cross-referenced with the target role and JD.
2. If the interview mode is 'Comprehensive', create an optimal split:
   - 60% Technical & System/Problem Solving questions tailored to candidate's tech stack and role
   - 40% Behavioral, Situational, and Team Collaboration questions (using STAR methodology format)
3. If mode is 'Technical', focus deeply on architecture, debugging, coding patterns, and data structures.
4. If mode is 'Behavioral', focus on leadership, conflict resolution, deadlines, mentorship, and ownership.
5. Each question must have a 'context_note' explaining to the candidate why an interviewer is asking this (e.g. referencing a project from their resume).
6. Provide 3-4 bullet points in 'sample_ideal_points' specifying key insights a strong candidate should mention.

Return ONLY a valid JSON object matching the exact schema below. Do not use markdown fences like ```json.

{{
  "interview_title": "{target_role} AI Mock Interview",
  "target_role": "{target_role}",
  "company_name": "{company_name or 'General Industry'}",
  "interview_type": "{interview_type}",
  "estimated_duration_mins": {num_questions * 3},
  "questions": [
    {{
      "id": 1,
      "category": "Technical",
      "difficulty": "Medium",
      "question": "Question text here...",
      "context_note": "Why this question is relevant to your background or the JD...",
      "sample_ideal_points": [
        "Key point 1",
        "Key point 2",
        "Key point 3"
      ]
    }}
  ]
}}
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={
                "temperature": 0.2,
                "max_output_tokens": 8000,
                "response_mime_type": "application/json"
            }
        )

        raw_text = response.text.strip()
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
            raw_text = re.sub(r"\n?```$", "", raw_text)

        # Extract JSON object substring
        first = raw_text.find('{')
        last = raw_text.rfind('}')
        if first != -1 and last != -1 and last > first:
            raw_text = raw_text[first:last+1]

        result = json.loads(raw_text)
        if "questions" in result and isinstance(result["questions"], list) and len(result["questions"]) > 0:
            return result

        return build_fallback_questions(target_role, company_name, interview_type, num_questions)
    except Exception as e:
        print(f"[ERR] Error in Gemini Mock Interview generation: {e}")
        return build_fallback_questions(target_role, company_name, interview_type, num_questions)


def build_fallback_evaluation(questions_and_answers: List[Dict[str, Any]], target_role: str) -> Dict[str, Any]:
    """Fallback evaluation generator when AI evaluation service is offline."""
    total_q = len(questions_and_answers)
    answered_q = sum(1 for qa in questions_and_answers if (qa.get("candidate_answer") or "").strip())
    
    score_base = 72 if answered_q >= total_q else max(40, int((answered_q / max(1, total_q)) * 75))
    
    question_reviews = []
    for idx, qa in enumerate(questions_and_answers):
        ans = (qa.get("candidate_answer") or "").strip()
        has_content = len(ans) > 20
        q_score = 7.5 if has_content else (4.0 if ans else 0.0)
        
        question_reviews.append({
            "question_id": qa.get("id", idx + 1),
            "question": qa.get("question", f"Question {idx+1}"),
            "category": qa.get("category", "General"),
            "candidate_answer": ans or "[No Answer Provided]",
            "score": q_score,
            "verdict": "Good" if q_score >= 7.0 else ("Average" if q_score > 0 else "Unanswered"),
            "feedback": "Clear conceptual response with relevant terminology." if has_content else "Answer was missing or lacked sufficient technical depth and specific examples.",
            "key_strengths": ["Clear communication", "Addressed question intent"] if has_content else [],
            "missing_points": ["Could provide more quantified results and edge-case handling"],
            "ideal_answer_summary": "A high-scoring answer should combine practical experience, architectural trade-offs, and measurable outcomes."
        })

    return {
        "overall_score": score_base,
        "overall_verdict": "Hire - Competitive Competency" if score_base >= 70 else "Needs Focused Practice",
        "performance_breakdown": {
            "technical_depth": min(95, score_base + 3),
            "communication_clarity": min(95, score_base),
            "problem_solving": min(95, score_base + 2),
            "behavioral_competency": min(95, score_base - 2),
            "role_alignment": min(95, score_base + 4)
        },
        "strengths": [
            f"Solid foundational alignment for {target_role} positions.",
            "Demonstrated practical understanding of core workflows.",
            "Good articulation of problem-solving approach."
        ],
        "weaknesses": [
            "Incorporate more quantifiable metrics and impact data in your responses.",
            "Utilize the STAR format (Situation, Task, Action, Result) for behavioral questions."
        ],
        "improvement_roadmap": [
            "Prepare 2-3 deep-dive flagship project stories highlighting challenging engineering roadblocks.",
            "Practice explaining trade-offs between different frameworks or architectural styles.",
            "Refine communication clarity by summarizing key conclusions first."
        ],
        "question_reviews": question_reviews,
        "overall_mentor_feedback": f"Strong effort in this mock interview for {target_role}. Focusing on concrete metrics and structured storytelling will make you stand out in competitive placement rounds."
    }


def evaluate_mock_interview(
    questions_and_answers: List[Dict[str, Any]],
    target_role: str = "Software Developer",
    company_name: str = "",
    company_jd: str = "",
    resume_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Evaluates all candidate responses in depth using Gemini AI, providing
    scores, pillar breakdown, strengths, gaps, question-by-question critique, and ideal answers.
    """
    target_role = (target_role or "Software Developer").strip()
    company_name = (company_name or "").strip()

    if not client:
        print("[WARN] Gemini client not initialized. Using fallback evaluation generator.")
        return build_fallback_evaluation(questions_and_answers, target_role)

    qa_payload_str = json.dumps(questions_and_answers, ensure_ascii=False, indent=1)

    prompt = f"""
You are an expert Tech Hiring Committee Director and Career Placement Coach.

Evaluate the following candidate's AI Mock Interview performance for the role of: {target_role} at {company_name or 'Industry Standard'}.

=== QUESTIONS AND CANDIDATE ANSWERS ===
{qa_payload_str}

=== TARGET JOB REQUIREMENTS / JD ===
{company_jd or 'Standard market expectations for ' + target_role}

=== EVALUATION INSTRUCTIONS ===
1. Analyze each question and the candidate's exact answer rigorously.
2. Score the candidate from 0 to 100 overall, and evaluate each individual question on a 0 to 10 scale.
3. Assess technical accuracy, depth, structure (e.g. STAR method for behavioral), problem-solving skills, and clarity.
4. If an answer is blank or extremely brief, score accordingly and state what was missed.
5. Provide actionable, supportive, yet honest critique with an ideal answer summary for every question.
6. Provide a performance breakdown (0-100) across: technical_depth, communication_clarity, problem_solving, behavioral_competency, role_alignment.

Return ONLY a valid JSON object matching the exact schema below. Do not use markdown codeblocks.

{{
  "overall_score": 85,
  "overall_verdict": "Hire - Competitive Competency",
  "performance_breakdown": {{
    "technical_depth": 85,
    "communication_clarity": 80,
    "problem_solving": 88,
    "behavioral_competency": 82,
    "role_alignment": 86
  }},
  "strengths": [
    "Specific strength 1 with evidence from candidate answers",
    "Specific strength 2"
  ],
  "weaknesses": [
    "Specific weakness 1",
    "Specific weakness 2"
  ],
  "improvement_roadmap": [
    "Actionable step 1 to prepare for live interviews",
    "Actionable step 2",
    "Actionable step 3"
  ],
  "question_reviews": [
    {{
      "question_id": 1,
      "question": "Question text",
      "category": "Technical",
      "candidate_answer": "Candidate answer text",
      "score": 8.5,
      "verdict": "Good",
      "feedback": "Detailed specific feedback on what candidate answered well and what could be improved.",
      "key_strengths": ["Strength 1"],
      "missing_points": ["Missing item 1"],
      "ideal_answer_summary": "Summary of an ideal model response..."
    }}
  ],
  "overall_mentor_feedback": "Comprehensive mentor advice summarizing overall interview performance and placement readiness."
}}
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={
                "temperature": 0.2,
                "max_output_tokens": 8000,
                "response_mime_type": "application/json"
            }
        )

        raw_text = response.text.strip()
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
            raw_text = re.sub(r"\n?```$", "", raw_text)

        first = raw_text.find('{')
        last = raw_text.rfind('}')
        if first != -1 and last != -1 and last > first:
            raw_text = raw_text[first:last+1]

        result = json.loads(raw_text)
        if "overall_score" in result and "question_reviews" in result:
            return result

        return build_fallback_evaluation(questions_and_answers, target_role)
    except Exception as e:
        print(f"[ERR] Error in Gemini Mock Interview evaluation: {e}")
        return build_fallback_evaluation(questions_and_answers, target_role)
