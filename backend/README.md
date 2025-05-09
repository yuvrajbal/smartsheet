# LLM Data Analysis API

A modular API for analyzing structured data using both LLM-based analysis and web-augmented search, with consistent output formatting and robust error handling.

## Overview

This project provides a flexible backend for querying OpenAI models with structured columnar data. It supports:

- Sending structured data to GPT models for analysis
- Performing web searches with data context for more up-to-date information
- Consistent JSON output format for both methods
- Robust error handling and retry mechanisms

## Components

The project consists of two main modules:

### 1. `llm.py` - Core API Module

Contains the main request handling functions:
- `handle_request()` - Main entry point for all requests
- `query_llm()` - Handles standard LLM queries
- `query_web_search()` - Handles web-augmented search queries

### 2. `llm_helpers.py` - Helper Functions

Contains shared utilities to support the main module:
- `process_columnar_data()` - Converts columnar data to row format
- `parse_response()` - Ensures consistent output formatting
- `format_prompt_with_data()` - Prepares prompts with structured data
- `SYSTEM_PROMPT` - Shared system instructions for both LLM and web search

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install openai python-dotenv
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

### Basic Example

```python
from llm import handle_request

# Sample columnar data
data = {
    "product": ["iPhone 14", "Galaxy S23", "Pixel 7"],
    "price": ["$799", "$899", "$599"],
    "release_year": ["2022", "2023", "2022"]
}

column_names = list(data.keys())

# Query using LLM
llm_result = handle_request(
    prompt="Who was the CTO of the company at the time of launch of product",
    data=data,
    column_names=column_names,
    tool_type="websearch"  # Use "llm" or "websearch"
)

print(llm_result)
```

### API Parameters

The `handle_request()` function accepts the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `prompt` | str | The prompt/question to analyze the data | (Required) |
| `data` | Dict[str, List[str]] | Dictionary with columns as keys and value lists | (Required) |
| `column_names` | List[str] | List of columns to include | (Required) |
| `tool_type` | str | Either "llm" or "websearch" | "llm" |
| `max_retries` | int | Maximum retry attempts on failure | 3 |
| `model` | str | OpenAI model to use | "gpt-4" |

### Response Format

All requests return a consistently structured response:

```python
{
    "results": [
        {"response": "Analysis for row 1"},
        {"response": "Analysis for row 2"},
        # ... one item per row
    ],
    "metadata": {
        "success": True,  # or False on error
        "retries": 0,  # number of retries used
        "error": None,  # error message if failed
        "error_type": None,  # type of error if failed
        "timestamp": 1234567890,  # unix timestamp
        "request_id": "unique-request-id"  # for tracking
    }
}
```

On error, additional error details are included:

```python
{
    "results": [],  # empty on error
    "metadata": {...},  # as above but with error info
    "error_details": {
        "message": "Detailed error message",
        "type": "ErrorType",
        "request_id": "unique-request-id"
    }
}
```

## Extending the API

### Adding a New Tool Type

To add a new tool type beyond "llm" and "websearch":

1. Add a new function similar to `query_llm()` or `query_web_search()`
2. Update the `handle_request()` function to handle the new tool type
3. Ensure your new function returns data in the same format using `parse_response()`

### Custom Formatting

To customize how data is formatted in prompts:

1. Modify the `format_prompt_with_data()` function in `llm_helpers.py`
2. Or create a new formatting function for specific use cases

## Error Handling

The API implements three levels of error handling:

1. **Retries with backoff** - Automatically retries failed requests with exponential backoff
2. **Error-specific backoff** - Uses different backoff strategies based on error type
3. **Consistent error responses** - Even on failure, returns a well-structured response

## License

MIT 