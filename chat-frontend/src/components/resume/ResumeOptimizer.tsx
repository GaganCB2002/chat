import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Briefcase, Search, Sparkles, Download, AlertCircle, CheckCircle2, Loader2, ArrowRight, FileUp, FileDown, Eye, RotateCcw, Trash2, Palette, PlusCircle } from 'lucide-react';
import type { ResumeData, ATSAnalysis, JDData, ResumeStep, ResumeTemplate } from '../../types';
import { ATSReport } from './ATSReport';
import { ResumePreview } from './ResumePreview';
import { cn } from '../../utils/cn';
import * as resumeApi from '../../api/resume';
import { useSettingsStore } from '../../stores/settingsStore';

function getModel(): string {
  return useSettingsStore.getState().settings.model;
}

interface ResumeOptimizerProps {
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const PROGRESS_STEPS = [
  { id: 'uploading', label: 'Uploading...', icon: Upload },
  { id: 'extracting', label: 'Extracting Resume...', icon: FileText },
  { id: 'reading-jd', label: 'Reading Job Description...', icon: Briefcase },
  { id: 'analyzing', label: 'Analyzing ATS Match...', icon: Search },
  { id: 'generating', label: 'Generating Resume...', icon: Sparkles },
  { id: 'compiling', label: 'Compiling PDF...', icon: FileDown },
  { id: 'completed', label: 'Completed!', icon: CheckCircle2 },
];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
    return 'Unsupported file type. Please upload PDF or DOCX.';
  }
  if (file.size === 0) return 'Empty file.';
  if (file.size > MAX_FILE_SIZE) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 10 MB`;
  return null;
}

export function ResumeOptimizer({ onClose }: ResumeOptimizerProps) {
  const [step, setStep] = useState<ResumeStep>('upload-resume');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeJson, setResumeJson] = useState<ResumeData | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [jdParsed, setJdParsed] = useState<JDData | null>(null);
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ats' | 'preview'>('ats');
  const [editData, setEditData] = useState<ResumeData | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('classic');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [originalSkills, setOriginalSkills] = useState<string[]>([]);
  const [addedSkills, setAddedSkills] = useState<string[]>([]);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSkill = useCallback((skill: string) => {
    setEditData(prev => {
      if (!prev) return prev;
      const skills = prev.skills || [];
      if (skills.some(s => s.toLowerCase() === skill.toLowerCase())) return prev;
      return { ...prev, skills: [...skills, skill] };
    });
  }, []);

  const handleResumeSubmit = useCallback(async () => {
    if (!resumeText.trim() && !resumeFile) { setError('Please provide your resume'); return; }
    setError(null);
    setIsProcessing(true);
    setStep('analyzing');
    setProgressStep(0);
    try {
      let result;
      if (resumeFile) {
        result = await resumeApi.parseResume(resumeFile, undefined, getModel());
      } else {
        result = await resumeApi.parseResume(undefined, resumeText, getModel());
      }
      setProgressStep(1);
      
      const resContent = resumeFile ? result.raw_text : resumeText;
      setResumeText(resContent);

      if (result.parsed) setResumeJson(result.parsed);
      setStep('upload-jd');
    } catch (e: any) {
      setError(e.message || 'Failed to parse resume. Check that Ollama is running.');
      setStep('upload-resume');
    } finally {
      setIsProcessing(false);
    }
  }, [resumeText, resumeFile]);

  const handleJDSubmit = useCallback(async () => {
    if (!jdText.trim() && !jdFile) { setError('Please provide a job description'); return; }
    setError(null);
    setIsProcessing(true);
    setStep('analyzing');
    setProgressStep(2);
    try {
      let result;
      if (jdFile) {
        result = await resumeApi.parseJD(jdFile, undefined, getModel());
      } else {
        result = await resumeApi.parseJD(undefined, jdText, getModel());
      }
      setProgressStep(3);
      if (result.parsed) setJdParsed(result.parsed);
      const jdContent = jdFile ? result.raw_text : jdText;
      setJdText(jdContent);
      await runAnalysis(resumeText, jdContent, resumeJson, result.parsed);
    } catch (e: any) {
      setError(e.message || 'Failed to parse job description. Check that Ollama is running.');
      setStep('upload-jd');
      setIsProcessing(false);
    }
  }, [jdText, jdFile, resumeText, resumeJson]);

  const runAnalysis = async (rText: string, jText: string, rJson: any, jJson: any) => {
    try {
      setProgressStep(3);
      const originalSkillsList = rJson?.skills || [];
      setOriginalSkills(originalSkillsList);
      const analysisResult = await resumeApi.analyzeResume(
        rText, jText,
        rJson ? JSON.stringify(rJson) : '{}',
        jJson ? JSON.stringify(jJson) : '{}',
        getModel()
      );
      setAnalysis(analysisResult);
      setProgressStep(4);
      const optimized = await resumeApi.generateOptimized(
        rText, jText,
        rJson ? JSON.stringify(rJson) : '{}',
        jJson ? JSON.stringify(jJson) : '{}',
        JSON.stringify(analysisResult),
        undefined,
        getModel()
      );
      setOptimizedResume(optimized);
      setEditData(optimized);
      const newSkills = (optimized.skills || []).filter(
        (s: string) => !originalSkillsList.some((os: string) => os.toLowerCase() === s.toLowerCase())
      );
      setAddedSkills(newSkills);
      setProgressStep(5);
      setStep('results');
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Check that Ollama is running and try again.');
      setStep((s) => s !== 'results' ? 'upload-jd' : 'results');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!editData) return;
    setIsProcessing(true);
    setStep('generating');
    setProgressStep(4);
    try {
      const optimized = await resumeApi.generateOptimized(
        resumeText, jdText,
        resumeJson ? JSON.stringify(resumeJson) : '{}',
        jdParsed ? JSON.stringify(jdParsed) : '{}',
        analysis ? JSON.stringify(analysis) : '{}',
        JSON.stringify(editData),
        getModel()
      );
      setOptimizedResume(optimized);
      setEditData(optimized);
      const newSkills = (optimized.skills || []).filter(
        (s: string) => !originalSkills.some((os) => os.toLowerCase() === s.toLowerCase())
      );
      setAddedSkills(newSkills);
      setProgressStep(5);
      setStep('results');
    } catch (e: any) {
      setError(e.message || 'Failed to regenerate');
      setStep('results');
    } finally {
      setIsProcessing(false);
    }
  };

  const TEMPLATES: { id: ResumeTemplate; label: string; desc: string }[] = [
    { id: 'classic', label: 'Classic', desc: 'Traditional serif layout with lines' },
    { id: 'modern', label: 'Modern', desc: 'Clean sans-serif with teal accents' },
    { id: 'professional', label: 'Professional', desc: 'Dark navy headings, wider margins' },
    { id: 'minimal', label: 'Minimal', desc: 'Sparse, light-gray separators' },
  ];

  const handleDownload = async (format: 'pdf' | 'docx' | 'latex') => {
    const data = editData || optimizedResume;
    if (!data) return;
    try {
      let blob: Blob;
      let filename: string;
      if (format === 'latex') {
        const result = await resumeApi.downloadLatex(data, selectedTemplate);
        blob = new Blob([result.latex], { type: 'text/plain' });
        filename = 'optimized_resume.tex';
      } else if (format === 'pdf') {
        blob = await resumeApi.downloadPdf(data, selectedTemplate);
        filename = 'optimized_resume.pdf';
      } else {
        blob = await resumeApi.downloadDocx(data, selectedTemplate);
        filename = 'optimized_resume.docx';
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      setError(e.message || `Failed to download ${format.toUpperCase()}`);
    }
  };

  const renderUploadResume = () => (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text">Your Resume</h3>
          <p className="text-xs text-text-secondary">Paste your resume text or upload a file</p>
        </div>
      </div>
      <textarea
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        placeholder="Paste your resume text here..."
        rows={8}
        className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-y"
      />
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-text-tertiary font-medium uppercase">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <input ref={resumeInputRef} type="file" accept=".pdf,.docx" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) {
          const err = validateFile(f);
          if (err) { setError(err); return; }
          setError(null);
          setResumeFile(f);
          setResumeText(`[File selected: ${f.name}]`);
        }
      }} className="hidden" />
      <button
        onClick={() => resumeInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-surface-secondary hover:bg-surface-tertiary/50 text-sm text-text-secondary hover:text-text transition-all w-full justify-center"
      >
        <FileUp className="w-4 h-4" />
        {resumeFile ? resumeFile.name : 'Upload Resume as PDF or DOCX'}
      </button>
      {resumeFile && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-secondary border border-border text-xs text-text">
          <FileText className="w-3.5 h-3.5 text-primary-500" />
          <span className="flex-1 truncate">{resumeFile.name}</span>
          <button onClick={() => { setResumeFile(null); if (resumeText.startsWith('[File selected:')) setResumeText(''); }} className="text-text-tertiary hover:text-accent-rose">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
      <button
        onClick={handleResumeSubmit}
        disabled={isProcessing || (!resumeText.trim() && !resumeFile)}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20 w-full justify-center"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        {isProcessing ? 'Processing...' : 'Next Step'}
      </button>
    </div>
  );

  const renderUploadJD = () => (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text">Job Description</h3>
          <p className="text-xs text-text-secondary">Paste the JD or upload a file</p>
        </div>
      </div>
      <textarea
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        placeholder="Paste the job description here..."
        rows={8}
        className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-y"
      />
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-text-tertiary font-medium uppercase">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <input ref={jdFileInputRef} type="file" accept=".pdf,.docx" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) { setJdFile(f); setJdText(`[File selected: ${f.name}]`); }
      }} className="hidden" />
      <button
        onClick={() => jdFileInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-surface-secondary hover:bg-surface-tertiary/50 text-sm text-text-secondary hover:text-text transition-all w-full justify-center"
      >
        <FileText className="w-4 h-4" />
        {jdFile ? jdFile.name : 'Upload JD as PDF or DOCX'}
      </button>
      {jdFile && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-secondary border border-border text-xs text-text">
          <FileText className="w-3.5 h-3.5 text-primary-500" />
          <span className="flex-1 truncate">{jdFile.name}</span>
          <button onClick={() => { setJdFile(null); if (jdText.startsWith('[File selected:')) setJdText(''); }} className="text-text-tertiary hover:text-accent-rose">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
      <button
        onClick={handleJDSubmit}
        disabled={isProcessing || (!jdText.trim() && !jdFile)}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20 w-full justify-center"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {isProcessing ? 'Analyzing...' : 'Analyze Resume'}
      </button>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center py-12 px-4">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
        <div className="absolute -inset-1 rounded-full border-2 border-primary-200 dark:border-primary-800 animate-ping opacity-20" />
      </div>
      <div className="w-full max-w-xs space-y-3">
        {PROGRESS_STEPS.slice(0, 6).map((ps, i) => (
          <div key={ps.id} className="flex items-center gap-3">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300',
              i < progressStep ? 'bg-green-50 dark:bg-green-900/20 text-green-500' :
              i === progressStep ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' :
              'bg-surface-tertiary text-text-tertiary'
            )}>
              {i < progressStep ? <CheckCircle2 className="w-4 h-4" /> :
               i === progressStep ? <Loader2 className="w-4 h-4 animate-spin" /> :
               <ps.icon className="w-4 h-4" />}
            </div>
            <span className={cn(
              'text-sm',
              i < progressStep ? 'text-green-600 dark:text-green-400' :
              i === progressStep ? 'text-text font-medium' :
              'text-text-tertiary'
            )}>
              {ps.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('ats')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'ats' ? 'bg-primary-500 text-white shadow-sm' : 'text-text-secondary hover:text-text hover:bg-surface-secondary'
          )}
        >
          <Search className="w-4 h-4 inline mr-1.5" />ATS Report
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'preview' ? 'bg-primary-500 text-white shadow-sm' : 'text-text-secondary hover:text-text hover:bg-surface-secondary'
          )}
        >
          <Eye className="w-4 h-4 inline mr-1.5" />Preview & Edit
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ats' && analysis && (
          <motion.div key="ats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ATSReport analysis={analysis} onAddSkill={handleAddSkill} existingSkills={editData?.skills || []} />
          </motion.div>
        )}
        {activeTab === 'preview' && editData && (
          <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ResumePreview data={editData} onChange={setEditData} />
          </motion.div>
        )}
      </AnimatePresence>

      {addedSkills.length > 0 && (
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
          <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 flex items-center gap-1.5 mb-2">
            <PlusCircle className="w-3.5 h-3.5" /> Skills Added from Job Description
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {addedSkills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[11px] font-medium border border-green-300 dark:border-green-700">
                <PlusCircle className="w-2.5 h-2.5" />{s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-3 border-t border-border">
        <div className="relative">
          <button
            onClick={() => setShowTemplatePicker(!showTemplatePicker)}
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs text-text-secondary hover:text-text hover:bg-surface-tertiary transition-all w-full mb-2"
          >
            <Palette className="w-3.5 h-3.5" /> Template: {TEMPLATES.find(t => t.id === selectedTemplate)?.label || 'Classic'}
          </button>
          <AnimatePresence>
            {showTemplatePicker && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute bottom-full left-0 right-0 mb-1 p-2 rounded-xl bg-surface border border-border shadow-xl z-10 grid grid-cols-2 gap-1.5"
              >
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t.id); setShowTemplatePicker(false); }}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs text-left transition-all',
                      selectedTemplate === t.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text'
                    )}
                  >
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-[9px] opacity-70">{t.desc}</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('pdf')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all shadow-sm shadow-primary-500/20 text-sm"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={() => handleDownload('docx')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/20 text-sm"
          >
            <Download className="w-4 h-4" /> DOCX
          </button>
          <button
            onClick={() => handleDownload('latex')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text font-medium hover:bg-surface-tertiary transition-all text-sm"
          >
            <FileText className="w-4 h-4" /> LaTeX
          </button>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-text hover:bg-surface-tertiary transition-all text-sm disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" /> Regenerate with Edits
        </button>
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div className="flex flex-col items-center py-12">
      <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
      <p className="text-sm font-medium text-text">Generating your optimized resume...</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-start justify-center pt-12 pb-8 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-secondary">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Resume Optimizer</h2>
              <p className="text-[10px] text-text-tertiary">
                {step === 'upload-resume' && 'Step 1: Upload your resume'}
                {step === 'upload-jd' && 'Step 2: Add job description'}
                {step === 'analyzing' && 'Analyzing...'}
                {step === 'results' && 'Analysis complete'}
                {step === 'generating' && 'Generating...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          {step === 'upload-resume' && renderUploadResume()}
          {step === 'upload-jd' && renderUploadJD()}
          {step === 'analyzing' && renderAnalyzing()}
          {step === 'results' && renderResults()}
          {step === 'generating' && renderGenerating()}

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 text-accent-rose mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-accent-rose font-medium">{error}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setError(null)} className="text-xs text-accent-rose/70 hover:text-accent-rose underline">Dismiss</button>
                  {error.toLowerCase().includes('ollama') && (
                    <a href="http://localhost:11434" target="_blank" rel="noopener noreferrer" className="text-xs text-accent-rose/70 hover:text-accent-rose underline">Check Ollama Status</a>
                  )}
                  {(error.toLowerCase().includes('gemini') || error.toLowerCase().includes('quota')) && (
                    <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" className="text-xs text-accent-rose/70 hover:text-accent-rose underline">Check Gemini Quota</a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
