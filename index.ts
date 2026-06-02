import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default async function (pi: ExtensionAPI) {
  // Resolve API key: env var > auth.json
  let apiKey = process.env.OLLAMA_CLOUD_API_KEY || "";
  if (!apiKey) {
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const agentDir = process.env.PI_CODING_AGENT_DIR || path.join(process.env.USERPROFILE || process.env.HOME || ".", ".pi/agent");
      const authPath = path.join(agentDir, "auth.json");
      if (fs.existsSync(authPath)) {
        const auth = JSON.parse(fs.readFileSync(authPath, "utf-8"));
        if (auth["ollama-cloud"]?.key) apiKey = auth["ollama-cloud"].key;
      }
    } catch { /* ignore */ }
  }

  // Fetch models if we have a key; otherwise register with empty list
  let detailedModels: any[] = [];
  if (apiKey) {
    try {
      const modelsResp = await fetch("https://ollama.com/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const modelsPayload = (await modelsResp.json()) as { data: Array<{ id: string }> };

      detailedModels = await Promise.all(
        modelsPayload.data.map(async (m) => {
          try {
            const showResp = await fetch("https://ollama.com/api/show", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name: m.id }),
            });
            const showData = (await showResp.json()) as {
              details: { family: string; parameter_size: string };
              model_info: Record<string, number>;
              capabilities: string[];
            };

            let contextWindow = 128000;
            for (const [key, value] of Object.entries(showData.model_info)) {
              if (key.endsWith(".context_length")) { contextWindow = value; break; }
            }

            const caps = showData.capabilities || [];
            const hasVision = caps.includes("vision");
            const hasThinking = caps.includes("thinking");
            const input: ("text" | "image")[] = hasVision ? ["text", "image"] : ["text"];

            return {
              id: m.id, name: m.id, reasoning: hasThinking, input,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow, maxTokens: Math.min(contextWindow, 65536),
            };
          } catch {
            return {
              id: m.id, name: m.id, reasoning: false,
              input: ["text"] as ("text" | "image")[],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 128000, maxTokens: 16384,
            };
          }
        })
      );
    } catch { /* no key or network error — register with empty models */ }
  }

  pi.registerProvider("ollama-cloud", {
    name: "Ollama Cloud",
    baseUrl: "https://ollama.com/v1",
    apiKey: "$OLLAMA_CLOUD_API_KEY",
    api: "openai-completions",
    models: detailedModels,
  });
}
