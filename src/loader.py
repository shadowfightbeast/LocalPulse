"""Phase 1: Load incidents from data/incidents.json."""
import json
from typing import List, Dict
from config import INCIDENTS_PATH


def load_incidents() -> List[Dict]:
    with open(INCIDENTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def incident_to_text(incident: Dict) -> str:
    return (
        f"Error: {incident['error']}\n"
        f"Root Cause: {incident['root_cause']}\n"
        f"Fix: {incident['fix']}\n"
        f"Tags: {', '.join(incident.get('tags', []))}"
    )
