const API_BASE = '/api/gemini';

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
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new GeminiError(`Gemini chat failed: ${errorData?.detail || res.statusText}`, res.status);
  }

  let full = '';
  if (onToken) {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      reader = res.body?.getReader() ?? null;
    } catch {
      reader = null;
    }
    if (reader) {
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
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr !== '[DONE]') {
            try {
              const data = JSON.parse(dataStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) { full += text; onToken(text); }
            } catch { /* skip */ }
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
