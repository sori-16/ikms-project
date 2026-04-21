import re
import fitz # PyMuPDF
from datetime import datetime

def parse_pdf_date(date_str):
    """
    Parses PDF date format: D:20230510123456+03'00'
    Returns a datetime object or None
    """
    if not date_str:
        return None
    
    # Strip prefix 'D:'
    clean_date = date_str.replace('D:', '')
    
    # Take first 8 digits (YYYYMMDD) or first 4 (YYYY)
    try:
        if len(clean_date) >= 8:
            return datetime.strptime(clean_date[:8], "%Y%m%d")
        elif len(clean_date) >= 4:
            return datetime.strptime(clean_date[:4], "%Y")
    except:
        pass
    return None

def extract_abstract(text):
    """
    Heuristic to extract abstract from raw text.
    Look for 'Abstract' and extract until 'Introduction' or 'I. INTRODUCTION'
    """
    if not text:
        return ""
        
    # Search for Abstract keyword (case insensitive)
    # We look in the first 10000 characters to be safe
    search_area = text[:10000]
    
    # Pattern to find 'Abstract' and capture everything until 'Introduction' or similar
    pattern = re.compile(r'abstract[\s\:]+(.*?)(?=\n[0-9\. ]*(?:introduction|i\.\s+introduction|keywords|key\s+words))', re.IGNORECASE | re.DOTALL)
    
    match = pattern.search(search_area)
    if match:
        abstract = match.group(1).strip()
        # Clean up double newlines or weird formatting
        return " ".join(abstract.split())
    
    # Fallback: if we found Abstract but not the next header, take up to 2000 chars
    start_match = re.search(r'abstract[\s\:]+', search_area, re.IGNORECASE)
    if start_match:
        return " ".join(search_area[start_match.end():start_match.end()+2000].split())
        
    # Last fallback: naive slice
    return text[:800].strip()

def extract_authors(text, doc_metadata):
    """
    Heuristic to extract authors.
    1. Check PDF metadata first.
    2. Fallback to scanning text near the top.
    """
    authors_found = []
    
    # 1. Check Metadata
    meta_author = doc_metadata.get('author', '').strip()
    if meta_author:
        # Split by comma/semicolon/and
        candidate_list = re.split(r'[,;&]| and ', meta_author)
        authors_found = [a.strip() for a in candidate_list if len(a.strip()) > 3]
        
    if authors_found:
        return authors_found
        
    # 2. Text-based heuristic
    # Usually authors are between Title and Abstract
    # This is very messy so we use a weak fallback
    return [] # Better to return empty than noise for now, unless we find a clear pattern

def extract_year(text, doc_metadata):
    """
    Heuristic to extract publication year.
    1. Check PDF metadata dates.
    2. Scan first few pages for 4-digit years.
    """
    # 1. Metadata
    creation_date = parse_pdf_date(doc_metadata.get('creationDate'))
    if creation_date:
        return creation_date.year
        
    # 2. Regex scan (look for 20xx in the first 2000 chars)
    # Look for years between 2000 and 2026
    year_pattern = re.compile(r'\b(20[0-2][0-9])\b')
    matches = year_pattern.findall(text[:2000])
    if matches:
        # Try to find the most frequent or highest year that isn't in the future
        valid_years = [int(y) for y in matches if int(y) <= datetime.now().year]
        if valid_years:
            return max(valid_years)
            
    return datetime.now().year
