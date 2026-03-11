def build_virtual_self_profile(personality_vector):
    """
    Converts personality vector into
    human-readable behavioral identity.
    """

    openness, conscientiousness, extraversion, stability, technical_depth = personality_vector

    profile = {}

    profile["risk_appetite"] = (
        "High" if openness > 70 else
        "Moderate" if openness > 50 else
        "Low"
    )

    profile["work_style"] = (
        "Highly Structured" if conscientiousness > 75 else
        "Balanced" if conscientiousness > 55 else
        "Flexible"
    )

    profile["social_orientation"] = (
        "Team-Oriented" if extraversion > 65 else
        "Independent"
    )

    profile["pressure_handling"] = (
        "Calm Under Pressure" if stability > 70 else
        "Stress Sensitive"
    )

    profile["technical_identity"] = (
        "Deep Technical Builder" if technical_depth > 70 else
        "Balanced Professional"
    )

    return profile