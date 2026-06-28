import os
from openai import OpenAI
from pydantic import BaseModel

# Initialize OpenRouter/OpenAI client
# Using a placeholder key for local testing or Ollama proxy if needed
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "sk-placeholder")

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=OPENROUTER_API_KEY,
)

class AIExplainResponse(BaseModel):
    simple_explanation: str
    advanced_explanation: str
    warnings: list[str]
    use_cases: list[str]

def explain_command(command_syntax: str) -> AIExplainResponse:
    """
    Calls the AI to explain a specific command.
    """
    prompt = f"""
    You are an expert Windows and command-line system administrator.
    Explain the following command: `{command_syntax}`
    
    Return the response strictly as a JSON object matching this schema:
    {{
        "simple_explanation": "A one-sentence simple explanation for beginners.",
        "advanced_explanation": "A detailed technical explanation.",
        "warnings": ["Warning 1", "Warning 2"],
        "use_cases": ["Use case 1", "Use case 2"]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3-8b-instruct:free", # Free tier model for dev
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        # Parse the JSON string into our Pydantic model
        import json
        content = response.choices[0].message.content
        return AIExplainResponse.model_validate(json.loads(content))
    except Exception as e:
        # Fallback for when API is unavailable or key is missing
        return AIExplainResponse(
            simple_explanation=f"AI is currently unavailable. This command executes: {command_syntax}",
            advanced_explanation="Please configure your OpenRouter API key in settings to enable AI features.",
            warnings=["AI validation unavailable - run at your own risk."],
            use_cases=["N/A"]
        )

def natural_language_search(query: str, available_commands: list[dict]) -> list[int]:
    """
    Takes a natural language query ("my internet is slow") and a list of available command summaries.
    Returns a list of recommended command IDs.
    """
    commands_text = "\n".join([f"ID: {c['id']}, Title: {c['title']}, Desc: {c['description']}" for c in available_commands])
    prompt = f"""
    A user is experiencing this issue: "{query}"
    
    Here is a list of available commands:
    {commands_text}
    
    Which command IDs would help solve this issue? Return ONLY a JSON list of integers. Example: [1, 5, 8]
    """
    
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3-8b-instruct:free",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"} # Some models require {"type": "json_object"}
        )
        import json
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception:
        # Fallback to simple keyword matching if AI fails
        matched_ids = []
        for c in available_commands:
            if any(word in c['title'].lower() or word in c['description'].lower() for word in query.lower().split()):
                matched_ids.append(c['id'])
        return matched_ids
