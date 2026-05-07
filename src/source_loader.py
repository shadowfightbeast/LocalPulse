"""Phase 5: Multi-source loader.

Reads from data/sources/:
  runbooks/   — *.md  → split by H2/H3 section
  error_logs/ — *.log, *.txt → one chunk per non-empty line

Each chunk is a dict with:
  id, text, source_type, source_file, title (for runbooks)
"""
import re
from pathlib import Path
from typing import List, Dict
from config import ROOT_DIR

SOURCES_DIR = ROOT_DIR / "data" / "sources"


def _load_runbook(path: Path) -> List[Dict]:
    text = path.read_text(encoding="utf-8")
    chunks = []
    # Split on H2 (##) or H3 (###) headings
    sections = re.split(r"\n(?=#{2,3} )", text)
    for i, section in enumerate(sections):
        section = section.strip()
        if not section:
            continue
        lines = section.splitlines()
        title = lines[0].lstrip("#").strip()
        body = "\n".join(lines[1:]).strip()
        if len(body.split()) < 5:
            continue
        chunks.append({
            "id": f"RB-{path.stem}-{i}",
            "text": f"{title}\n{body}",
            "title": title,
            "source_type": "runbook",
            "source_file": path.name,
        })
    return chunks


def _load_error_log(path: Path) -> List[Dict]:
    chunks = []
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines()):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        chunks.append({
            "id": f"LOG-{path.stem}-{i}",
            "text": line,
            "title": line[:80],
            "source_type": "error_log",
            "source_file": path.name,
        })
    return chunks


def load_all_sources() -> List[Dict]:
    chunks: List[Dict] = []

    rb_dir = SOURCES_DIR / "runbooks"
    if rb_dir.exists():
        for f in sorted(rb_dir.glob("*.md")):
            chunks.extend(_load_runbook(f))

    log_dir = SOURCES_DIR / "error_logs"
    if log_dir.exists():
        for f in sorted(log_dir.glob("*.log")) :
            chunks.extend(_load_error_log(f))
        for f in sorted(log_dir.glob("*.txt")):
            chunks.extend(_load_error_log(f))

    return chunks
