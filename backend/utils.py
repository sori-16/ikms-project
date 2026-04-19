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

# Handle spaCy model lazily to prevent startup hang
_nlp = None

def get_nlp():
    global _nlp
    if _nlp is None:
        try:
            print("Loading spaCy language model (en_core_web_sm)...", flush=True)
            _nlp = spacy.load("en_core_web_sm")
            print("spaCy model loaded.", flush=True)
        except OSError:
            print("Downloading spaCy language model for the first time...", flush=True)
            from spacy.cli import download
            download("en_core_web_sm")
            _nlp = spacy.load("en_core_web_sm")
            print("spaCy model downloaded and loaded.", flush=True)
    return _nlp

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
    # Limit text size to prevent spaCy E088 memory overflow on massive PDFs
    if len(text) > 500000:
        text = text[:500000]
        
    # Lowercase
    text = text.lower()
    
    # Process with spaCy (tokenization)
    nlp = get_nlp()
    doc = nlp(text)
    
    # Filter tokens
    cleaned_tokens = []
    for token in doc:
        # Keep only alphabetic tokens, remove stopwords
        if token.is_alpha and not token.is_stop:
            cleaned_tokens.append(token.text)
    
    return " ".join(cleaned_tokens)
