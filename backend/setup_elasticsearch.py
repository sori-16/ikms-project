from elasticsearch import Elasticsearch
import os

# Connect to Elasticsearch
# User will need to provide ES_HOST/ES_PASSWORD/ES_USER in env vars or defaults
es = Elasticsearch(
    os.environ.get('ES_HOST', 'http://localhost:9200'),
    basic_auth=(os.environ.get('ES_USER', 'elastic'), os.environ.get('ES_PASSWORD', 'changeme'))
)

INDEX_NAME = 'research_papers'

def create_index():
    if es.indices.exists(index=INDEX_NAME):
        print(f"Index '{INDEX_NAME}' already exists.")
        return

    # Define settings and mappings
    settings = {
        "analysis": {
            "filter": {
                "medical_synonyms": {
                    "type": "synonym",
                    "synonyms": [
                        "cardiac, heart",
                        "renal, kidney",
                        "hepatic, liver",
                        "pulmonary, lung",
                        "neoplasm, tumor, cancer"
                    ]
                }
            },
            "analyzer": {
                "medical_analyzer": {
                    "tokenizer": "standard",
                    "filter": [
                        "lowercase",
                        "medical_synonyms"
                    ]
                }
            }
        }
    }

    mappings = {
        "properties": {
            "title": {"type": "text", "analyzer": "medical_analyzer"},
            "abstract": {"type": "text", "analyzer": "medical_analyzer"},
            "full_text": {"type": "text", "analyzer": "medical_analyzer"},
            "keywords": {"type": "keyword"},
            "topics": {"type": "keyword"},
            "upload_date": {"type": "date"}
        }
    }

    response = es.indices.create(index=INDEX_NAME, settings=settings, mappings=mappings)
    print(f"Index '{INDEX_NAME}' created:", response)

if __name__ == '__main__':
    try:
        if es.ping():
            print("Connected to Elasticsearch")
            create_index()
        else:
            print("Could not connect to Elasticsearch. Is it running?")
    except Exception as e:
        print(f"Error connecting to Elasticsearch: {e}")
