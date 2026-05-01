"""Phase 4: Re-rank retrieved incidents and produce a confidence score.

Final score = 0.6 * retrieval_similarity + 0.2 * tag_match + 0.2 * recency
"""
from typing import List, Dict, Tuple
from datetime import datetime, timezone


W_SIMILARITY = 0.6
W_TAG = 0.2
W_RECENCY = 0.2


def _tag_overlap(query_tags: List[str], incident_tags: List[str]) -> float:
    if not query_tags or not incident_tags:
        return 0.0
    q = {t.lower() for t in query_tags}
    i = {t.lower() for t in incident_tags}
    return len(q & i) / len(q | i)


def _recency_score(timestamp: str | None, half_life_days: float = 90.0) -> float:
    if not timestamp:
        return 0.5
    try:
        ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        return 0.5
    age_days = (datetime.now(timezone.utc) - ts).total_seconds() / 86400.0
    return max(0.0, min(1.0, 0.5 ** (age_days / half_life_days)))


def rank(
    candidates: List[Tuple[Dict, float]],
    query_tags: List[str] | None = None,
) -> List[Tuple[Dict, float]]:
    query_tags = query_tags or []
    scored: List[Tuple[Dict, float]] = []
    for incident, sim in candidates:
        tag = _tag_overlap(query_tags, incident.get("tags", []))
        rec = _recency_score(incident.get("timestamp"))
        score = W_SIMILARITY * sim + W_TAG * tag + W_RECENCY * rec
        scored.append((incident, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored


def confidence(top_score: float) -> int:
    """Map the top combined score (roughly 0..1) to a 0–100 confidence percent."""
    return int(round(max(0.0, min(1.0, top_score)) * 100))
