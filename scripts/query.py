"""CLI to query the system. Usage: python scripts/query.py "<error text>" """
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.pipeline import answer


def main():
    if len(sys.argv) < 2:
        print('Usage: python scripts/query.py "<error text>"')
        sys.exit(1)
    query = " ".join(sys.argv[1:])
    result = answer(query)

    print("\n=== Parsed log fields ===")
    print(json.dumps(result["parsed"], indent=2))

    print("\n=== Retrieved incidents (ranked) ===")
    for inc, score in result["retrieved"]:
        print(f"  [{inc['id']}] {inc['error']}")
        print(f"      score={score:.3f}  tags={inc.get('tags', [])}")

    print(f"\n=== Confidence: {result['confidence']}% ===")
    print("\n=== Answer ===")
    print(result["answer"])


if __name__ == "__main__":
    main()
