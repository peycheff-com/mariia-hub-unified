import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import {
  Save, Eye, Undo2, Redo2, Bold, Italic, Link, Image as ImageIcon, Code, Type, Palette,
  Sparkles, Clock, Globe, BarChart3, Lock, Unlock, FileText, History, Zap,
  CheckCircle, AlertCircle, RefreshCw, Copy, Settings, BookOpen, Users,
  MessageSquare, TrendingUp, Target, Calendar, Filter, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input, Textarea, Progress, Avatar, AvatarFallback, AvatarImage,
  Switch, Label, Separator, Tooltip
} from '@/components/ui';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AIContentOptimizer } from './AIContentOptimizer';
import { ContentVersionHistory } from './ContentVersionHistory';
import { ContentCollaboration } from './ContentCollaboration';

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  height?: number;
  onContentChange?: (content: string) => void;
  onAutoSave?: (content: string) => Promise<void>;
  autoSaveInterval?: number;
  templates?: ContentTemplate[];
  enableAiAssistance?: boolean;
  language?: string;
  readOnly?: boolean;
  documentId?: string;
  collaborationEnabled?: boolean;
  aiOptimizationEnabled?: boolean;
  versionHistoryEnabled?: boolean;
  seoOptimizationEnabled?: boolean;
  contentAnalyticsEnabled?: boolean;
  customPlugins?: EditorPlugin[];
  theme?: 'default' | 'minimal' | 'luxury' | 'technical';
  exportFormats?: ('html' | 'pdf' | 'docx' | 'markdown')[];
  onVersionChange?: (version: ContentVersion) => void;
  onCollaboratorJoin?: (collaborator: Collaborator) => void;
  onAnalyticsUpdate?: (analytics: ContentAnalytics) => void;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  tags?: string[];
  author?: string;
  createdAt?: Date;
  usageCount?: number;
  isPremium?: boolean;
}

interface EditorPlugin {
  name: string;
  version: string;
  enabled: boolean;
  settings?: Record<string, any>;
}

interface ContentVersion {
  id: string;
  version: number;
  content: string;
  createdAt: Date;
  author: string;
  changes: string;
  wordCount: number;
  characterCount: number;
  metadata?: Record<string, any>;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'editor' | 'reviewer' | 'commenter';
  isOnline: boolean;
  cursor?: {
    position: number;
    selection?: { start: number; end: number };
  };
  lastSeen: Date;
}

interface ContentAnalytics {
  readingTime: number; // minutes
  readabilityScore: number; // 0-100
  seoScore: number; // 0-100
  engagementPredictor: number; // 0-100
  keywordDensity: Record<string, number>;
  contentStructure: {
    headings: { level: number; text: string; position: number }[];
    paragraphs: number;
    words: number;
    characters: number;
    images: number;
    links: number;
  };
  aiInsights: {
    suggestions: string[];
    improvements: string[];
    warnings: string[];
  };
}

interface SEOAnalysis {
  title: {
    score: number;
    suggestions: string[];
  };
  metaDescription: {
    score: number;
    suggestions: string[];
  };
  headings: {
    score: number;
    structure: {
      h1: number;
      h2: number;
      h3: number;
    };
    suggestions: string[];
  };
  content: {
    score: number;
    keywordDensity: Record<string, number>;
    readability: number;
    suggestions: string[];
  };
  overall: number;
}

const DEFAULT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'service-description',
    name: 'Service Description',
    description: 'Perfect template for service descriptions',
    category: 'Services',
    content: `
      <h2>Service Overview</h2>
      <p>Transform your beauty routine with our premium <strong>[SERVICE_NAME]</strong> service.</p>

      <h3>What to Expect</h3>
      <ul>
        <li>Professional consultation to understand your needs</li>
        <li>Customized approach tailored to your preferences</li>
        <li>Premium products and techniques</li>
        <li>Lasting, natural-looking results</li>
      </ul>

      <h3>Benefits</h3>
      <p>Experience the confidence that comes with expertly applied beauty enhancements.</p>

      <blockquote>
        "Absolutely loved my experience! The attention to detail and quality exceeded my expectations."
      </blockquote>
    `
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Standard blog post structure',
    category: 'Content',
    content: `
      <h2>[CATCHY_TITLE]</h2>
      <p><em>Published on [DATE] • Reading time: [MINUTES] minutes</em></p>

      <p>Are you ready to discover the secrets to [TOPIC]? In this comprehensive guide, we'll explore everything you need to know about achieving [DESIRED_OUTCOME].</p>

      <h3>Why [TOPIC] Matters</h3>
      <p>Understanding the importance of [TOPIC] is the first step toward [BENEFIT]. Whether you're a beginner or looking to enhance your existing knowledge, this guide will provide valuable insights.</p>

      <h3>Key Benefits</h3>
      <ul>
        <li>Benefit 1: [SPECIFIC_ADVANTAGE]</li>
        <li>Benefit 2: [SPECIFIC_ADVANTAGE]</li>
        <li>Benefit 3: [SPECIFIC_ADVANTAGE]</li>
      </ul>

      <h3>Getting Started</h3>
      <p>Ready to begin your journey? Here's what you need to know to get started with [TOPIC].</p>

      <h2>Conclusion</h2>
      <p>By following these guidelines and understanding the key principles of [TOPIC], you'll be well on your way to achieving [DESIRED_OUTCOME]. Remember that consistency and proper technique are essential for the best results.</p>
    `
  },
  {
    id: 'faq-item',
    name: 'FAQ Entry',
    description: 'Frequently asked question format',
    category: 'Support',
    content: `
      <h3><strong>[QUESTION]</strong></h3>
      <p>[DETAILED_ANSWER]</p>

      <blockquote>
        <p><em>💡 <strong>Pro Tip:</strong> [ADDITIONAL_INSIGHT_OR_RECOMMENDATION]</em></p>
      </blockquote>

      <p>If you have any additional questions about [TOPIC], please don't hesitate to <a href="/contact">contact us</a> for a personalized consultation.</p>
    `
  }
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  placeholder = 'Start writing your content...',
  height = 500,
  onContentChange,
  onAutoSave,
  autoSaveInterval = 30000, // 30 seconds
  templates = DEFAULT_TEMPLATES,
  enableAiAssistance = true,
  language = 'en',
  readOnly = false,
  documentId,
  collaborationEnabled = false,
  aiOptimizationEnabled = false,
  versionHistoryEnabled = false,
  seoOptimizationEnabled = false,
  contentAnalyticsEnabled = false,
  customPlugins = [],
  theme = 'default',
  exportFormats = ['html'],
  onVersionChange,
  onCollaboratorJoin,
  onAnalyticsUpdate
}) => {
  const editorRef = useRef<any>(null);
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');

  // Advanced features state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activePlugins, setActivePlugins] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showAIOptimizer, setShowAIOptimizer] = useState(false);
  const [contentFocus, setContentFocus] = useState(100); // Content focus level
  const [distractionFree, setDistractionFree] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [realTimeCollaboration, setRealTimeCollaboration] = useState(collaborationEnabled);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState(exportFormats[0]);

  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // Auto-save functionality
  useEffect(() => {
    if (!onAutoSave || !autoSaveEnabled) return;

    const interval = setInterval(async () => {
      if (content && content !== initialContent) {
        await handleAutoSave();
        await createVersion('Auto-save');
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [content, autoSaveInterval, onAutoSave, autoSaveEnabled]);

  // Content analysis
  useEffect(() => {
    if (contentAnalyticsEnabled && content) {
      analyzeContent();
    }
    if (seoOptimizationEnabled && content) {
      analyzeSEO();
    }
  }, [content, contentAnalyticsEnabled, seoOptimizationEnabled]);

  // Real-time collaboration simulation
  useEffect(() => {
    if (realTimeCollaboration && documentId) {
      simulateCollaboration();
    }
  }, [realTimeCollaboration, documentId]);

  // AI content optimization
  useEffect(() => {
    if (aiOptimizationEnabled && content && !isAiProcessing) {
      const timeout = setTimeout(() => {
        generateAISuggestions();
      }, 5000); // Wait 5 seconds after user stops typing

      return () => clearTimeout(timeout);
    }
  }, [content, aiOptimizationEnabled, isAiProcessing]);

  // Calculate word and character count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(text.length);
  }, [content]);

  const handleAutoSave = useCallback(async () => {
    if (!onAutoSave || isAutoSaving) return;

    setIsAutoSaving(true);
    try {
      await onAutoSave(content);
      setLastSaved(new Date());
      toast aria-live="polite" aria-atomic="true"({
        title: 'Auto-saved',
        description: 'Your content has been automatically saved.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Auto-save failed',
        description: 'Unable to save content automatically.',
        variant: 'destructive',
      });
    } finally {
      setIsAutoSaving(false);
    }
  }, [content, onAutoSave, isAutoSaving, toast aria-live="polite" aria-atomic="true"]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);

    // Trigger real-time collaboration updates
    if (realTimeCollaboration) {
      broadcastContentChange(newContent);
    }
  }, [onContentChange, realTimeCollaboration]);

  // Advanced functions
  const analyzeContent = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const text = content.replace(/<[^>]*>/g, '');
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

      // Simulate content analysis
      const readingTime = Math.ceil(words.length / 200); // Average reading speed
      const readabilityScore = Math.min(100, Math.max(0,
        100 - (text.length / 100) + (sentences.length / words.length) * 50
      ));

      // Extract headings structure
      const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h\1>/gi;
      const headings: { level: number; text: string; position: number }[] = [];
      let match;
      while ((match = headingRegex.exec(content)) !== null) {
        headings.push({
          level: parseInt(match[1]),
          text: match[2].trim(),
          position: match.index
        });
      }

      // Count images and links
      const imageCount = (content.match(/<img[^ alt="Image" />]*>/gi) || []).length;
      const linkCount = (content.match(/<a[^>]*>/gi) || []).length;

      const newAnalytics: ContentAnalytics = {
        readingTime,
        readabilityScore,
        seoScore: Math.floor(readabilityScore * 0.8), // Placeholder
        engagementPredictor: Math.floor(Math.random() * 30) + 70, // 70-100
        keywordDensity: extractKeywords(text),
        contentStructure: {
          headings,
          paragraphs: paragraphs.length,
          words: words.length,
          characters: text.length,
          images: imageCount,
          links: linkCount
        },
        aiInsights: {
          suggestions: generateContentSuggestions(headings, words.length),
          improvements: generateImprovementSuggestions(readabilityScore),
          warnings: generateContentWarnings(text)
        }
      };

      setAnalytics(newAnalytics);
      onAnalyticsUpdate?.(newAnalytics);
    } catch (error) {
      console.error('Content analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, onAnalyticsUpdate]);

  const analyzeSEO = useCallback(async () => {
    try {
      const text = content.replace(/<[^>]*>/g, '');
      const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Count heading structure
      const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
      const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
      const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;

      const newSEOAnalysis: SEOAnalysis = {
        title: {
          score: title.length >= 30 && title.length <= 60 ? 100 : 50,
          suggestions: title.length < 30 ? ['Title is too short'] :
                     title.length > 60 ? ['Title is too long'] : []
        },
        metaDescription: {
          score: 0, // Would be calculated from actual meta description
          suggestions: ['Add meta description for better SEO']
        },
        headings: {
          score: h1Count === 1 && h2Count > 0 ? 100 : 70,
          structure: { h1: h1Count, h2: h2Count, h3: h3Count },
          suggestions: h1Count !== 1 ? ['Use exactly one H1 tag'] :
                     h2Count === 0 ? ['Add H2 tags for better structure'] : []
        },
        content: {
          score: Math.min(100, text.length / 10), // Score based on content length
          keywordDensity: extractKeywords(text),
          readability: Math.min(100, text.split(' ').length / 20),
          suggestions: text.length < 300 ? ['Content is too short for good SEO'] : []
        },
        overall: 0 // Would be calculated from individual scores
      };

      newSEOAnalysis.overall = Math.round(
        (newSEOAnalysis.title.score +
         newSEOAnalysis.metaDescription.score +
         newSEOAnalysis.headings.score +
         newSEOAnalysis.content.score) / 4
      );

      setSeoAnalysis(newSEOAnalysis);
    } catch (error) {
      console.error('SEO analysis failed:', error);
    }
  }, [content]);

  const generateAISuggestions = useCallback(async () => {
    if (!enableAiAssistance) return;

    setIsAiProcessing(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const suggestions = [
        'Consider adding a compelling introduction to hook readers',
        'Break up long paragraphs for better readability',
        'Add statistics or data to support your claims',
        'Include a call-to-action at the end of the content',
        'Optimize keyword density for better SEO performance'
      ];

      setAiSuggestions(suggestions.slice(0, 3));

      toast aria-live="polite" aria-atomic="true"({
        title: 'AI Analysis Complete',
        description: 'Content optimization suggestions are available',
      });
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'AI Analysis Failed',
        description: 'Unable to generate AI suggestions',
        variant: 'destructive'
      });
    } finally {
      setIsAiProcessing(false);
    }
  }, [enableAiAssistance, toast aria-live="polite" aria-atomic="true"]);

  const createVersion = useCallback(async (changeDescription: string) => {
    if (!versionHistoryEnabled) return;

    const newVersion: ContentVersion = {
      id: `version-${Date.now()}`,
      version: versions.length + 1,
      content,
      createdAt: new Date(),
      author: 'Current User', // Would be actual user
      changes: changeDescription,
      wordCount,
      characterCount,
      metadata: {
        focusMode: distractionFree,
        pluginsEnabled: Array.from(activePlugins)
      }
    };

    setVersions(prev => [...prev, newVersion]);
    onVersionChange?.(newVersion);
  }, [content, versions.length, versionHistoryEnabled, wordCount, characterCount, distractionFree, activePlugins, onVersionChange]);

  const simulateCollaboration = useCallback(() => {
    // Simulate other users joining the document
    const mockCollaborators: Collaborator[] = [
      {
        id: 'collab-1',
        name: 'Maria Nowak',
        email: 'maria@example.com',
        avatar: '/avatars/maria.jpg',
        role: 'editor',
        isOnline: true,
        lastSeen: new Date()
      }
    ];

    setCollaborators(mockCollaborators);
    onCollaboratorJoin?.(mockCollaborators[0]);
  }, [onCollaboratorJoin]);

  const broadcastContentChange = useCallback((newContent: string) => {
    // In a real implementation, this would send updates to other collaborators
    console.log('Broadcasting content change:', newContent.substring(0, 100) + '...');
  }, []);

  const exportContent = useCallback(async (format: string) => {
    try {
      let blob: Blob;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'html':
          blob = new Blob([content], { type: 'text/html' });
          filename = 'content.html';
          mimeType = 'text/html';
          break;
        case 'markdown':
          // Convert HTML to markdown (simplified)
          const markdown = content
            .replace(/<h([1-6])[^>]*>([^<]+)<\/h\1>/gi, (match, level, text) => {
              return '#'.repeat(parseInt(level)) + ' ' + text + '\n\n';
            })
            .replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1\n\n')
            .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**')
            .replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*');

          blob = new Blob([markdown], { type: 'text/markdown' });
          filename = 'content.md';
          mimeType = 'text/markdown';
          break;
        default:
          blob = new Blob([content], { type: 'text/plain' });
          filename = 'content.txt';
          mimeType = 'text/plain';
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Export Successful',
        description: `Content exported as ${format.toUpperCase()}`,
      });

      setExportDialogOpen(false);
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Export Failed',
        description: 'Unable to export content',
        variant: 'destructive'
      });
    }
  }, [content, toast aria-live="polite" aria-atomic="true"]);

  // Helper functions
  const extractKeywords = (text: string): Record<string, number> => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const keywords: Record<string, number> = {};

    // Common words to ignore
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);

    words.forEach(word => {
      if (!stopWords.has(word) && word.length > 3) {
        keywords[word] = (keywords[word] || 0) + 1;
      }
    });

    // Return top 10 keywords
    return Object.fromEntries(
      Object.entries(keywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    );
  };

  const generateContentSuggestions = (headings: any[], wordCount: number): string[] => {
    const suggestions: string[] = [];

    if (headings.length === 0) {
      suggestions.push('Add headings to improve content structure');
    }
    if (wordCount < 300) {
      suggestions.push('Content is quite short, consider expanding on key points');
    }
    if (wordCount > 2000) {
      suggestions.push('Content is quite long, consider breaking it into smaller sections');
    }

    return suggestions;
  };

  const generateImprovementSuggestions = (readabilityScore: number): string[] => {
    const suggestions: string[] = [];

    if (readabilityScore < 60) {
      suggestions.push('Use shorter sentences for better readability');
      suggestions.push('Break up long paragraphs');
    }
    if (readabilityScore < 80) {
      suggestions.push('Use simpler language where possible');
    }

    return suggestions;
  };

  const generateContentWarnings = (text: string): string[] => {
    const warnings: string[] = [];

    // Check for common issues
    if (text.includes('click here')) {
      warnings.push('Consider replacing "click here" with more descriptive link text');
    }
    if ((text.match(/\b(very|really|quite|rather)\b/gi) || []).length > 5) {
      warnings.push('Reduce use of filler words like "very" and "really"');
    }

    return warnings;
  };

  const applyTemplate = useCallback((template: ContentTemplate) => {
    if (editorRef.current) {
      editorRef.current.setContent(template.content);
      setContent(template.content);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Template applied',
        description: `${template.name} template has been applied.`,
      });
    }
  }, [toast aria-live="polite" aria-atomic="true"]);

  const insertImage = useCallback(() => {
    if (editorRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Here you would upload the file to your storage service
          // For now, we'll use a placeholder
          const imageUrl = URL.createObjectURL(file);
          editorRef.current.insertContent(`<img src="${imageUrl}" alt="${file.name}" style="max-width: 100%; height: auto;" />`);
        }
      };
      input.click();
    }
  }, []);

  const tinymceConfig = {
    height,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
      'template', 'codesample', 'emoticons', 'hr', 'pagebreak', 'nonbreaking',
      'toc', 'imagetools', 'textpattern', 'noneditable', 'visualchars'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'link image media table template codesample | ' +
      'removeformat help | ' +
      (enableAiAssistance ? 'aiassist ' : '') +
      'fullscreen',

    templates: templates.map(t => ({
      title: t.name,
      description: t.description,
      content: t.content,
      url: ''
    })),

    content_style: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        max-width: 100%;
        padding: 20px;
      }
      h1, h2, h3, h4, h5, h6 {
        font-weight: 600;
        margin-top: 1.5em;
        margin-bottom: 0.8em;
        color: #2c1810;
      }
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      p { margin-bottom: 1em; }
      a { color: #8B4513; text-decoration: underline; }
      a:hover { color: #A0522D; }
      blockquote {
        border-left: 4px solid #F5DEB3;
        padding-left: 1em;
        margin: 1.5em 0;
        font-style: italic;
        background-color: #FAFAFA;
        padding: 1em;
        border-radius: 8px;
      }
      ul, ol { margin-bottom: 1em; padding-left: 2em; }
      li { margin-bottom: 0.5em; }
      code {
        background-color: #f4f4f4;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
      }
      pre {
        background-color: #f4f4f4;
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1em 0;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th { background-color: #f8f8f8; font-weight: 600; }
      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1em 0;
      }
      hr {
        border: none;
        border-top: 2px solid #F5DEB3;
        margin: 2em 0;
      }
    `,

    placeholder,
    branding: false,
    statusbar: true,
    elementpath: false,
    resize: false,

    // Custom CSS for the editor
    skin: 'oxide',
    skin_url: '/tinymce/skins/ui/oxide',

    // Language support
    language: language === 'pl' ? 'pl' : 'en',

    // File picker callback
    file_picker_callback: function (callback: any, value: any, meta: any) {
      if (meta.filetype === 'image') {
        insertImage();
      }
    },

    // Content filtering and cleanup
    paste_data_images: true,
    images_upload_handler: async (blobInfo: any, progress: any) => {
      // Here you would upload to your storage service
      // For now, return a placeholder URL
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(blobInfo.blob()));
        }, 1000);
      });
    },

    // Setup callback
    setup: (editor: any) => {
      editor.on('init', () => {
        if (initialContent) {
          editor.setContent(initialContent);
        }
      });

      // Add custom AI assistance button
      if (enableAiAssistance) {
        editor.ui.registry.addButton('aiassist', {
          text: 'AI Assist',
          tooltip: 'AI Content Assistant',
          onAction: () => {
            // Trigger AI assistance
            const selectedText = editor.selection.getContent();
            const context = editor.getContent();
            // This would integrate with your AI service
            console.log('AI assistance triggered for:', { selectedText, context });
          }
        });
      }

      editor.on('change', () => {
        const newContent = editor.getContent();
        handleContentChange(newContent);
      });
    },

    readonly: readOnly
  };

  return (
    <Card className="border-cocoa-200 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Header with tools and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="grid w-full grid-cols-2 bg-cocoa/20">
                <TabsTrigger value="edit" className="data-[state=active]:bg-champagne/20">
                  <Type className="w-4 h-4 mr-2" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-champagne/20">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === 'edit' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(templates[0])}
                  className="text-xs"
                >
                  <Type className="w-3 h-3 mr-1" />
                  Templates
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={insertImage}
                  className="text-xs"
                >
                  <ImageIcon className="w-3 h-3 mr-1" alt="Image" />
                  Image
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Word count and character count */}
            <div className="flex items-center gap-4 text-sm text-cocoa-600">
              <span>{wordCount} words</span>
              <span>{characterCount} chars</span>
            </div>

            {/* Auto-save status */}
            {onAutoSave && (
              <div className="flex items-center gap-2">
                {isAutoSaving ? (
                  <Badge variant="secondary" className="text-xs">
                    Saving...
                  </Badge>
                ) : lastSaved ? (
                  <Badge variant="outline" className="text-xs">
                    Saved {lastSaved.toLocaleTimeString()}
                  </Badge>
                ) : null}
              </div>
            )}

            {/* Manual save button */}
            {onAutoSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoSave}
                disabled={isAutoSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Editor or Preview */}
        {activeTab === 'edit' ? (
          <div className="border border-cocoa-200 rounded-lg overflow-hidden">
            <Editor
              onInit={(evt, editor) => editorRef.current = editor}
              value={content}
              init={tinymceConfig}
            />
          </div>
        ) : (
          <div
            className="border border-cocoa-200 rounded-lg p-6 min-h-[500px] prose prose-cocoa max-w-none"
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-cocoa-400">No content to preview</p>' }}
          />
        )}

        {/* Quick action bar */}
        {activeTab === 'edit' && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-cocoa-200">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editorRef.current?.execCommand('Undo')}
                disabled={readOnly}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editorRef.current?.execCommand('Redo')}
                disabled={readOnly}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            {enableAiAssistance && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-champagne-200 hover:bg-champagne-50"
              >
                <Palette className="w-4 h-4" />
                AI Enhance
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RichTextEditor;