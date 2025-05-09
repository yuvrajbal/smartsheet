from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing  import List
from llm import handle_request
from schemas import  CompletionRequest, CompletionResponse 
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

print("Starting FastAPI application...")

app = FastAPI()

# Add CORS middleware to allow cross-origin requests
# For development - allows all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins - use for development,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

print("Middleware configured successfully")

@app.post("/api/generate-column", response_model=CompletionResponse)
def generate_completion(req:CompletionRequest):
  try:
    print(f"Received request with prompt: {req.prompt}, tool type: {req.toolType}")
    result = handle_request(req.prompt, req.sourceData, req.columnNames, req.toolType)
    print("Request processed successfully")
    return result
  except Exception as e:
    print(f"Error processing request: {str(e)}")
    raise HTTPException(status_code= 500, detail = str(e))
  

print("API endpoints registered")

if __name__ == "__main__":
  print("Starting server...")
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
  print("Server stopped")