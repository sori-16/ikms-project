from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Note: In a real production system, these models should be trained on a large corpus 
# and pickled/saved. For this project phase (and "cold start"), we will fit them 
# dynamically or assume a small batch processing. 
# To make it robust for single file uploads without a pre-existing corpus, 
# we will use a pre-set list of topics or lightweight extraction logic.

def extract_keywords(text, top_n=5):
    """
    Extracts top N keywords from the text using TF-IDF logic.
    Since we might not have a corpus yet, we'll treat the text as a single doc 
    and just extract high frequency non-stop words (which turns into simple TF).
    """
    if not text or not text.strip():
        return []

    # If we had a corpus, we would fit on that. 
    # Here, we fit on the single document to get terms.
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        
        # Get scores
        scores = tfidf_matrix.toarray().flatten()
        
        # Sort by score
        top_indices = scores.argsort()[-top_n:][::-1]
        keywords = [feature_names[i] for i in top_indices]
        
        return keywords
    except ValueError:
        # Fails if text is empty or only stopwords
        return []

def assign_topics(text, num_topics=3):
    """
    Assigns topics using LDA. 
    For a single document cold-start, LDA is tricky. 
    We will simulate topic assignment or use a mini-corpus if available in DB.
    
    For this phase, let's implement the logic assuming we can fit on this document 
    (which finds 'topics' within this doc) or return a placeholder until we have more data.
    """
    if not text or not text.strip():
        return []

    # Use CountVectorizer for LDA
    vectorizer = CountVectorizer(stop_words='english')
    try:
        dtm = vectorizer.fit_transform([text])
        
        # Fit LDA (trying to find 3 topics within this single document for now)
        lda = LatentDirichletAllocation(n_components=num_topics, random_state=42)
        lda.fit(dtm)
        
        # Get top words for each topic to label them
        feature_names = vectorizer.get_feature_names_out()
        topics = []
        
        for topic_idx, topic in enumerate(lda.components_):
            top_words_idx = topic.argsort()[:-4:-1] # Top 3 words per topic
            top_words = [feature_names[i] for i in top_words_idx]
            topic_label = f"Topic {topic_idx+1}: " + ", ".join(top_words)
            topics.append(topic_label)
            
        return topics
    except ValueError:
        return ["General"]

def find_recommendations(target_text, all_docs_data, top_n=5):
    """
    Finds top N similar documents using Cosine Similarity on TF-IDF vectors.
    
    Args:
        target_text (str): The text of the document we want recommendations for.
        all_docs_data (list of dict): List of other docs, e.g. [{'id': 1, 'text': '...'}, ...]
    
    Returns:
        list of doc_ids: IDs of the most similar documents.
    """
    if not target_text or not all_docs_data:
        return []

    # Prepare corpus: target_doc is first, followed by others
    corpus = [target_text] + [doc['text'] for doc in all_docs_data]
    doc_ids = [doc['id'] for doc in all_docs_data]
    
    try:
        # Vectorize
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Calculate cosine similarity between the first doc (target) and all others
        # cosine_similarity returns a matrix (1 x len(corpus))
        # We want the first row, sliced from index 1 to end (skipping the target itself similarity 1.0)
        similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        # Get top N indices
        # argsort sorts ascending, so we take last N and reverse
        if len(similarity_scores) == 0:
            return []
            
        top_indices = similarity_scores.argsort()[-top_n:][::-1]
        
        # Map back to doc IDs
        recommended_ids = []
        for idx in top_indices:
            # Filter out zero similarity if desired, or keep them
            if similarity_scores[idx] > 0:
                recommended_ids.append(doc_ids[idx])
                
        return recommended_ids
        
    except ValueError:
        return []
