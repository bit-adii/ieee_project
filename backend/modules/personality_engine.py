def calculate_personality_vector(answers):
    """
    Converts questionnaire answers (1–5 scale)
    into structured personality vector.

    Vector Structure:
    [Openness, Conscientiousness, Extraversion, Stability, Technical Depth]
    """

    openness = (answers[2] + answers[9]) / 2 * 20
    conscientiousness = (answers[0] + answers[3]) / 2 * 20
    extraversion = (answers[1] + answers[6]) / 2 * 20
    stability = answers[4] * 20
    technical_depth = (answers[7] + answers[0]) / 2 * 20

    return [
        round(openness, 2),
        round(conscientiousness, 2),
        round(extraversion, 2),
        round(stability, 2),
        round(technical_depth, 2)
    ]