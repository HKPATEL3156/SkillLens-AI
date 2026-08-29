# library for gemini sdk
try:
  from google import genai  # import gemini sdk
except Exception:
  import sys
  msg = (
    "Missing dependency: google-genai (Gemini SDK).\n"
    "Install it into your Python environment with:\n"
    "    pip install google-genai\n"
    "Then re-run this script."
  )
  print(msg)
  sys.exit(1)

# library for env
from dotenv import load_dotenv  # load env file

# other libs
import json  # handle json safely
import argparse
import os

# load env file with override (important)
env_path = os.path.join(os.path.dirname(__file__), ".env")  # get path
load_dotenv(dotenv_path=env_path, override=True)  # force load

# fetch api key
api_key = os.getenv("GEMINI_API_KEY")  # get key

# debug
# print("api key loaded:", api_key)

# validate key
if not api_key:
    raise ValueError("api key not found")

# create gemini client
client = genai.Client(api_key=api_key)  # create client

# Determine skill list: command-line, selected_skills.json, or interactive prompt
parser = argparse.ArgumentParser(description='Generate quiz for given skills')
parser.add_argument('--skills', help='Comma-separated skills (e.g. "python, SQL")')
parser.add_argument('--output', help='Output file path')
args = parser.parse_args()

skills = None
if args.skills:
  skills = [s.strip() for s in args.skills.split(',') if s.strip()]
else:
  # try reading selected skills from backend data file
  sel_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'selected_skills.json'))
  if os.path.exists(sel_path):
    try:
      with open(sel_path, 'r', encoding='utf-8') as sf:
        data = json.load(sf)
        if isinstance(data, list):
          skills = [str(s).strip() for s in data if str(s).strip()]
        elif isinstance(data, str):
          skills = [s.strip() for s in data.split(',') if s.strip()]
    except Exception:
      skills = None

if not skills:
  try:
    skills_input = input("Enter comma-separated skills to evaluate (e.g. python, SQL): ")
    skills = [skill.strip() for skill in skills_input.split(",") if skill.strip()]
  except Exception:
    skills = ["general aptitude", "python", "SQL", "basic ml", "basic cloud"]

# convert skill list into string
skill_text = ", ".join(skills)  # join skills into text
print(f"Using skills: {skill_text}")

# create prompt (no f-string to avoid bracket error)
prompt = """
Skills to evaluate for juniour developers or freshers:
""" + skill_text + """

Rules:

- Generate exactly 25 questions.

- Difficulty distribution:
  • 30% Easy (concept clarity + senario based)
  • 40% Medium (mix topic practical logic)
  • 30% Hard (scenario + edge cases + mix)

- Question type distribution:
  • Minimum 50% MSQ
  • Remaining MCQ
  • At least 40% must include short code snippet
  • At least 40% must be scenario-based

- Question style:
  • Mix conceptual, debugging, output prediction, best practice, and real-world mistake detection
  • Avoid direct definition-based questions
  • Avoid extremely advanced or rare topics
  • Focus on commonly used development patterns
  • Code snippets must be short (max 8–10 lines)
  • Include tricky edge cases where applicable
  • also you can ask the multiple skill question with real senario type 
  

- Evaluation focus:
  • Logical reasoning
  • Common developer mistakes
  • Runtime behavior
  • Performance awareness
  • Security awareness (basic level)
  • Clean code practices

- Each question text maximum 3 lines (excluding code)

- No explanations.
- No answers outside JSON.
- Must generate complete 25 questions without truncation.

Output format:
Return ONLY a valid JSON array of exactly 25 objects.

Each object must contain:
id (number 1 to 25)
text (question text max 3 lines)
code (short code snippet or null)
type (MCQ or MSQ)
options (object with keys A,B,C,D)
correct (array of correct option letters)
difficulty (easy or medium or hard)

Generate complete 25 questions fully without stopping.
"""

try:
    # call gemini model
    response = client.models.generate_content(
        model="gemini-2.5-flash",  # stable fast model
        contents=prompt,
        config={
            "temperature": 0.4,        # controlled creativity
            "max_output_tokens": 15000 # enough tokens for 25 questions
        }
    )

    # get raw text
    raw_text = response.text  # get model output
    print("generated_quiz_raw:\n")
    print(raw_text)

    # attempt to extract JSON array from raw_text
    quiz_json = None
    try:
      # find first '[' and last ']' to extract JSON array
      first = raw_text.find('[')
      last = raw_text.rfind(']')
      if first != -1 and last != -1 and last > first:
        json_text = raw_text[first:last+1]
      else:
        # fallback: remove Markdown fences and common labels
        json_text = raw_text.replace('```json', '').replace('```', '').strip()

      quiz_json = json.loads(json_text)

      print("\njson_valid:\n")
      print("total_questions:", len(quiz_json))

      # write to backend data file
      import os
      if args.output:
          out_path = os.path.abspath(args.output)
      else:
          out_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'questionpaper.json')
      out_path = os.path.normpath(out_path)
      with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(quiz_json, f, indent=2, ensure_ascii=False)

      print(f"Saved generated question paper to: {out_path}")

    except Exception as je:
      print("\njson_parse_error:\n")
      print(str(je))
      # Save raw_text to a diagnostics file for inspection
      import os
      diag_path = os.path.join(os.path.dirname(__file__), 'generated_quiz_raw.txt')
      diag_path = os.path.normpath(diag_path)
      try:
        with open(diag_path, 'w', encoding='utf-8') as df:
          df.write(raw_text)
        print(f"Wrote raw output to {diag_path} for debugging.")
      except Exception:
        pass

except Exception as e:
    print("api_error:\n")  # label
    print(str(e))  # show api error