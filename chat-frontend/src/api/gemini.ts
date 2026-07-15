export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}

export async function chatCompletionGemini(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  onToken?: (token: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError('Gemini API key not configured in .env', 401);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Map roles to Gemini roles ('user' or 'model')
  // System prompts can be prepended to the first user message or passed in 'systemInstruction'.
  // For simplicity here, we map 'assistant' to 'model', and 'system'/'user' to 'user'.
  const geminiMessages: GeminiMessage[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Combine consecutive messages with the same role, as Gemini strictly requires alternating roles.
  const combinedMessages: GeminiMessage[] = [];
  for (const msg of geminiMessages) {
    const last = combinedMessages[combinedMessages.length - 1];
    if (last && last.role === msg.role) {
      last.parts[0].text += '\n\n' + msg.parts[0].text;
    } else {
      combinedMessages.push({ role: msg.role, parts: [{ text: msg.parts[0].text }] });
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: combinedMessages }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new GeminiError(`Gemini chat failed: ${errorData?.error?.message || res.statusText}`, res.status);
  }

  let full = '';
  if (onToken) {
    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              full += text;
              onToken(text);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } else {
      const data = await res.json();
      full = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      onToken(full);
    }
  } else {
    const data = await res.json();
    full = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
  return full;
}
