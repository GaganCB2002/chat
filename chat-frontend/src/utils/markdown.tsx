/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/only-export-components */
import { useEffect, useRef, useState, createElement } from 'react';
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
      try {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch { /* clipboard not available */ }
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-tertiary border-b border-border">
        <span className="text-xs text-text-tertiary font-mono">{language || 'text'}</span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copy
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-surface-secondary"><code className="text-sm font-mono leading-relaxed text-text">{escapeHtml(code)}</code></pre>
    </div>
  );
}

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || error) return;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await import('mermaid');
        const m = mermaid.default;
        m.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          themeVariables: document.documentElement.classList.contains('dark')
            ? { background: '#1e1e2e', primaryColor: '#89b4fa', primaryTextColor: '#cdd6f4', primaryBorderColor: '#45475a', lineColor: '#585b70', secondaryColor: '#313244', tertiaryColor: '#1e1e2e' }
            : { background: '#ffffff', primaryColor: '#4f8ff7', primaryTextColor: '#1e293b', primaryBorderColor: '#e2e8f0', lineColor: '#94a3b8', secondaryColor: '#f1f5f9', tertiaryColor: '#ffffff' },
        });
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await m.render(id, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [code, error]);

  if (error) {
    return <CodeBlock code={code} language="mermaid" />;
  }

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-tertiary border-b border-border">
        <span className="text-xs text-text-tertiary font-mono">diagram</span>
      </div>
      <div className="p-4 overflow-x-auto bg-surface-secondary flex justify-center">
        <div ref={ref} className="mermaid" />
      </div>
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
      if (lang === 'mermaid') {
        elements.push(<MermaidBlock key={`md-${elements.length}`} code={codeLines.join('\n')} />);
      } else {
        elements.push(<CodeBlock key={`cb-${elements.length}`} code={codeLines.join('\n')} language={lang} />);
      }
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#{1,6}\s+/, '');
      const headingClass = [
        'text-xl font-bold mt-6 mb-3',
        'text-lg font-semibold mt-5 mb-2',
        'text-base font-semibold mt-4 mb-2',
        'text-sm font-medium mt-3 mb-1',
        'text-sm font-medium mt-2 mb-1 text-text-secondary',
      ][Math.min(level, 5) - 1] || 'text-base font-semibold mt-4 mb-2';
      const tagName = `h${Math.min(level + 1, 6)}`;
      elements.push(createElement(tagName, { key: `h-${elements.length}`, className: headingClass }, processInline(text)));
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) { quoteLines.push(lines[i].replace(/^>\s*/, '')); i++; }
      elements.push(
        <blockquote key={`q-${elements.length}`} className="border-l-4 border-primary-400 bg-primary-50/50 dark:bg-primary-900/10 rounded-r-lg px-4 py-2 my-3 text-text-secondary italic">
          {quoteLines.map((q, idx) => <div key={idx}>{processInline(q)}</div>)}
        </blockquote>
      );
      continue;
    }

    if (/^\s*[-*+]\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) { items.push(<li key={`li-${i}`} className="text-text">{processInline(lines[i].replace(/^\s*[-*+]\s+/, ''))}</li>); i++; }
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">{items}</ul>);
      continue;
    }

    if (/^\s*\d+\.\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(<li key={`li-${i}`} className="text-text">{processInline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>); i++; }
      elements.push(<ol key={`ol-${elements.length}`} className="list-decimal pl-5 my-2 space-y-1">{items}</ol>);
      continue;
    }

    if (line.startsWith('|') && lines[i + 1]?.startsWith('|') && /^[-:| ]+$/.test(lines[i + 1].replace(/\|/g, '').trim())) {
      const headers = line.split('|').filter(Boolean).map((h) => h.trim());
      i += 2;
      const rows: ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].split('|').filter(Boolean).map((c) => c.trim());
        rows.push(<tr key={`tr-${i}`} className="even:bg-surface-secondary/50">{cells.map((c, ci) => <td key={ci} className="px-4 py-2.5 border border-border text-sm text-text">{processInline(c)}</td>)}</tr>);
        i++;
      }
      elements.push(
        <div key={`tbl-${elements.length}`} className="overflow-x-auto my-3 rounded-xl border border-border">
          <table className="w-full border-collapse">
            <thead><tr className="bg-surface-tertiary">{headers.map((h, hi) => <th key={hi} className="px-4 py-2.5 border border-border text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^---/.test(line) || /^___/.test(line)) { elements.push(<hr key={`hr-${elements.length}`} className="my-4 border-border" />); i++; continue; }

    if (line.trim() === '') { i++; continue; }

    elements.push(<p key={`p-${elements.length}`} className="text-text leading-relaxed mb-2">{processInline(line)}</p>);
    i++;
  }

  return elements;
}
