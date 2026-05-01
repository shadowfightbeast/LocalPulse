"""Phase 1: FAISS-backed vector store. Stub — fill in build/save/load/search."""
from pathlib import Path
from typing import List, Dict, Tuple
import json
import numpy as np
from config import VECTOR_DB_PATH


class FaissStore:
    def __init__(self):
        self.index = None
        self.metadata: List[Dict] = []

    def build(self, vectors: np.ndarray, metadata: List[Dict]) -> None:
        import faiss
        dim = vectors.shape[1]
        self.index = faiss.IndexFlatL2(dim)
        self.index.add(vectors)
        self.metadata = metadata

    def save(self, path: Path = VECTOR_DB_PATH) -> None:
        import faiss
        path.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(path / "index.faiss"))
        with open(path / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)

    def load(self, path: Path = VECTOR_DB_PATH) -> None:
        import faiss
        self.index = faiss.read_index(str(path / "index.faiss"))
        with open(path / "metadata.json", "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

    def search(self, query_vec: np.ndarray, top_k: int = 3) -> List[Tuple[Dict, float]]:
        distances, indices = self.index.search(query_vec, top_k)
        return [(self.metadata[i], float(d)) for i, d in zip(indices[0], distances[0])]
