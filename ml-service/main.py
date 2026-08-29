from app import app

# This file intentionally re-exports the FastAPI `app` instance from app.py
# so the development command `uvicorn main:app --reload` works as expected.
