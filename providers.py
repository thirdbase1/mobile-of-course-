PROVIDERS = {
    "groq": {
        "url":     "https://api.groq.com/openai/v1/chat/completions",
        "models":  {
            "llama-3.3-70b":  "llama-3.3-70b-versatile",
            "llama-3.1-70b":  "llama-3.1-70b-versatile",
            "mixtral-8x7b":   "mixtral-8x7b-32768",
            "llama-3.1-8b":   "llama-3.1-8b-instant",
            "deepseek-r1-distill-llama-70b": "deepseek-r1-distill-llama-70b",
        },
        "parallel_tool_calls": True,
    },
    "openrouter": {
        "url":    "https://openrouter.ai/api/v1/chat/completions",
        "models": {
            "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
            "claude-3-haiku":    "anthropic/claude-3-haiku",
            "gpt-4o":            "openai/gpt-4o",
            "gpt-4o-mini":       "openai/gpt-4o-mini",
            "deepseek-r1":       "deepseek/deepseek-r1",
            "qwen-32b":          "qwen/qwen-2.5-32b-instruct",
            "qwen-72b":          "qwen/qwen-2.5-72b-instruct",
        },
        "parallel_tool_calls": False,
    },
    "xai": {
        "url":    "https://api.x.ai/v1/chat/completions",
        "models": {
            "grok-2":      "grok-2-latest",
            "grok-2-mini": "grok-2-vision-1212",
            "grok-beta":   "grok-beta",
        },
        "parallel_tool_calls": True,
    },
}
