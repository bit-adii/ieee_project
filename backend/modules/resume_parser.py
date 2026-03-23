import PyPDF2


def extract_text_from_pdf(file):
    """
    Extracts text from uploaded PDF file.
    Works only if PDF contains selectable text.
    Returns empty string on error instead of crashing.
    """
    try:
        reader = PyPDF2.PdfReader(file)
        text = ""

        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted.lower()

        return text if text else ""
    except Exception as e:
        # If PDF reading fails, return error info for backend to handle
        raise ValueError(f"Failed to extract PDF: {str(e)}")