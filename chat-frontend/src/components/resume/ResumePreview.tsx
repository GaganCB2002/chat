import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResumeData, ExperienceItem, ProjectItem, EducationItem, CertificationItem } from '../../types';
import { cn } from '../../utils/cn';

interface ResumePreviewProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

function EditableField({ value, onChange, multiline = false, placeholder = '', className = '' }: {
  value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; className?: string;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('w-full bg-transparent border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-y min-h-[60px]', className)}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn('w-full bg-transparent border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-500/30', className)}
    />
  );
}

function SkillInput({ onAdd }: { onAdd: (skill: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a skill..."
        className="flex-1 bg-transparent border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onAdd(value.trim());
            setValue('');
          }
        }}
      />
    </div>
  );
}

function SectionCard({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-secondary hover:bg-surface-tertiary/50 transition-colors"
      >
        <span className="text-sm font-semibold text-text">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ResumeArrayKeys = {
  [K in keyof ResumeData]: ResumeData[K] extends any[] ? K : never;
}[keyof ResumeData];

const ARRAY_KEYS: Set<string> = new Set(['skills', 'technical_skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'publications']);

function isArrayKey(key: string): key is ResumeArrayKeys {
  return ARRAY_KEYS.has(key);
}

export function ResumePreview({ data, onChange }: ResumePreviewProps) {
  const updateField = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const addItem = <T,>(key: keyof ResumeData, item: T) => {
    if (!isArrayKey(key)) return;
    const arr = [...(data[key] as unknown as T[]), item];
    onChange({ ...data, [key]: arr as any });
  };

  const removeItem = (key: keyof ResumeData, index: number) => {
    if (!isArrayKey(key)) return;
    const arr = (data[key] as unknown as any[]).filter((_: any, i: number) => i !== index);
    onChange({ ...data, [key]: arr as any });
  };

  const updateItem = <T,>(key: keyof ResumeData, index: number, item: T) => {
    if (!isArrayKey(key)) return;
    const arr = [...(data[key] as unknown as T[])];
    arr[index] = item;
    onChange({ ...data, [key]: arr as any });
  };

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-subtle pr-1">
      <SectionCard title="Personal Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Name</label>
            <EditableField value={data.name} onChange={(v) => updateField('name', v)} placeholder="Full name" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Email</label>
            <EditableField value={data.email} onChange={(v) => updateField('email', v)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Phone</label>
            <EditableField value={data.phone} onChange={(v) => updateField('phone', v)} placeholder="+1 (555) 123-4567" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Location</label>
            <EditableField value={data.location} onChange={(v) => updateField('location', v)} placeholder="City, State" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">LinkedIn</label>
            <EditableField value={data.linkedin} onChange={(v) => updateField('linkedin', v)} placeholder="linkedin.com/in/..." />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">GitHub</label>
            <EditableField value={data.github} onChange={(v) => updateField('github', v)} placeholder="github.com/..." />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Portfolio</label>
            <EditableField value={data.portfolio} onChange={(v) => updateField('portfolio', v)} placeholder="portfolio.url" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Professional Summary">
        <EditableField value={data.summary} onChange={(v) => updateField('summary', v)} multiline placeholder="Write your professional summary..." />
      </SectionCard>

      <SectionCard title="Skills">
        <div className="flex flex-wrap gap-1.5">
          {(data.skills || []).map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs border border-primary-200 dark:border-primary-800">
              {s}
              <button onClick={() => updateField('skills', (data.skills || []).filter((_, j) => j !== i))} className="hover:text-accent-rose transition-colors">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
        <SkillInput onAdd={(skill) => updateField('skills', [...(data.skills || []), skill])} />
      </SectionCard>

      <SectionCard title="Experience">
        {(data.experience || []).map((exp, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-surface-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">#{i + 1}</span>
              <button onClick={() => removeItem('experience', i)} className="p-1 rounded text-text-tertiary hover:text-accent-rose hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <EditableField value={exp.title} onChange={(v) => updateItem('experience', i, { ...exp, title: v })} placeholder="Job Title" />
              <EditableField value={exp.company} onChange={(v) => updateItem('experience', i, { ...exp, company: v })} placeholder="Company" />
              <EditableField value={exp.location} onChange={(v) => updateItem('experience', i, { ...exp, location: v })} placeholder="Location" />
              <div className="flex gap-2">
                <EditableField value={exp.start_date} onChange={(v) => updateItem('experience', i, { ...exp, start_date: v })} placeholder="Start" className="flex-1" />
                <EditableField value={exp.end_date} onChange={(v) => updateItem('experience', i, { ...exp, end_date: v })} placeholder="End" className="flex-1" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Bullet Points</label>
              {(exp.bullet_points || []).map((bp, bi) => (
                <div key={bi} className="flex items-center gap-1.5 mt-1">
                  <span className="text-text-tertiary text-xs">•</span>
                  <EditableField value={bp} onChange={(v) => {
                    const bps = [...exp.bullet_points];
                    bps[bi] = v;
                    updateItem('experience', i, { ...exp, bullet_points: bps });
                  }} placeholder="Describe your achievement..." />
                  <button onClick={() => {
                    const bps = exp.bullet_points.filter((_, j) => j !== bi);
                    updateItem('experience', i, { ...exp, bullet_points: bps });
                  }} className="text-text-tertiary hover:text-accent-rose p-0.5">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateItem('experience', i, { ...exp, bullet_points: [...exp.bullet_points, ''] })}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 mt-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add bullet point
              </button>
            </div>
          </motion.div>
        ))}
        <button
          onClick={() => addItem('experience', { title: '', company: '', location: '', start_date: '', end_date: '', description: '', bullet_points: [''] } as ExperienceItem)}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> Add Experience
        </button>
      </SectionCard>

      <SectionCard title="Projects">
        {(data.projects || []).map((proj, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-surface-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">#{i + 1}</span>
              <button onClick={() => removeItem('projects', i)} className="p-1 rounded text-text-tertiary hover:text-accent-rose hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <EditableField value={proj.name} onChange={(v) => updateItem('projects', i, { ...proj, name: v })} placeholder="Project Name" />
            <EditableField value={proj.description} onChange={(v) => updateItem('projects', i, { ...proj, description: v })} multiline placeholder="Project description..." />
            <EditableField value={proj.technologies.join(', ')} onChange={(v) => updateItem('projects', i, { ...proj, technologies: v.split(',').map(t => t.trim()).filter(Boolean) })} placeholder="Tech: React, Node.js, Python" />
            <div>
              <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Bullet Points</label>
              {(proj.bullet_points || []).map((bp, bi) => (
                <div key={bi} className="flex items-center gap-1.5 mt-1">
                  <span className="text-text-tertiary text-xs">•</span>
                  <EditableField value={bp} onChange={(v) => {
                    const bps = [...proj.bullet_points];
                    bps[bi] = v;
                    updateItem('projects', i, { ...proj, bullet_points: bps });
                  }} placeholder="Detail..." />
                  <button onClick={() => {
                    const bps = proj.bullet_points.filter((_, j) => j !== bi);
                    updateItem('projects', i, { ...proj, bullet_points: bps });
                  }} className="text-text-tertiary hover:text-accent-rose p-0.5">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => updateItem('projects', i, { ...proj, bullet_points: [...proj.bullet_points, ''] })}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 mt-1 transition-colors">
                <Plus className="w-3 h-3" /> Add bullet point
              </button>
            </div>
          </motion.div>
        ))}
        <button onClick={() => addItem('projects', { name: '', description: '', technologies: [], link: '', bullet_points: [''] } as ProjectItem)}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 transition-colors font-medium">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </SectionCard>

      <SectionCard title="Education">
        {(data.education || []).map((edu, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-surface-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">#{i + 1}</span>
              <button onClick={() => removeItem('education', i)} className="p-1 rounded text-text-tertiary hover:text-accent-rose hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <EditableField value={edu.degree} onChange={(v) => updateItem('education', i, { ...edu, degree: v })} placeholder="Degree" />
              <EditableField value={edu.institution} onChange={(v) => updateItem('education', i, { ...edu, institution: v })} placeholder="Institution" />
              <EditableField value={edu.graduation_date} onChange={(v) => updateItem('education', i, { ...edu, graduation_date: v })} placeholder="Graduation Date" />
              <EditableField value={edu.gpa} onChange={(v) => updateItem('education', i, { ...edu, gpa: v })} placeholder="GPA" />
            </div>
          </motion.div>
        ))}
        <button onClick={() => addItem('education', { degree: '', institution: '', location: '', graduation_date: '', gpa: '' } as EducationItem)}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 transition-colors font-medium">
          <Plus className="w-4 h-4" /> Add Education
        </button>
      </SectionCard>

      <SectionCard title="Certifications">
        {(data.certifications || []).map((cert, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-surface-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">#{i + 1}</span>
              <button onClick={() => removeItem('certifications', i)} className="p-1 rounded text-text-tertiary hover:text-accent-rose hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <EditableField value={cert.name} onChange={(v) => updateItem('certifications', i, { ...cert, name: v })} placeholder="Certification Name" />
              <EditableField value={cert.issuer} onChange={(v) => updateItem('certifications', i, { ...cert, issuer: v })} placeholder="Issuer" />
              <EditableField value={cert.date} onChange={(v) => updateItem('certifications', i, { ...cert, date: v })} placeholder="Date" />
            </div>
          </motion.div>
        ))}
        <button onClick={() => addItem('certifications', { name: '', issuer: '', date: '' } as CertificationItem)}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 transition-colors font-medium">
          <Plus className="w-4 h-4" /> Add Certification
        </button>
      </SectionCard>

      <SectionCard title="Achievements">
        {(data.achievements || []).map((ach, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-text-tertiary text-xs">•</span>
            <EditableField value={ach} onChange={(v) => {
              const arr = [...(data.achievements || [])];
              arr[i] = v;
              updateField('achievements', arr);
            }} placeholder="Your achievement..." />
            <button onClick={() => updateField('achievements', (data.achievements || []).filter((_, j) => j !== i))}
              className="text-text-tertiary hover:text-accent-rose p-0.5">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={() => updateField('achievements', [...(data.achievements || []), ''])}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 transition-colors font-medium">
          <Plus className="w-4 h-4" /> Add Achievement
        </button>
      </SectionCard>

      <SectionCard title="Publications">
        {(data.publications || []).map((pub, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-surface-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">#{i + 1}</span>
              <button onClick={() => removeItem('publications', i)} className="p-1 rounded text-text-tertiary hover:text-accent-rose hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <EditableField value={pub.title} onChange={(v) => updateItem('publications', i, { ...pub, title: v })} placeholder="Publication Title" />
              <EditableField value={pub.journal} onChange={(v) => updateItem('publications', i, { ...pub, journal: v })} placeholder="Journal / Venue" />
              <EditableField value={pub.date} onChange={(v) => updateItem('publications', i, { ...pub, date: v })} placeholder="Date" />
              <EditableField value={pub.link} onChange={(v) => updateItem('publications', i, { ...pub, link: v })} placeholder="URL (optional)" />
            </div>
          </motion.div>
        ))}
        <button onClick={() => addItem('publications', { title: '', journal: '', date: '', link: '' })}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 transition-colors font-medium">
          <Plus className="w-4 h-4" /> Add Publication
        </button>
      </SectionCard>
    </div>
  );
}
