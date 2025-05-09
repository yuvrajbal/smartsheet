import openai
import os
import json
import time
from dotenv import load_dotenv
from openai import OpenAI
from typing import Dict, List, Union, Any

from llm_helpers import (
    parse_response,
    format_prompt_with_data,
    SYSTEM_PROMPT
)

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI()

def handle_request(prompt: str, data: Dict[str, List[str]], column_names: List[str], tool_type: str = "llm", max_retries: int = 3, model: str = "gpt-4") -> dict:
    """
    Handle requests from frontend, supporting both LLM queries and web searches
    
    Args:
        prompt: The user prompt/question
        data: Dictionary with column names as keys and lists of values
        column_names: List of column names to include
        tool_type: Either "llm" or "websearch"
        max_retries: Maximum number of retries on failure
        model: The model to use (default: gpt-4)
        
    Returns:
        Dictionary with results and metadata
    """
    response_metadata = {
        "success": False,
        "retries": 0,
        "error": None,
        "error_type": None,
        "timestamp": time.time(),
        "request_id": f"{int(time.time() * 1000)}-{hash(prompt) % 10000}"
    }
    
    for attempt in range(max_retries):
        try:
            response_metadata["retries"] = attempt
            
            if tool_type.lower() == "websearch":
                result = query_web_search(prompt, data, column_names, model="gpt-4o")
            else:  
                result = query_llm(prompt, data, column_names, model=model)
                
            response_metadata["success"] = True
            response_metadata["error"] = None
            response_metadata["error_type"] = None
            
            return {
                **result,
                "metadata": response_metadata
            }
            
        except Exception as e:
            error_type = type(e).__name__
            error_message = str(e)
            
            response_metadata["error"] = error_message
            response_metadata["error_type"] = error_type
            
            # Different backoff strategies based on error type
            if "RateLimitError" in error_type:
                # Rate limits need longer backoff
                wait_time = 5 * (2 ** attempt)
            elif "Timeout" in error_type:
                # For timeouts, try again quickly
                wait_time = 1 * (attempt + 1)
            else:
                # Standard exponential backoff for other errors
                wait_time = 2 ** attempt
                
            if attempt < max_retries - 1:
                time.sleep(wait_time)
            else:
                # Return error response with empty results
                return {
                    "results": [],
                    "metadata": response_metadata,
                    "error_details": {
                        "message": f"Failed after {max_retries} attempts: {error_message}",
                        "type": error_type,
                        "request_id": response_metadata["request_id"]
                    }
                }

def query_llm(prompt: str, data: Dict[str, List[str]], column_names: List[str], model: str = "gpt-4") -> dict:
    """
    Query the LLM with structured data
    
    Args:
        prompt: The user prompt/question
        data: Dictionary with column names as keys and lists of values
        column_names: List of column names to include
        model: The model to use (default: gpt-4)
        
    Returns:
        Dictionary with structured results
    """
    
    # Use the common formatting function from helpers
    user_content = format_prompt_with_data(prompt, data, column_names)
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ],
        temperature=0.3,
        max_tokens=200
    )
    
    result = response.choices[0].message.content.strip()
    
    return parse_response(result)

def query_web_search(prompt: str, data: Dict[str, List[str]] = None, column_names: List[str] = None, model: str = "gpt-4o") -> dict:
    """
    Perform a web search based on the prompt with structured data context
    
    Args:
        prompt: The user prompt/question for web search
        data: Dictionary with column names as keys and lists of values
        column_names: List of column names to include
        model: The model to use for web search (default: gpt-4o)
        
    Returns:
        Dictionary with structured results from web search in the same format as query_llm
        
    Raises:
        Exception: Forwards any exceptions from the API for handling in handle_request
    """
    
    # Format the input with data context if provided
    if data and column_names:
        formatted_input = format_prompt_with_data(prompt, data, column_names, is_web_search=True)
    else:
        formatted_input = prompt
    
    try:
        response = client.responses.create(
            model=model,
            tools=[{"type": "web_search_preview"}],
            instructions=SYSTEM_PROMPT,
            input=formatted_input
        )
        
        result = response.output_text
        
        return parse_response(result)
            
    except Exception as e:
        error_type = type(e).__name__
        error_details = f"Web search error ({error_type}): {str(e)}"
        
        raise Exception(error_details) from e

