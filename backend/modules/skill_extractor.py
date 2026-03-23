import json
import re
import os

# Load master skill list (using absolute path)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS = []

try:
    with open(os.path.join(BASE_DIR, "data/skills.json")) as f:
        SKILLS = json.load(f)
except Exception as e:
    print(f"Warning: Could not load skills.json: {str(e)}")
    SKILLS = []


def preprocess_text(text):
    """
    Clean and normalize text for matching.
    """
    text = re.sub(r'[^a-zA-Z0-9#+ ]', '', text)
    return text.lower()


def build_skill_vector(text):
    """
    Creates binary skill vector based on skills.json.
    Returns:
        - vector (list of 0/1)
        - detected skill names
    """

    text = preprocess_text(text)

    skill_vector = []
    detected_skills = []

    for skill in SKILLS:
        if skill.lower() in text:
            skill_vector.append(1)
            detected_skills.append(skill)
        else:
            skill_vector.append(0)

    return skill_vector, detected_skills