# pi-ollama-cloud

Register [Ollama Cloud](https://ollama.com) as a provider for pi coding agent. Automatically fetches all available models on startup.

## Install

```bash
pi install git:github.com/inouemoby/pi-ollama-cloud
```

## Setup

After installation, configure your API key via `/login`:

```
/login
→ Select "Use an API key"
→ Select "Ollama Cloud"
→ Enter your API key (from https://ollama.com)
```

Alternatively, set the environment variable:

```bash
export OLLAMA_CLOUD_API_KEY=your-key-here
```

The API key is stored in `~/.pi/agent/auth.json` and persisted across sessions.

## What It Does

On session start, this extension:

1. Reads the API key from environment variable or `auth.json`
2. Fetches the full model list from `ollama.com/v1/models`
3. Queries detailed info (context length, vision/thinking capabilities) for each model
4. Registers `ollama-cloud` as a provider with all discovered models

No hardcoded keys — each user provides their own via `/login`.

## Available Models

Models are fetched dynamically at startup. New models appear automatically without plugin updates. As of June 2026, includes:

- minimax-m3, minimax-m2.7, minimax-m2.5, minimax-m2.1, minimax-m2
- deepseek-v4-pro, deepseek-v4-flash, deepseek-v3.2, deepseek-v3.1
- glm-5.1, glm-5, glm-4.7, glm-4.6
- qwen3-coder:480b, qwen3-coder-next, qwen3.5:397b, qwen3-vl:235b
- kimi-k2.6, kimi-k2.5, kimi-k2:1t, kimi-k2-thinking
- gemma4:31b, gemma3:27b, gemma3:12b, gemma3:4b
- mistral-large-3:675b, ministral-3:14b, ministral-3:8b
- cogito-2.1:671b, nemotron-3-super, devstral-2:123b, and more

## Capabilities

Each model is automatically configured with:

- **Vision** — models with `vision` capability accept image input
- **Thinking** — models with `thinking` capability support extended reasoning
- **Context window** — auto-detected from model metadata
- **Cost** — free (Ollama Cloud)

## Related

- [pi-ollama-usage](https://github.com/inouemoby/pi-ollama-usage) — Ollama Cloud usage monitor
- [pi-ollama-search](https://github.com/inouemoby/pi-ollama-search) — Web search (uses Ollama Cloud as fallback)

## License

MIT
