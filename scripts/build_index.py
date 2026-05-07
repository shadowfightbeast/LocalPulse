"""Build the FAISS index from all sources:
  - data/incidents.json        (confirmed incidents)
  - data/sources/runbooks/     (*.md runbooks)
  - data/sources/error_logs/   (*.log / *.txt dumps)

Run after adding new files or incidents.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.loader import load_incidents, incident_to_text
from src.source_loader import load_all_sources
from src.embedder import embed
from src.vector_store import FaissStore


def main():
    all_docs = []
    all_texts = []

    # 1. Incidents
    incidents = load_incidents()
    for inc in incidents:
        all_docs.append(inc)
        all_texts.append(incident_to_text(inc))

    # 2. Runbooks + error log files
    sources = load_all_sources()
    for chunk in sources:
        doc = dict(chunk)
        doc.setdefault("error", chunk["title"])
        doc.setdefault("root_cause", "")
        doc.setdefault("fix", "")
        doc.setdefault("tags", [])
        all_docs.append(doc)
        all_texts.append(chunk["text"])

    vectors = embed(all_texts)
    store = FaissStore()
    store.build(vectors, all_docs)
    store.save()

    inc_count = len(incidents)
    src_count = len(sources)
    print(f"Indexed {inc_count} incidents + {src_count} source chunks = {inc_count + src_count} total.")


if __name__ == "__main__":
    main()
