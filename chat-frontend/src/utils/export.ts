import type { Chat, Message } from '../types';
import { jsPDF } from 'jspdf';

function safeDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

function formatFileInfo(files: Message['files']): string {
  if (!files || files.length === 0) return '';
  return files.map(f => {
    const isImg = f.type.startsWith('image/');
    const size = f.size > 1024 * 1024
      ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(f.size / 1024).toFixed(0)} KB`;
    return isImg ? `  [Image: ${f.name} (${size})]` : `  [File: ${f.name} (${size})]`;
  }).join('\n');
}

export function exportChatAsJSON(chat: Chat): void {
  const data = {
    title: chat.title,
    exportedAt: new Date().toISOString(),
    messages: chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: safeDate(m.timestamp).toISOString(),
      files: m.files?.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
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
    const time = safeDate(msg.timestamp).toLocaleString();
    lines.push(`[${role} — ${time}]`);
    lines.push(msg.content);
    const fileInfo = formatFileInfo(msg.files);
    if (fileInfo) {
      lines.push(fileInfo);
    }
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${chat.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`);
}

export function exportChatAsPDF(chat: Chat): void {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 190;
  const margin = 10;
  let y = margin;

  function addText(text: string, size: number = 11, style: 'normal' | 'bold' = 'normal') {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    const lines = pdf.splitTextToSize(text, pageW);
    for (const line of lines) {
      if (y + 7 > 280) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 5;
    }
  }

  function addDivider() {
    if (y + 5 > 280) { pdf.addPage(); y = margin; }
    y += 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, margin + pageW, y);
    y += 4;
  }

  // Title
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(chat.title, margin, y);
  y += 10;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Exported: ${new Date().toLocaleString()} | Messages: ${chat.messages.length}`, margin, y);
  y += 4;
  pdf.setTextColor(0, 0, 0);

  pdf.setDrawColor(180, 180, 180);
  pdf.line(margin, y, margin + pageW, y);
  y += 6;

  // Messages
  for (const msg of chat.messages) {
    if (y + 15 > 280) { pdf.addPage(); y = margin; }

    const roleLabel = msg.role === 'user' ? 'You' : 'Assistant';
    const time = safeDate(msg.timestamp).toLocaleString();

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(msg.role === 'user' ? 50 : 100, msg.role === 'user' ? 120 : 80, msg.role === 'user' ? 255 : 180);
    pdf.text(`[${roleLabel}]`, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(time, margin + 25, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(30, 30, 30);

    let content = msg.content;
    // Strip file markers from content for cleaner PDF display
    content = content.replace(/\[ attached image: .+? \]/g, '');
    content = content.replace(/\[ attached file: .+? \]/g, '');
    content = content.trim();

    if (content) {
      addText(content, 10, 'normal');
    }

    // Render attached files
    if (msg.files && msg.files.length > 0) {
      for (const file of msg.files) {
        if (y + 15 > 280) { pdf.addPage(); y = margin; }

        const isImg = file.type.startsWith('image/');
        const sizeStr = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;

        if (isImg) {
          try {
            if (y + 60 > 280) { pdf.addPage(); y = margin; }
            const imgFormat = file.type === 'image/png' ? 'PNG' : file.type === 'image/gif' ? 'GIF' : 'JPEG';
            pdf.addImage(file.dataUrl, imgFormat, margin, y, 60, 45);
            y += 48;
            pdf.setFontSize(7);
            pdf.setTextColor(120, 120, 120);
            pdf.text(file.name, margin, y);
            y += 3;
          } catch {
            pdf.setFontSize(7);
            pdf.setTextColor(120, 120, 120);
            pdf.text(`[Image: ${file.name} - ${sizeStr}]`, margin, y);
            y += 3;
          }
        } else {
          pdf.setFontSize(8);
          pdf.setTextColor(80, 80, 80);
          pdf.text(`[File: ${file.name} - ${sizeStr}]`, margin, y);
          y += 3;
        }
      }
    }

    y += 3;
    addDivider();
  }

  pdf.save(`${chat.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
