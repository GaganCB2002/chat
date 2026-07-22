export type MessageRole = 'user' | 'assistant';
export type MessageAction = 'none' | 'like' | 'dislike';
export type ViewMode = 'chat' | 'dashboard';
export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'base' | 'lg';
export type ModelId = 'gemma2' | 'llama3' | 'gemini-pro' | 'qwen3.5';

export interface InstalledModel {
  name: string;
  modified_at: string;
  size: number;
}

export interface OllamaStatus {
  connected: boolean;
  checking: boolean;
  availableModels: InstalledModel[];
}
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ModelOption {
  id: ModelId;
  name: string;
  provider: string;
  description: string;
  icon: string;
}

export type MessageStatus = 'sending' | 'sent' | 'generating' | 'completed' | 'failed' | 'interrupted';

export interface ThinkingStep {
  label: string;
  status: 'pending' | 'active' | 'completed';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isEditing?: boolean;
  action?: MessageAction;
  tokens?: number;
  pinned?: boolean;
  status?: MessageStatus;
  thinkingSteps?: ThinkingStep[];
  files?: UploadedFile[];
}

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  pinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  messages: Message[];
  folderId?: string;
  tags?: string[];
  model?: ModelId;
}

export interface Folder {
  id: string;
  name: string;
  chatIds: string[];
  icon?: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  usageCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
}

export interface AppSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  sendOnEnter: boolean;
  showTimestamps: boolean;
  showTokenCount: boolean;
  enableSuggestions: boolean;
  model: ModelId;
  language: string;
  reducedMotion: boolean;
  highContrast: boolean;
  focusMode: boolean;
  readingMode: boolean;
}

export interface DeveloperInfo {
  apiStatus: 'online' | 'degraded' | 'offline';
  backendStatus: 'online' | 'degraded' | 'offline';
  databaseStatus: 'online' | 'degraded' | 'offline';
  currentModel: ModelId;
  responseTime: number;
  environment: 'production' | 'staging' | 'development';
  version: string;
  latencyMs: number;
  streaming: boolean;
}

export interface Analytics {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  activeToday: number;
  avgMessagesPerConversation: number;
  topTopics: { topic: string; count: number }[];
  weeklyActivity: { day: string; value: number }[];
  dailyStats: { label: string; value: number; trend: number }[];
}

export interface UserCredits {
  plan: 'Free' | 'Pro' | 'Enterprise';
  inputCreditsUsed: number;
  inputCreditsLimit: number;
  outputCreditsUsed: number;
  outputCreditsLimit: number;
  dailyRequestsUsed: number;
  dailyRequestsLimit: number;
  totalTokensConsumed: number;
  avgTokensPerRequest: number;
  contextWindowUsed: number;
  contextWindowMax: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: Date;
}

export interface TokenQuota {
  dailyTokenLimit: number;
  dailyTokensUsed: number;
  dailyRequestLimit: number;
  dailyRequestsUsed: number;
  plan: 'Free' | 'Pro' | 'Enterprise';
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  age: number | null;
  created_at?: string;
}

export interface CaptchaData {
  code: string;
  generatedAt: number;
  expiresAt: number;
}

export interface QueueItem {
  id: string;
  content: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
}

export interface Toast {
  id: string;
  variant: ToastType;
  title: string;
  description: string;
  duration?: number;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  skills: string[];
  technical_skills: Record<string, string[]>;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  achievements: string[];
  publications: PublicationItem[];
}

export interface ExperienceItem {
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  bullet_points: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  link: string;
  bullet_points: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  location: string;
  graduation_date: string;
  gpa: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  date: string;
}

export interface PublicationItem {
  title: string;
  journal: string;
  date: string;
  link: string;
}

export interface ATSAnalysis {
  ats_score: number;
  keyword_match: number;
  skills_match: number;
  experience_match: number;
  education_match: number;
  formatting_score: number;
  missing_skills: MissingSkill[];
  suggestions: ResumeSuggestion[];
  keyword_coverage?: KeywordCoverage;
  strengths: string[];
  weaknesses: string[];
}

export interface MissingSkill {
  skill: string;
  category: string;
  relevance: string;
}

export interface ResumeSuggestion {
  section: string;
  recommendation: string;
  reason: string;
}

export interface KeywordCoverage {
  matched_keywords: string[];
  missing_keywords: string[];
  coverage_percentage: number;
}

export interface JDData {
  job_title: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  experience_requirements: string;
  education: string;
  certifications: string[];
  keywords: string[];
  technologies: string[];
  soft_skills: string[];
  summary: string;
}

export type ResumeStep = 'upload-resume' | 'upload-jd' | 'analyzing' | 'results' | 'editing' | 'generating' | 'complete';

export type ResumeTemplate = 'classic' | 'modern' | 'professional' | 'minimal';
