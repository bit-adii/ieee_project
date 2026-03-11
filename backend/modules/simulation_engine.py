from modules.skill_extractor import SKILLS


def simulate_growth(current_score, user_skill_vector, role_data):
    """
    Simulates 5-year compatibility growth
    based on missing required skills.
    """

    missing_count = 0

    for i, skill in enumerate(SKILLS):
        if skill in role_data["required_skills"] and user_skill_vector[i] == 0:
            missing_count += 1

    projection = []

    for year in range(1, 6):
        improvement = year * (missing_count * 2.5)
        new_score = min(current_score + improvement, 100)

        projection.append({
            "year": year,
            "compatibility": round(new_score, 2)
        })

    return projection