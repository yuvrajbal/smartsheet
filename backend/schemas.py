from pydantic import BaseModel
from typing import Dict, List, Optional, Any

class CompletionRequest(BaseModel):
    columnNames: List[str]
    sourceData: Dict[str, List[str]]
    prompt: str
    toolType: str
    

class ResponseItem(BaseModel):
    response: str

class CompletionResponse(BaseModel):
    results: List[ResponseItem]




