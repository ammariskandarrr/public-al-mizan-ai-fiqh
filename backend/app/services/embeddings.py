"""
Embeddings Service

Handles OpenAI embeddings generation.
"""

from typing import List
from openai import OpenAI

from app.config import OPENAI_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS


# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple texts in batch.
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of embedding vectors
    """
    # Clean texts
    cleaned_texts = []
    for text in texts:
        cleaned = text.replace("\n", " ").strip()
        if len(cleaned) > 8000:
            cleaned = cleaned[:8000]
        cleaned_texts.append(cleaned)
    
    # Generate embeddings
    response = openai_client.embeddings.create(
        input=cleaned_texts,
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIMENSIONS
    )
    
    return [item.embedding for item in response.data]


def generate_embedding_single(text: str) -> List[float]:
    """
    Generate embedding for a single text.
    
    Args:
        text: Text string to embed
        
    Returns:
        Embedding vector
    """
    text = text.replace("\n", " ").strip()
    if len(text) > 8000:
        text = text[:8000]
    
    response = openai_client.embeddings.create(
        input=[text],
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIMENSIONS
    )
    
    return response.data[0].embedding
