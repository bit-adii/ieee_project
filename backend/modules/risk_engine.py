def compute_burnout_risk(personality_vector, role_data):

    stability = personality_vector[3]
    extraversion = personality_vector[2]

    role_stress_level = role_data.get("stress_level", 60)

    stress_gap = role_stress_level - stability

    if stress_gap < 10:
        level = "Low"
    elif stress_gap < 30:
        level = "Moderate"
    else:
        level = "High"

    risk_score = max(0, min(100, stress_gap))

    return {
        "burnout_risk_score": round(risk_score, 2),
        "burnout_risk_level": level
    }