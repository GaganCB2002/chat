import type { Chat } from '../types';

export function exportChatAsJSON(chat: Chat): void {
  const data = {
    title: chat.title,
    exportedAt: new Date().toISOString(),
    messages: chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${chat.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
}

export function exportChatAsTXT(chat: Chat): void {
  const lines: string[] = [];
  lines.push(`Title: ${chat.title}`);
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push('─'.repeat(50));
  lines.push('');
  for (const msg of chat.messages) {
    const role = msg.role === 'user' ? 'You' : 'Assistant';
    const time = msg.timestamp.toLocaleString();
    lines.push(`[${role} — ${time}]`);
    lines.push(msg.content);
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${chat.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
