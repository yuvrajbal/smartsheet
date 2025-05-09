import json
from typing import Dict, List, Any

# Common system prompt used by both LLM and web search functions
SYSTEM_PROMPT = """You are a helpful assistant that analyzes data and provides structured responses.
For each row in the data, you will create ONE object with 'response' as the key that contains your result.
Give your analysis only is requested else stick to one word responses
Do NOT repeat the input data in your response.

Return your answer as a JSON array of objects, where each object has a 'response' key with your analysis for that row.
Example format:
[
    {"response": "result for row 1"},
    {"response": "result for row 2"},
    ...
]
"""

def process_columnar_data(source_data: Dict[str, List[Any]], column_names: List[str]) -> List[Dict[str, Any]]:
    """
    Process columnar data into a list of row objects
    
    Args:
        source_data: Dictionary with column names as keys and lists of values
        column_names: List of column names to include
        
    Returns:
        List of dictionaries, each representing a row with the specified columns
    """
    rows = []
    if not source_data or not column_names:
        return rows
        
    # Get the length of the first column to determine number of rows
    try:
        first_col = next(iter(source_data.values()))
        if not isinstance(first_col, list):
            return rows
            
        num_rows = len(first_col)
        
        # Create a row object for each entry
        for i in range(num_rows):
            row = {}
            for col_name in column_names:
                if col_name in source_data and i < len(source_data[col_name]):
                    row[col_name] = source_data[col_name][i]
            rows.append(row)
        
        return rows
    except (StopIteration, IndexError, TypeError):
        # Return empty list on error
        return []

def parse_response(result: str) -> dict:
    """
    Parse the response from LLM or web search and ensure consistent format
    
    Args:
        result: The raw text response from the model
        
    Returns:
        Dictionary with results in consistent format
    """
    try:
        parsed_result = json.loads(result)
        print(f"DEBUG: Parsed result: {parsed_result}")
        
        # Return consistent structure
        if not isinstance(parsed_result, list):
            return {"results": [parsed_result]}
        else:
            return {"results": parsed_result}
    except json.JSONDecodeError:
        # Ensure we always return a consistent structure
        return {"results": [{"response": result}]}

def format_prompt_with_data(prompt: str, data: Dict[str, List[str]], column_names: List[str], is_web_search: bool = False) -> str:
    """
    Format a prompt with structured data
    
    Args:
        prompt: The user prompt/question
        data: Dictionary with column names as keys and lists of values
        column_names: List of column names to include
        is_web_search: Whether this is for web search (uses different format)
        
    Returns:
        Formatted prompt with data context
    """
    # Process columnar data into rows
    rows = process_columnar_data(data, column_names)
    
    # Use different formatting for web search vs regular LLM query
    if is_web_search:
        return f"{prompt}\n\nContext Data:\nColumns: {column_names}\nData: {rows}"
    else:
        return f"{prompt}\n\nColumns: {column_names}\nData: {rows}" 