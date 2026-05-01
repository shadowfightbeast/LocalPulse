"""Phase 3: Log parser — turns raw log lines into structured fields.

Handles a few common formats:
  2025-01-01 ERROR PaymentService NullPointerException at line 45
  [2025-01-01T10:24:00Z] [ERROR] PaymentService - NullPointerException
  ERROR: PaymentService.processPayment threw NullPointerException at line 45

If parsing fails, returns the raw text under `raw` so retrieval still works.
"""
import re
from typing import Dict, Optional


SEVERITIES = ("CRITICAL", "ERROR", "WARN", "WARNING", "INFO", "DEBUG", "TRACE", "FATAL")

# Common Java/Python exception suffixes
ERROR_TYPE_RE = re.compile(
    r"\b([A-Z][A-Za-z0-9]*(?:Exception|Error|Timeout|Refused|Violation))\b"
)
SERVICE_RE = re.compile(r"\b([A-Z][A-Za-z0-9]+(?:Service|API|Client|Consumer|Generator|Pipeline|Store|Gateway))\b")
LINE_RE = re.compile(r"\bline[:\s]+(\d+)\b", re.IGNORECASE)
TIMESTAMP_RE = re.compile(
    r"\b(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\b"
)


def _find_severity(line: str) -> Optional[str]:
    upper = line.upper()
    for sev in SEVERITIES:
        if re.search(rf"\b{sev}\b", upper):
            return "WARN" if sev == "WARNING" else sev
    return None


def parse_log_line(line: str) -> Dict:
    line = line.strip()
    out: Dict = {"raw": line}

    if (m := TIMESTAMP_RE.search(line)):
        out["timestamp"] = m.group(1)
    if (sev := _find_severity(line)):
        out["severity"] = sev
    if (m := SERVICE_RE.search(line)):
        out["service"] = m.group(1)
    if (m := ERROR_TYPE_RE.search(line)):
        out["error_type"] = m.group(1)
    if (m := LINE_RE.search(line)):
        out["line"] = int(m.group(1))

    return out


def to_query_text(parsed: Dict) -> str:
    """Build a retrieval-friendly query string from parsed fields."""
    parts = []
    if "service" in parsed:
        parts.append(parsed["service"])
    if "error_type" in parsed:
        parts.append(parsed["error_type"])
    if "severity" in parsed:
        parts.append(parsed["severity"])
    parts.append(parsed["raw"])
    return " ".join(parts)
