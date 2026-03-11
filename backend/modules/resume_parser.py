import PyPDF2


def extract_text_from_pdf(file):
    """
    Extracts text from uploaded PDF file.
    Works only if PDF contains selectable text.
    """

    reader = PyPDF2.PdfReader(file)
    text = ""

    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted.lower()

    return text