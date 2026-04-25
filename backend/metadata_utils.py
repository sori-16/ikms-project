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
    2. Scan for 'by [Authors]' patterns in the first 3000 chars.
    """
    authors_found = []
    
    # 1. Check Metadata
    meta_author = doc_metadata.get('author', '').strip()
    if meta_author:
        # Split by comma/semicolon/and
        candidate_list = re.split(r'[,;&]| and ', meta_author)
        authors_found = [a.strip() for a in candidate_list if len(a.strip()) > 3]
        
    if authors_found:
        # Filter out common software names that end up in metadata
        noise = ['adobe', 'microsoft', 'pagemaker', 'writer', 'distiller']
        authors_found = [a for a in authors_found if not any(x in a.lower() for x in noise)]
        if authors_found:
            return authors_found
        
    # 2. Text-based heuristic: Find names after "by"
    # Look for "by " followed by Capitalized names until a newline or header
    search_area = text[:3000]
    # This regex looks for "by " followed by words starting with Capital letters, allowing for commas and "and"
    by_pattern = re.compile(r'\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s*(?:,|\band\b)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)*)', re.UNICODE)
    
    match = by_pattern.search(search_area)
    if match:
        author_string = match.group(1)
        # Split by comma and 'and'
        names = re.split(r'[,]| and ', author_string)
        authors_found = [n.strip() for n in names if len(n.strip()) > 3 and n.strip().count(' ') >= 1]
        
    return authors_found

def extract_year(text, doc_metadata):
    """
    Heuristic to extract publication year.
    1. Scan for years near 'date', 'published', 'copyright', 'release'.
    2. Check PDF metadata dates.
    3. Take the first 20xx year found.
    """
    search_area = text[:3000]
    
    # 1. Keyword proximity search
    keywords = ['published', 'release', 'date', 'copyright', '©']
    for kw in keywords:
        # Look for the keyword then a 20xx year within 40 characters
        kw_pattern = re.compile(re.escape(kw) + r'.{0,40}\b(20[0-2][0-9])\b', re.IGNORECASE | re.DOTALL)
        match = kw_pattern.search(search_area)
        if match:
            year = int(match.group(1))
            if year <= datetime.now().year:
                return year

    # 2. Metadata fallback
    creation_date = parse_pdf_date(doc_metadata.get('creationDate'))
    if creation_date:
        return creation_date.year
        
    # 3. First 20xx year mentioned (usually on the cover)
    year_pattern = re.compile(r'\b(20[0-2][0-9])\b')
    matches = year_pattern.findall(search_area)
    if matches:
        valid_years = [int(y) for y in matches if int(y) <= datetime.now().year]
        if valid_years:
            return valid_years[0]
            
    return datetime.now().year
