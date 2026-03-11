from sklearn.metrics.pairwise import cosine_similarity
from modules.skill_extractor import SKILLS


def compute_overall_compatibility(user_skill_vector,
                                  user_personality_vector,
                                  role_data):

    role_skill_vector = []
    missing_skills = []

    for i, skill in enumerate(SKILLS):
        if skill in role_data["required_skills"]:
            role_skill_vector.append(1)

            if user_skill_vector[i] == 0:
                missing_skills.append(skill)
        else:
            role_skill_vector.append(0)

    role_personality_vector = role_data["personality_vector"]

    skill_similarity = cosine_similarity(
        [user_skill_vector],
        [role_skill_vector]
    )[0][0]

    personality_similarity = cosine_similarity(
        [user_personality_vector],
        [role_personality_vector]
    )[0][0]

    # 🔥 Skill importance weighting
    weighted_skill_score = skill_similarity * role_data.get("skill_weight", 0.6)

    weighted_personality_score = personality_similarity * role_data.get("personality_weight", 0.4)

    final_score = weighted_skill_score + weighted_personality_score

    return round(final_score * 100, 2), missing_skills