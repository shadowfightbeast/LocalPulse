from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from src.pipeline import answer
from src.llm import unload
from config import API_PORT
import uvicorn

app = FastAPI(title="Incident Debugging Assistant API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiagnoseRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class Incident(BaseModel):
    id: str
    error: str
    service: Optional[str] = "?"
    severity: Optional[str] = "?"
    timestamp: Optional[str] = "?"
    tags: List[str] = []
    root_cause: str
    fix: str

class DiagnoseResponse(BaseModel):
    answer: str
    confidence: float
    parsed: dict
    retrieved: List[dict]

@app.post("/api/diagnose", response_model=DiagnoseResponse)
async def diagnose(request: DiagnoseRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        # result = {"answer": str, "confidence": int, "parsed": dict, "retrieved": List[(dict, score)]}
        result = answer(request.query, top_k=request.top_k)
        
        # Flatten the retrieved incidents for easier JSON serialization
        retrieved_list = []
        for inc, score in result["retrieved"]:
            inc_copy = inc.copy()
            inc_copy["score"] = float(score)
            retrieved_list.append(inc_copy)
            
        return {
            "answer": result["answer"],
            "confidence": float(result["confidence"]),
            "parsed": result["parsed"],
            "retrieved": retrieved_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

@app.on_event("shutdown")
def shutdown_event():
    print("Shutting down... Unloading model to free resources.")
    unload()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=API_PORT)
