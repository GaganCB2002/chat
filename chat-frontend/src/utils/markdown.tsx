/* eslint-disable react/only-export-components */
import type { ReactNode } from 'react';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function processInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(`[^`]+`)|~~(.+?)~~|(\*\*(.+?)\*\*)|(\*(.+?)\*)|!\[(.+?)\]\((.+?)\)|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  for (let m = regex.exec(text); m !== null; m = regex.exec(text)) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    if (m[1]) {
      const code = m[1].slice(1, -1);
      parts.push(<code key={`c-${m.index}`}>{code}</code>);
    } else if (m[2]) {
      parts.push(<del key={`d-${m.index}`}>{processInline(m[2])}</del>);
    } else if (m[4]) {
      parts.push(<strong key={`b-${m.index}`}>{processInline(m[4])}</strong>);
    } else if (m[6]) {
      parts.push(<em key={`i-${m.index}`}>{processInline(m[6])}</em>);
    } else if (m[7] && m[8]) {
      const src = m[8], alt = m[7];
      const safeSrc = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') ? src : '';
      parts.push(<img key={`img-${m.index}`} src={safeSrc} alt={alt} className="max-w-full rounded-lg my-1 cursor-pointer" onClick={() => safeSrc && window.open(safeSrc, '_blank')} />);
    } else if (m[9] && m[10]) {
      const href = m[10];
      const safeHref = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') ? href : '#';
      parts.push(<a key={`a-${m.index}`} href={safeHref} target="_blank" rel="noopener noreferrer">{m[9]}</a>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border ">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-tertiary border-b border-border ">
        <span className="text-xs text-text-tertiary font-mono">{language || 'text'}</span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copy
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-surface-secondary "><code className="text-sm font-mono leading-relaxed text-text ">{escapeHtml(code)}</code></pre>
    </div>
  );
}

export function renderMarkdown(content: string): ReactNode[] {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      elements.push(<CodeBlock key={`cb-${elements.length}`} code={codeLines.join('\n')} language={lang} />);
      continue;
    }

    if (/^#{1,2}\s/.test(line)) {
      const level = line.startsWith('# ') ? 2 : 3;
      const text = line.replace(/^#{1,2}\s+/, '');
      const Tag = level === 2 ? 'h2' : 'h3';
      elements.push(<Tag key={`h-${elements.length}`}>{processInline(text)}</Tag>);
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) { quoteLines.push(lines[i].replace(/^>\s*/, '')); i++; }
      elements.push(<blockquote key={`q-${elements.length}`}>{quoteLines.map((q, idx) => <div key={idx}>{processInline(q)}</div>)}</blockquote>);
      continue;
    }

    if (/^\s*[-*+]\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) { items.push(<li key={`li-${i}`}>{processInline(lines[i].replace(/^\s*[-*+]\s+/, ''))}</li>); i++; }
      elements.push(<ul key={`ul-${elements.length}`}>{items}</ul>);
      continue;
    }

    if (/^\s*\d+\.\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(<li key={`li-${i}`}>{processInline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>); i++; }
      elements.push(<ol key={`ol-${elements.length}`}>{items}</ol>);
      continue;
    }

    if (line.startsWith('|') && lines[i + 1]?.startsWith('|') && /^[-:| ]+$/.test(lines[i + 1].replace(/\|/g, '').trim())) {
      const headers = line.split('|').filter(Boolean).map((h) => h.trim());
      i += 2;
      const rows: ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].split('|').filter(Boolean).map((c) => c.trim());
        rows.push(<tr key={`tr-${i}`}>{cells.map((c, ci) => <td key={ci} className="px-3 py-1.5 border border-border text-sm">{processInline(c)}</td>)}</tr>);
        i++;
      }
      elements.push(
        <div key={`tbl-${elements.length}`} className="overflow-x-auto my-2">
          <table className="w-full border-collapse">
            <thead><tr>{headers.map((h, hi) => <th key={hi} className="px-3 py-1.5 border border-border bg-surface-secondary text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^---/.test(line) || /^___/.test(line)) { elements.push(<hr key={`hr-${elements.length}`} />); i++; continue; }

    if (line.trim() === '') { i++; continue; }

    elements.push(<p key={`p-${elements.length}`}>{processInline(line)}</p>);
    i++;
  }

  return elements;
}
