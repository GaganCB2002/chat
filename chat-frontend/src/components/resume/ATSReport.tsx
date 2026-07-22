import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Lightbulb, TrendingUp, ArrowUp, Plus } from 'lucide-react';
import type { ATSAnalysis, MissingSkill, ResumeSuggestion } from '../../types';
import { cn } from '../../utils/cn';

interface ATSReportProps {
  analysis: ATSAnalysis;
  onAddSkill?: (skill: string) => void;
  existingSkills?: string[];
}

function ScoreGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="68" height="68" viewBox="0 0 68 68" className="transform -rotate-90">
        <circle cx="34" cy="34" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-tertiary" />
        <circle cx="34" cy="34" r="28" fill="none" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="text-lg font-bold" style={{ color }}>{value}%</span>
      <span className="text-[10px] text-text-tertiary text-center leading-tight">{label}</span>
    </div>
  );
}

function MissingSkillsList({ skills, onAddSkill, existingSkills = [] }: { skills: MissingSkill[]; onAddSkill?: (skill: string) => void; existingSkills?: string[] }) {
  const groups: Record<string, MissingSkill[]> = {};
  for (const s of skills) {
    const cat = s.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(s);
  }
  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">{cat.replace(/_/g, ' ')}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((s, i) => {
              const alreadyHas = existingSkills.some(es => es.toLowerCase() === s.skill.toLowerCase());
              return (
                <span key={i} className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border',
                  alreadyHas
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                )}>
                  {alreadyHas ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {s.skill}
                  {onAddSkill && !alreadyHas && (
                    <button
                      onClick={() => onAddSkill(s.skill)}
                      className="ml-0.5 p-0.5 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors"
                      title="Add to skills"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SuggestionsList({ suggestions }: { suggestions: ResumeSuggestion[] }) {
  const sectionLabels: Record<string, string> = {
    professional_summary: 'Professional Summary',
    project_descriptions: 'Project Descriptions',
    experience_bullets: 'Experience Bullet Points',
    skills_section: 'Skills Section',
    achievements: 'Achievements',
    formatting: 'Formatting',
    ats_keywords: 'ATS Keywords',
  };
  return (
    <div className="space-y-2">
      {suggestions.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="p-3 rounded-xl bg-surface-secondary border border-border"
        >
          <div className="flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                {sectionLabels[s.section] || s.section.replace(/_/g, ' ')}
              </span>
              <p className="text-sm text-text mt-0.5">{s.recommendation}</p>
              <p className="text-[11px] text-text-tertiary mt-0.5 italic">{s.reason}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function ATSReport({ analysis, onAddSkill, existingSkills = [] }: ATSReportProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <ScoreGauge label="ATS Match" value={analysis.ats_score} color="#3b82f6" />
        <ScoreGauge label="Keywords" value={analysis.keyword_match} color="#8b5cf6" />
        <ScoreGauge label="Skills" value={analysis.skills_match} color="#06b6d4" />
        <ScoreGauge label="Experience" value={analysis.experience_match} color="#10b981" />
        <ScoreGauge label="Education" value={analysis.education_match} color="#f59e0b" />
        <ScoreGauge label="Formatting" value={analysis.formatting_score} color="#ec4899" />
      </div>

      {analysis.keyword_coverage && (
        <div className="p-4 rounded-xl bg-surface-secondary border border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text">Keyword Coverage</h4>
            <span className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              analysis.keyword_coverage.coverage_percentage >= 70 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
              analysis.keyword_coverage.coverage_percentage >= 40 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
              'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
            )}>
              {analysis.keyword_coverage.coverage_percentage}%
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {analysis.keyword_coverage.matched_keywords.map((kw, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-[10px] font-medium border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-2.5 h-2.5" />{kw}
              </span>
            ))}
          </div>
          {analysis.keyword_coverage.missing_keywords.length > 0 && (
            <>
              <p className="text-xs font-medium text-text-secondary mb-1.5">Missing Keywords:</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keyword_coverage.missing_keywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-[10px] font-medium border border-rose-200 dark:border-rose-800">
                    <XCircle className="w-2.5 h-2.5" />{kw}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {analysis.missing_skills.length > 0 && (
        <div className="p-4 rounded-xl bg-surface-secondary border border-border">
          <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Skills
            {onAddSkill && <span className="text-[10px] font-normal text-text-tertiary ml-auto">Click + to add</span>}
          </h4>
          <MissingSkillsList skills={analysis.missing_skills} onAddSkill={onAddSkill} existingSkills={existingSkills} />
        </div>
      )}

      {analysis.strengths.length > 0 && (
        <div className="p-4 rounded-xl bg-surface-secondary border border-border">
          <h4 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Strengths
          </h4>
          <ul className="space-y-1">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text">
                <ArrowUp className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.weaknesses.length > 0 && (
        <div className="p-4 rounded-xl bg-surface-secondary border border-border">
          <h4 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500" /> Areas to Improve
          </h4>
          <ul className="space-y-1">
            {analysis.weaknesses.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text">
                <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary-500" /> Improvement Suggestions
          </h4>
          <SuggestionsList suggestions={analysis.suggestions} />
        </div>
      )}
    </div>
  );
}
