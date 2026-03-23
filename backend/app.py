from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
import sys
import os

# -----------------------------------------
# Logging — visible in Vercel function logs
# -----------------------------------------
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# -----------------------------------------
# Safe Module Loading
# -----------------------------------------
try:
    from modules.resume_parser import extract_text_from_pdf
    from modules.skill_extractor import build_skill_vector
    from modules.personality_engine import calculate_personality_vector
    from modules.compatibility_engine import compute_overall_compatibility
    from modules.simulation_engine import simulate_growth
    from modules.virtual_self_engine import build_virtual_self_profile
    from modules.monte_carlo_engine import monte_carlo_growth
    from modules.risk_engine import compute_burnout_risk
    from modules.explanation_engine import generate_explanation
    from modules.decision_engine import simulate_decision_scenario
except Exception as e:
    logger.error("Failed to import modules: %s", str(e))
    raise

app = Flask(__name__)
CORS(app)

# -----------------------------------------
# Load Data (using absolute paths)
# -----------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROLES = None
QUESTIONS = None

try:
    with open(os.path.join(BASE_DIR, "data/roles.json")) as f:
        ROLES = json.load(f)
    logger.info("Loaded roles.json successfully")
except Exception as e:
    logger.error("Failed to load roles.json: %s", str(e))
    raise

try:
    with open(os.path.join(BASE_DIR, "data/questions.json")) as f:
        QUESTIONS = json.load(f)
    logger.info("Loaded questions.json successfully")
except Exception as e:
    logger.error("Failed to load questions.json: %s", str(e))
    raise


# -----------------------------------------
# Health Check
# -----------------------------------------
@app.route("/")
@app.route("/api/")
def home():
    return jsonify({"status": "Career Intelligence Virtual Self Engine Running"})


# -----------------------------------------
# Health Check (for production monitoring)
# -----------------------------------------
@app.route("/health")
@app.route("/api/health")
def health():
    return jsonify({"ok": True, "status": "Backend is running"})


# -----------------------------------------
# Debug endpoint
# -----------------------------------------
@app.route("/debug")
@app.route("/api/debug")
def debug():
    return jsonify({
        "backend": "running",
        "base_dir": BASE_DIR,
        "roles_loaded": ROLES is not None and len(ROLES) > 0,
        "questions_loaded": QUESTIONS is not None and len(QUESTIONS) > 0,
        "num_roles": len(ROLES) if ROLES else 0,
        "num_questions": len(QUESTIONS) if QUESTIONS else 0
    })


# -----------------------------------------
# Get Personality Questions
# -----------------------------------------
@app.route("/questions", methods=["GET"])
@app.route("/api/questions", methods=["GET"])
def get_questions():
    return jsonify({"questions": QUESTIONS})


# -----------------------------------------
# Main Analysis Route
# -----------------------------------------
@app.route("/analyze", methods=["POST"])
@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        logger.info("POST /analyze — content-type: %s", request.content_type)

        resume_text = None
        personality_answers = None
        role = None

        # -----------------------------
        # JSON Request (Frontend use)
        # -----------------------------
        if request.is_json:
            data = request.get_json()
            resume_text = data.get("resume_text")
            personality_answers = data.get("personality_answers")
            role = data.get("role")

        # -----------------------------
        # form-data (PDF upload support)
        # -----------------------------
        else:
            resume_file = request.files.get("resume")

            if resume_file:
                try:
                    resume_text = extract_text_from_pdf(resume_file)
                except Exception as e:
                    logger.error("PDF extraction error: %s", str(e))
                    return jsonify({"error": f"Failed to extract PDF: {str(e)}"}), 400
            else:
                resume_text = request.form.get("resume_text")

            personality_answers = request.form.get("personality_answers")
            role = request.form.get("role")

            if personality_answers:
                try:
                    personality_answers = json.loads(personality_answers)
                except:
                    return jsonify({"error": "Invalid personality_answers format"}), 400

        # -----------------------------
        # Validation
        # -----------------------------
        if not resume_text:
            return jsonify({"error": "Resume text or file is required"}), 400

        if not personality_answers:
            return jsonify({"error": "personality_answers is required"}), 400

        if not role:
            return jsonify({"error": "role is required"}), 400

        if len(personality_answers) != 10:
            return jsonify({"error": "Exactly 10 personality answers required"}), 400

        role_data = ROLES.get(role)

        if not role_data:
            return jsonify({"error": "Invalid role selected"}), 400

        # All computation wrapped in try-catch
        # ─────────────────────────────────────
        
        # 1️⃣ Skill Vector
        user_skill_vector, detected_skills = build_skill_vector(resume_text)
        logger.info("Built skill vector: %d skills detected", len(detected_skills))

        # 2️⃣ Personality Vector
        user_personality_vector = calculate_personality_vector(personality_answers)
        logger.info("Calculated personality vector")

        # 3️⃣ Compatibility + Missing Skills
        compatibility_score, missing_skills = compute_overall_compatibility(
            user_skill_vector,
            user_personality_vector,
            role_data
        )
        logger.info("Computed compatibility: %.2f", compatibility_score)

        # 4️⃣ Burnout Risk
        burnout_risk = compute_burnout_risk(
            user_personality_vector,
            role_data
        )
        logger.info("Computed burnout risk: %.2f", burnout_risk)

        # 5️⃣ Deterministic Growth
        projection = simulate_growth(
            compatibility_score,
            user_skill_vector,
            role_data
        )
        logger.info("Simulated growth projection")

        # 6️⃣ Monte Carlo Growth
        monte_carlo_projection = monte_carlo_growth(
            compatibility_score,
            user_skill_vector,
            role_data
        )
        logger.info("Completed Monte Carlo simulation")

        # 7️⃣ Virtual Self Profile
        virtual_self = build_virtual_self_profile(
            user_personality_vector
        )
        logger.info("Built virtual self profile")

        # 8️⃣ AI Explanation
        explanation = generate_explanation(
            compatibility_score,
            missing_skills,
            virtual_self
        )
        logger.info("Generated explanation")

        # 9️⃣ Decision Simulation Sample
        decision_simulation = simulate_decision_scenario(
            user_personality_vector,
            "startup_risk"
        )
        logger.info("Simulated decision scenario")

        # -----------------------------------------
        # Final Response
        # -----------------------------------------
        result = {
            "detected_skills": detected_skills,
            "compatibility_score": compatibility_score,
            "missing_skills": missing_skills,
            "burnout_risk": burnout_risk,
            "projection": projection,
            "monte_carlo_projection": monte_carlo_projection,
            "virtual_self_profile": virtual_self,
            "explanation": explanation,
            "decision_simulation": decision_simulation
        }
        logger.info("Analysis complete — score: %.1f, skills detected: %d",
                    compatibility_score, len(detected_skills))
        return jsonify(result)
    
    except Exception as e:
        logger.exception("Error during analysis: %s", str(e))
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


# -----------------------------------------
# Run Server
# -----------------------------------------
# -----------------------------------------
# Global error handlers (production safety)
# -----------------------------------------
@app.errorhandler(Exception)
def handle_exception(e):
    logger.exception("Unhandled exception in request: %s %s", request.method, request.path)
    return jsonify({"error": "An internal server error occurred. Please try again."}), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(413)
def request_too_large(e):
    return jsonify({"error": "File too large. Please upload a PDF under 10 MB."}), 413


if __name__ == "__main__":
    app.run(debug=True)