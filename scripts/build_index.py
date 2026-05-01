"""Phase 1: build the FAISS index from data/incidents.json. Run once after editing the dataset."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.loader import load_incidents, incident_to_text
from src.embedder import embed
from src.vector_store import FaissStore


def main():
    incidents = load_incidents()
    texts = [incident_to_text(i) for i in incidents]
    vectors = embed(texts)
    store = FaissStore()
    store.build(vectors, incidents)
    store.save()
    print(f"Indexed {len(incidents)} incidents.")


if __name__ == "__main__":
    main()
