"""Retrieval layers.

Phase 1: semantic-only via FAISS.
Phase 2: hybrid — combines BM25 keyword scores with semantic similarity.
"""
from typing import List, Dict, Tuple
import re
from rank_bm25 import BM25Okapi
from config import TOP_K
from src.embedder import embed
from src.vector_store import FaissStore
from src.loader import incident_to_text


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[A-Za-z0-9_]+", text.lower())


class Retriever:
    """Pure semantic retrieval (Phase 1)."""

    def __init__(self, store: FaissStore):
        self.store = store

    def retrieve(self, query: str, top_k: int = TOP_K) -> List[Tuple[Dict, float]]:
        query_vec = embed([query])
        hits = self.store.search(query_vec, top_k=top_k)
        # Convert L2 distance -> similarity score in [0, 1]
        return [(meta, 1.0 / (1.0 + dist)) for meta, dist in hits]


class HybridRetriever:
    """Phase 2: BM25 + semantic, weighted.

    score = alpha * semantic_sim + (1 - alpha) * bm25_norm
    """

    def __init__(self, store: FaissStore, alpha: float = 0.6):
        self.store = store
        self.alpha = alpha
        corpus = [incident_to_text(m) for m in store.metadata]
        self.tokenized_corpus = [_tokenize(c) for c in corpus]
        self.bm25 = BM25Okapi(self.tokenized_corpus)

    def retrieve(self, query: str, top_k: int = TOP_K) -> List[Tuple[Dict, float]]:
        # Semantic side: get full ranking over the corpus
        query_vec = embed([query])
        n = len(self.store.metadata)
        all_hits = self.store.search(query_vec, top_k=n)
        sem_score_by_id = {
            m["id"]: 1.0 / (1.0 + dist) for m, dist in all_hits
        }

        # BM25 side
        bm25_scores = self.bm25.get_scores(_tokenize(query))
        bm25_max = float(bm25_scores.max()) if bm25_scores.size and bm25_scores.max() > 0 else 1.0
        bm25_norm = bm25_scores / bm25_max

        combined: List[Tuple[Dict, float]] = []
        for i, meta in enumerate(self.store.metadata):
            sem = sem_score_by_id.get(meta["id"], 0.0)
            score = self.alpha * sem + (1 - self.alpha) * float(bm25_norm[i])
            combined.append((meta, score))

        combined.sort(key=lambda x: x[1], reverse=True)
        return combined[:top_k]
