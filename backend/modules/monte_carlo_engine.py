import numpy as np

def monte_carlo_growth(current_score, user_skill_vector, role_data, simulations=1000, years=5):
    """
    Runs Monte Carlo simulations to model uncertain career growth.
    Returns mean trajectory + confidence bands.
    """

    required_skills = role_data["required_skills"]

    # count missing skills
    missing_count = sum(1 for skill in required_skills)

    all_paths = []

    for _ in range(simulations):

        score = current_score
        path = []

        for year in range(1, years + 1):

            # random improvement
            random_factor = np.random.normal(loc=2.5, scale=1.0)

            improvement = max(0, random_factor * (missing_count * 0.1))

            score = min(100, score + improvement)

            path.append(score)

        all_paths.append(path)

    all_paths = np.array(all_paths)

    mean_projection = np.mean(all_paths, axis=0)
    lower_bound = np.percentile(all_paths, 5, axis=0)
    upper_bound = np.percentile(all_paths, 95, axis=0)
    best_case = np.max(all_paths, axis=0)
    worst_case = np.min(all_paths, axis=0)

    return {
        "mean_projection": mean_projection.round(2).tolist(),
        "confidence_90_lower": lower_bound.round(2).tolist(),
        "confidence_90_upper": upper_bound.round(2).tolist(),
        "best_case": best_case.round(2).tolist(),
        "worst_case": worst_case.round(2).tolist()
    }