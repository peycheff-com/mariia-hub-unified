export interface TranslationEntry {
  id: string;
  source_text: string;
  target_text: string;
  source_lang: string;
  target_lang: string;
  context?: string;
  category?: string;
  quality_score?: number;
  usage_count: number;
  last_used: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  approved?: boolean;
  notes?: string;
}

export interface TranslationMatch {
  text: string;
  score: number;
  entry: TranslationEntry;
}

export interface TMSearchOptions {
  minScore?: number;
  maxResults?: number;
  includeUnapproved?: boolean;
  category?: string;
  context?: string;
}

export interface TranslationProject {
  id: string;
  name: string;
  description?: string;
  source_lang: string;
  target_langs: string[];
  status: 'draft' | 'active' | 'review' | 'completed';
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  progress: number;
}

export interface TranslationTask {
  id: string;
  project_id: string;
  source_text: string;
  context?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'rejected';
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  notes?: string;
  word_count?: number;
  character_count?: number;
}

export interface Translation {
  id: string;
  task_id: string;
  translator_id: string;
  target_text: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  quality_score?: number;
  notes?: string;
  tm_matches?: number;
  time_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface TranslationComment {
  id: string;
  translation_id: string;
  author_id: string;
  comment: string;
  created_at: string;
}

export interface TranslationHistory {
  id: string;
  translation_id: string;
  old_value?: string;
  new_value: string;
  field: string;
  changed_by: string;
  changed_at: string;
}

export interface TranslationStats {
  total: number;
  approved: number;
  pending: number;
  byLanguage: Record<string, number>;
  byCategory: Record<string, number>;
  byTranslator?: Record<string, number>;
  byProject?: Record<string, number>;
}

export interface TranslationEditorProps {
  sourceText: string;
  onTranslationSelect: (translation: string) => void;
  sourceLang?: string;
  targetLang?: string;
  context?: string;
  category?: string;
  onSaveToTM?: (translation: string, metadata?: Partial<TranslationEntry>) => void;
}

export interface TMExportOptions {
  format: 'json' | 'csv' | 'xliff' | 'tmx';
  sourceLang?: string;
  targetLang?: string;
  category?: string;
  includeUnapproved?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TMImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export interface TranslationQualityMetrics {
  accuracy: number;
  consistency: number;
  completeness: number;
  style: number;
  terminology: number;
  overall: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: 'terminology' | 'consistency' | 'grammar' | 'style' | 'length' | 'variables';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion?: string;
  position?: {
    start: number;
    end: number;
  };
}

export interface TranslationGlossary {
  id: string;
  source_term: string;
  target_term: string;
  source_lang: string;
  target_lang: string;
  domain?: string;
  definition?: string;
  notes?: string;
  approved: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TranslationMemoryStats {
  totalEntries: number;
  approvedEntries: number;
  pendingEntries: number;
  languagePairs: Record<string, number>;
  categories: Record<string, number>;
  topUsedEntries: TranslationEntry[];
  recentEntries: TranslationEntry[];
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  usageTrends: {
    date: string;
    usage: number;
  }[];
}

export interface TMXImportOptions {
  sourceLanguage: string;
  targetLanguage: string;
  defaultCategory?: string;
  approveOnImport?: boolean;
  skipExisting?: boolean;
}

export interface TranslationWorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'translation' | 'review' | 'approval' | 'qa';
  assigned_to?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at?: string;
  notes?: string;
}

export interface TranslationWorkflow {
  id: string;
  project_id: string;
  task_id: string;
  steps: TranslationWorkflowStep[];
  current_step: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ConcordanceSearchOptions {
  term: string;
  source_lang?: string;
  target_lang?: string;
  context?: string;
  max_results?: number;
  include_source?: boolean;
  include_target?: boolean;
}

export interface ConcordanceResult {
  text: string;
  source_text?: string;
  target_text?: string;
  context?: string;
  score: number;
  entry: TranslationEntry;
}

export interface TranslationAutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    source_pattern?: string;
    target_pattern?: string;
    category?: string;
    confidence_min?: number;
  };
  actions: {
    auto_approve?: boolean;
    category_assignment?: string;
    translator_assignment?: string;
    priority_level?: 'low' | 'medium' | 'high' | 'urgent';
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TranslationProgress {
  project_id: string;
  total_words: number;
  translated_words: number;
  reviewed_words: number;
  approved_words: number;
  progress_percentage: number;
  estimated_completion?: string;
  translators: {
    id: string;
    name: string;
    words_translated: number;
    productivity_score: number;
  }[];
}