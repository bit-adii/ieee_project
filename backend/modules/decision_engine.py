def simulate_decision_scenario(personality_vector, scenario):

    openness, conscientiousness, extraversion, stability, technical_depth = personality_vector

    if scenario == "startup_risk":
        if openness > 70 and stability > 60:
            return "Your virtual self is likely to take the startup risk confidently."
        else:
            return "Your virtual self may hesitate due to risk sensitivity."

    if scenario == "corporate_job":
        if conscientiousness > 70:
            return "Your virtual self would likely perform well in structured corporate environments."
        else:
            return "Your virtual self may feel constrained in rigid corporate structures."

    return "Scenario not recognized."