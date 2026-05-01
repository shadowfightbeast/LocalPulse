"""Phase 7: retrieval accuracy eval. Top-1 / Top-3 / MRR over eval/test_queries.json.

Run:  python eval/evaluate.py
Skips the LLM call entirely — only retrieval + ranking are evaluated.
"""
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.vector_store import FaissStore
from src.retriever import HybridRetriever
from src.parser import parse_log_line, to_query_text
from src.ranker import rank


TEST_PATH = Path(__file__).parent / "test_queries.json"


def main():
    with open(TEST_PATH, "r", encoding="utf-8") as f:
        tests = json.load(f)

    store = FaissStore()
    store.load()
    retriever = HybridRetriever(store)

    top1 = top3 = 0
    rr_sum = 0.0
    rows = []

    for case in tests:
        parsed = parse_log_line(case["query"])
        search_text = to_query_text(parsed)
        raw = retriever.retrieve(search_text, top_k=5)
        query_tags = []
        if "service" in parsed:
            query_tags.append(parsed["service"].lower())
        if "error_type" in parsed:
            query_tags.append(parsed["error_type"].lower())
        ranked = rank(raw, query_tags=query_tags)
        ids = [m["id"] for m, _ in ranked]
        expected = case["expected_id"]

        rank_pos = ids.index(expected) + 1 if expected in ids else None
        rr_sum += (1.0 / rank_pos) if rank_pos else 0.0
        if rank_pos == 1:
            top1 += 1
        if rank_pos and rank_pos <= 3:
            top3 += 1
        rows.append((case["query"][:55], expected, ids[:3], rank_pos))

    n = len(tests)
    print(f"{'Query':<58} {'Expected':<10} {'Top-3':<30} Rank")
    print("-" * 110)
    for q, exp, top, pos in rows:
        print(f"{q:<58} {exp:<10} {str(top):<30} {pos if pos else '-'}")
    print("-" * 110)
    print(f"Top-1 accuracy : {top1}/{n} = {100*top1/n:.1f}%")
    print(f"Top-3 accuracy : {top3}/{n} = {100*top3/n:.1f}%")
    print(f"MRR            : {rr_sum/n:.3f}")


if __name__ == "__main__":
    main()
