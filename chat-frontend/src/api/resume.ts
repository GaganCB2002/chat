const API_BASE = '/api/resume';

function resolveModelParam(model?: string): string | undefined {
  if (!model) return undefined;
  if (model === 'gemini-pro') return 'gemini';
  return undefined;
}

export class ResumeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ResumeError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || data.error || detail;
    } catch {
      try {
        detail = await res.text() || detail;
      } catch {}
    }
    throw new ResumeError(detail, res.status);
  }
  return res.json();
}

export async function parseResume(
  file?: File,
  text?: string,
  model?: string
): Promise<{ raw_text: string; parsed: any }> {
  if (!file && !text?.trim()) {
    throw new ResumeError('Provide a file or paste the resume text', 400);
  }
  const form = new FormData();
  if (file) form.append('file', file);
  if (text) form.append('text', text);
  const m = resolveModelParam(model);
  if (m) form.append('model', m);
  return request('/parse-resume', { method: 'POST', body: form });
}

export async function parseJD(
  file?: File,
  text?: string,
  model?: string
): Promise<{ raw_text: string; parsed: any }> {
  if (!file && !text?.trim()) {
    throw new ResumeError('Provide a file or paste the job description', 400);
  }
  const form = new FormData();
  if (file) form.append('file', file);
  if (text) form.append('text', text);
  const m = resolveModelParam(model);
  if (m) form.append('model', m);
  return request('/parse-jd', { method: 'POST', body: form });
}

export async function analyzeResume(
  resumeText: string,
  jdText: string,
  resumeJson?: string,
  jdJson?: string,
  model?: string
): Promise<any> {
  const form = new FormData();
  form.append('resume_text', resumeText);
  form.append('jd_text', jdText);
  form.append('resume_json', resumeJson || '{}');
  form.append('jd_json', jdJson || '{}');
  const m = resolveModelParam(model);
  if (m) form.append('model', m);
  return request('/analyze', { method: 'POST', body: form });
}

export async function generateOptimized(
  resumeText: string,
  jdText: string,
  resumeJson?: string,
  jdJson?: string,
  analysisJson?: string,
  editsJson?: string,
  model?: string
): Promise<any> {
  const form = new FormData();
  form.append('resume_text', resumeText);
  form.append('jd_text', jdText);
  form.append('resume_json', resumeJson || '{}');
  form.append('jd_json', jdJson || '{}');
  form.append('analysis_json', analysisJson || '{}');
  form.append('edits_json', editsJson || '{}');
  const m = resolveModelParam(model);
  if (m) form.append('model', m);
  return request('/generate-optimized', { method: 'POST', body: form });
}

export async function downloadLatex(resumeJson: object, template: string = 'classic'): Promise<{ latex: string }> {
  const form = new FormData();
  form.append('resume_json', JSON.stringify(resumeJson));
  form.append('template', template);
  return request('/generate-latex', { method: 'POST', body: form });
}

async function downloadBlob(path: string, form: FormData): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || data.error || detail;
    } catch {
      try {
        detail = await res.text() || detail;
      } catch {}
    }
    throw new ResumeError(detail, res.status);
  }
  return res.blob();
}

export async function downloadPdf(resumeJson: object, template: string = 'classic'): Promise<Blob> {
  const form = new FormData();
  form.append('resume_json', JSON.stringify(resumeJson));
  form.append('template', template);
  return downloadBlob('/generate-pdf', form);
}

export async function downloadDocx(resumeJson: object, template: string = 'classic'): Promise<Blob> {
  const form = new FormData();
  form.append('resume_json', JSON.stringify(resumeJson));
  form.append('template', template);
  return downloadBlob('/generate-docx', form);
}
