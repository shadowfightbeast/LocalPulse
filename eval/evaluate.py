"""Phase 7: Full evaluation — retrieval accuracy + answer relevance.

Two modes:
  python eval/evaluate.py           — retrieval only (fast, no LLM)
  python eval/evaluate.py --full    — retrieval + answer relevance (calls LLM)

Metrics:
  Retrieval : Top-1 accuracy, Top-3 accuracy, MRR
  Relevance : keyword hit rate per answer (how many expected keywords appear)
"""
import sys
import json
import argparse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.vector_store import FaissStore
from src.retriever import HybridRetriever
from src.parser import parse_log_line, to_query_text
from src.ranker import rank
from src.pipeline import answer as run_pipeline

GOLDEN_PATH = Path(__file__).parent / "golden_set.json"


def _keyword_hit_rate(text: str, keywords: list) -> float:
    if not keywords:
        return 0.0
    text_lower = text.lower()
    hits = sum(1 for kw in keywords if kw.lower() in text_lower)
    return hits / len(keywords)


def _retrieve_ranked(case, retriever):
    parsed = parse_log_line(case["query"])
    search_text = to_query_text(parsed)
    raw = retriever.retrieve(search_text, top_k=5)
    tags = [parsed[k].lower() for k in ("service", "error_type") if k in parsed]
    ranked = rank(raw, query_tags=tags)
    return [m["id"] for m, _ in ranked]


def _score_retrieval(ids, expected):
    pos = ids.index(expected) + 1 if expected in ids else None
    return pos, (1.0 / pos if pos else 0.0)


def retrieval_eval(tests, retriever):
    top1 = top3 = 0
    rr_sum = 0.0
    rows = []

    for case in tests:
        ids = _retrieve_ranked(case, retriever)
        expected = case["expected_id"]
        rank_pos, rr = _score_retrieval(ids, expected)
        rr_sum += rr
        top1 += rank_pos == 1
        top3 += bool(rank_pos and rank_pos <= 3)
        rows.append((case["query"][:52], expected, ids[:3], rank_pos))

    n = len(tests)
    print("\n── Retrieval Results ─────────────────────────────────────────────────────")
    print(f"{'Query':<55} {'Expected':<10} {'Top-3 IDs':<32} Rank")
    print("─" * 105)
    for q, exp, top, pos in rows:
        flag = "✓" if pos and pos <= 3 else "✗"
        print(f"{flag} {q:<54} {exp:<10} {str(top):<32} {pos or 'MISS'}")
    print("─" * 105)
    print(f"  Top-1 accuracy : {top1}/{n} = {100*top1/n:.1f}%")
    print(f"  Top-3 accuracy : {top3}/{n} = {100*top3/n:.1f}%")
    print(f"  MRR            : {rr_sum/n:.3f}")
    return {"top1": top1/n, "top3": top3/n, "mrr": rr_sum/n}


def relevance_eval(tests):
    retrieval_hits = 0
    fix_scores = []
    rows = []

    for case in tests:
        result = run_pipeline(case["query"], top_k=3)
        answer_text = result["answer"]
        # keyword hit rate against expected_keywords (context) and fix keywords
        ctx_rate = _keyword_hit_rate(answer_text, case.get("expected_keywords", []))
        fix_rate = _keyword_hit_rate(answer_text, case.get("expected_fix_keywords", []))
        combined = (ctx_rate + fix_rate) / 2
        fix_scores.append(combined)
        # also check if expected incident was retrieved
        retrieved_ids = [m["id"] for m, _ in result["retrieved"]]
        hit = case["expected_id"] in retrieved_ids
        if hit:
            retrieval_hits += 1
        rows.append((case["query"][:45], f"{ctx_rate:.0%}", f"{fix_rate:.0%}", f"{combined:.0%}", "✓" if hit else "✗"))

    n = len(tests)
    print("\n── Answer Relevance ──────────────────────────────────────────────────────")
    print(f"{'Query':<48} {'Ctx%':<7} {'Fix%':<7} {'Avg%':<7} Retrieved")
    print("─" * 80)
    for q, ctx, fix, avg, hit in rows:
        print(f"{q:<48} {ctx:<7} {fix:<7} {avg:<7} {hit}")
    print("─" * 80)
    avg_score = sum(fix_scores) / n
    print(f"  Avg answer relevance : {avg_score:.1%}")
    print(f"  Expected ID in top-3 : {retrieval_hits}/{n} = {100*retrieval_hits/n:.1f}%")
    return {"avg_relevance": avg_score, "retrieval_hit_rate": retrieval_hits/n}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true", help="Also run answer relevance eval (calls LLM)")
    args = parser.parse_args()

    with open(GOLDEN_PATH, "r", encoding="utf-8") as f:
        tests = json.load(f)

    print(f"Golden set: {len(tests)} queries")

    if not args.full:
        store = FaissStore()
        store.load()
        retriever = HybridRetriever(store)
        retrieval_eval(tests, retriever)
        print("\nTip: run with --full to also measure answer relevance (uses LLM, ~2 min).")
    else:
        print("Running full eval (retrieval + LLM answer relevance)...\n")
        store = FaissStore()
        store.load()
        retriever = HybridRetriever(store)
        retrieval_eval(tests, retriever)
        relevance_eval(tests)


if __name__ == "__main__":
    main()
