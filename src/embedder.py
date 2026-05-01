"""Phase 1: Embedding generation. Default = SentenceTransformers (local, free)."""
from typing import List
import numpy as np
from config import EMBEDDING_PROVIDER, EMBEDDING_MODEL

_model = None


def _get_model():
    global _model
    if _model is None:
        if EMBEDDING_PROVIDER == "sentence-transformers":
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(EMBEDDING_MODEL)
        else:
            raise NotImplementedError(f"Provider {EMBEDDING_PROVIDER} not wired yet")
    return _model


def embed(texts: List[str]) -> np.ndarray:
    model = _get_model()
    return np.array(model.encode(texts, show_progress_bar=False), dtype="float32")
