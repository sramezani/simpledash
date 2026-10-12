/**
 * AI assistants (docs/SPEC.md section 11.5). Visitors count as AI traffic when
 * GA4 puts them in its "AI Assistant" channel, OR their source is in this list.
 * The list also covers Claude and Perplexity, and data from before the channel existed.
 * Bump the version when the list changes: it is part of the report cache key.
 */
export const AI_LIST_VERSION = 1;

export const AI_CHANNEL = "AI Assistant";

export const AI_SOURCES: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "perplexity.ai": "Perplexity",
  "www.perplexity.ai": "Perplexity",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "bard.google.com": "Gemini",
  "copilot.microsoft.com": "Copilot",
  "chat.deepseek.com": "DeepSeek",
  "grok.com": "Grok",
  "meta.ai": "Meta AI",
  "chat.mistral.ai": "Mistral",
  "you.com": "You.com",
  "phind.com": "Phind",
  "poe.com": "Poe",
};

const NAME_HINTS: [RegExp, string][] = [
  [/chatgpt|openai/i, "ChatGPT"],
  [/perplexity/i, "Perplexity"],
  [/claude|anthropic/i, "Claude"],
  [/gemini|bard/i, "Gemini"],
  [/copilot/i, "Copilot"],
  [/deepseek/i, "DeepSeek"],
  [/grok/i, "Grok"],
  [/mistral/i, "Mistral"],
];

/** The assistant's display name for a source, e.g. "chatgpt.com" → "ChatGPT". */
export function aiAssistantName(source: string): string {
  const s = source.toLowerCase();
  if (AI_SOURCES[s]) return AI_SOURCES[s];
  for (const [re, name] of NAME_HINTS) if (re.test(s)) return name;
  return source;
}
