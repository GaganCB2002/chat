const API_BASE = '/api/ollama';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export class OllamaError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'OllamaError';
    this.status = status;
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new OllamaError(`Ollama request failed: ${res.statusText}`, res.status);
  }
  return res.json();
}

export async function listModels(): Promise<OllamaModel[]> {
  try {
    const data = await request<{ models: OllamaModel[] }>('/tags');
    return data.models ?? [];
  } catch {
    return [];
  }
}

export async function checkConnection(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`, { signal });
    return res.ok;
  } catch {
    return false;
  }
}

export async function chatCompletion(
  model: string,
  messages: OllamaMessage[],
  onToken?: (token: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const url = `${API_BASE}/chat`;
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: !!onToken }),
    signal,
  });

  if (res.status === 404) {
    if (onToken) {
      onToken(`\n> **System**: Model \`${model}\` not found locally. Downloading automatically... This may take a few minutes.\n\n`);
    }

    const pullRes = await fetch(`${API_BASE}/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: true }),
      signal,
    });

    if (!pullRes.ok) {
      throw new OllamaError(`Ollama pull failed: ${pullRes.statusText}`, pullRes.status);
    }

    if (pullRes.body) {
      const reader = pullRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastReported = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines.filter(Boolean)) {
          try {
            const data = JSON.parse(line);
            if (data.total && data.completed) {
              const pct = Math.floor((data.completed / data.total) * 100);
              if (pct >= lastReported + 10) {
                if (onToken) onToken(`> **Download progress**: ${pct}%\n`);
                lastReported = pct;
              }
            } else if (data.status && !data.total) {
              if (onToken && data.status !== 'downloading' && data.status !== 'success') {
                onToken(`> **Status**: ${data.status}\n`);
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (onToken) {
      onToken(`\n> **System**: Download complete. Generating response...\n\n---\n\n`);
    }

    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: !!onToken }),
      signal,
    });
  }

  if (!res.ok) {
    throw new OllamaError(`Ollama chat failed: ${res.statusText}`, res.status);
  }

  if (onToken) {
    const reader = res.body?.getReader();
    if (!reader) throw new OllamaError('No response body', 0);
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines.filter(Boolean)) {
        try {
          const data = JSON.parse(line) as OllamaChatResponse;
          if (data.message?.content) {
            full += data.message.content;
            onToken(data.message.content);
          }
        } catch (e) {
          console.warn('Failed to parse chunk line', line, e);
        }
      }
    }
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer) as OllamaChatResponse;
        if (data.message?.content) {
          full += data.message.content;
          onToken(data.message.content);
        }
      } catch { /* skip partial trailing data */ }
    }
    return full;
  }

  const data = await res.json() as OllamaChatResponse;
  return data.message?.content ?? '';
}

export async function generateCompletion(
  model: string,
  prompt: string,
  onToken?: (token: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const url = `${API_BASE}/generate`;
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: !!onToken }),
    signal,
  });

  if (res.status === 404) {
    if (onToken) {
      onToken(`\n> **System**: Model \`${model}\` not found locally. Downloading automatically... This may take a few minutes.\n\n`);
    }

    const pullRes = await fetch(`${API_BASE}/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: true }),
      signal,
    });

    if (!pullRes.ok) {
      throw new OllamaError(`Ollama pull failed: ${pullRes.statusText}`, pullRes.status);
    }

    if (pullRes.body) {
      const reader = pullRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastReported = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines.filter(Boolean)) {
          try {
            const data = JSON.parse(line);
            if (data.total && data.completed) {
              const pct = Math.floor((data.completed / data.total) * 100);
              if (pct >= lastReported + 10) {
                if (onToken) onToken(`> **Download progress**: ${pct}%\n`);
                lastReported = pct;
              }
            } else if (data.status && !data.total) {
              if (onToken && data.status !== 'downloading' && data.status !== 'success') {
                onToken(`> **Status**: ${data.status}\n`);
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (onToken) {
      onToken(`\n> **System**: Download complete. Generating response...\n\n---\n\n`);
    }

    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: !!onToken }),
      signal,
    });
  }

  if (!res.ok) {
    throw new OllamaError(`Ollama generate failed: ${res.statusText}`, res.status);
  }

  if (onToken) {
    const reader = res.body?.getReader();
    if (!reader) throw new OllamaError('No response body', 0);
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines.filter(Boolean)) {
        try {
          const data = JSON.parse(line) as OllamaGenerateResponse;
          if (data.response) {
            full += data.response;
            onToken(data.response);
          }
        } catch (e) {
          console.warn('Failed to parse chunk line', line, e);
        }
      }
    }
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer) as OllamaGenerateResponse;
        if (data.response) {
          full += data.response;
          onToken(data.response);
        }
      } catch { /* skip partial trailing data */ }
    }
    return full;
  }

  const data = await res.json() as OllamaGenerateResponse;
  return data.response ?? '';
}
