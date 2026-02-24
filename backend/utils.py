"""
IKMS Utility Functions
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION

This file contains:
- extract_text_from_pdf: Extract text from PDF files
- clean_text: Preprocess text (lowercase, remove stopwords)
"""

import fitz  # PyMuPDF
import spacy
import string
import os

# Load English tokenizer, tagger, parser and NER
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading language model for the first time...")
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def extract_text_from_pdf(filepath):
    """
    Extracts raw text from a PDF file using PyMuPDF.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    doc = fitz.open(filepath)
    text = ""
    for page in doc:
        text += page.get_text()
    
    return text

def clean_text(text):
    """
    Cleans text: lowercase, remove punctuation, remove stopwords.
    Returns cleaned text string.
    """
    # Lowercase
    text = text.lower()
    
    # Process with spaCy (tokenization)
    doc = nlp(text)
    
    # Filter tokens
    cleaned_tokens = []
    for token in doc:
        # Keep only alphabetic tokens, remove stopwords
        if token.is_alpha and not token.is_stop:
            cleaned_tokens.append(token.text)
    
    return " ".join(cleaned_tokens)
