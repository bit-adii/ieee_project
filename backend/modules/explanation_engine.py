def generate_explanation(compatibility_score,
                         missing_skills,
                         virtual_self_profile):

    explanation = ""

    if compatibility_score > 75:
        explanation += "Your profile strongly aligns with this role. "
    elif compatibility_score > 50:
        explanation += "You have moderate alignment but need improvement. "
    else:
        explanation += "This role currently has low compatibility with your profile. "

    if missing_skills:
        explanation += f"Key areas to improve include: {', '.join(missing_skills[:5])}. "

    explanation += f"Based on your virtual self, you are {virtual_self_profile['technical_identity']} with a {virtual_self_profile['work_style']} approach."

    return explanation