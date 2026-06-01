import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const OLLAMA_CLOUD_API_KEY = "c29bf8b9ec3d4a8db1899de2240506a1.rJjU-psTI6aeopLLdOLJbG1U";

export default async function (pi: ExtensionAPI) {
  // Fetch available models from Ollama Cloud with full details
  const modelsResp = await fetch("https://ollama.com/v1/models", {
    headers: { "Authorization": `Bearer ${OLLAMA_CLOUD_API_KEY}` },
  });
  const modelsPayload = (await modelsResp.json()) as {
    data: Array<{ id: string }>;
  };

  // Fetch detailed info for each model (context length, capabilities, etc.)
  const detailedModels = await Promise.all(
    modelsPayload.data.map(async (m) => {
      try {
        const showResp = await fetch("https://ollama.com/api/show", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OLLAMA_CLOUD_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: m.id }),
        });
        const showData = (await showResp.json()) as {
          details: { family: string; parameter_size: string };
          model_info: Record<string, number>;
          capabilities: string[];
        };

        // Extract context_length from model_info (key ends with .context_length)
        let contextWindow = 128000;
        for (const [key, value] of Object.entries(showData.model_info)) {
          if (key.endsWith(".context_length")) {
            contextWindow = value;
            break;
          }
        }

        // Determine capabilities
        const caps = showData.capabilities || [];
        const hasVision = caps.includes("vision");
        const hasThinking = caps.includes("thinking");
        const hasTools = caps.includes("tools");

        const input: ("text" | "image")[] = hasVision ? ["text", "image"] : ["text"];

        return {
          id: m.id,
          name: m.id,
          reasoning: hasThinking,
          input,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow,
          maxTokens: Math.min(contextWindow, 65536),
        };
      } catch {
        // Fallback if show fails
        return {
          id: m.id,
          name: m.id,
          reasoning: false,
          input: ["text"] as ("text" | "image")[],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128000,
          maxTokens: 16384,
        };
      }
    })
  );

  pi.registerProvider("ollama-cloud", {
    name: "Ollama Cloud",
    baseUrl: "https://ollama.com/v1",
    apiKey: OLLAMA_CLOUD_API_KEY,
    api: "openai-completions",
    models: detailedModels,
  });
}
