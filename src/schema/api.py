from pydantic import BaseModel
from typing import List, Optional

class DiagnoseRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class SaveIncidentRequest(BaseModel):
    error: str
    root_cause: str
    fix: str
    tags: Optional[List[str]] = []
    service: Optional[str] = ""
    severity: Optional[str] = "ERROR"

class DiagnoseResponse(BaseModel):
    answer: str
    confidence: float
    parsed: dict
    retrieved: List[dict]
