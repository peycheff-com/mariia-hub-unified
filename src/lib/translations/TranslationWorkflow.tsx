import { supabase } from '@/integrations/supabase/client';
import {
  TranslationProject,
  TranslationTask,
  Translation,
  TranslationComment,
  TranslationHistory,
  TranslationWorkflowStep,
  TranslationWorkflow,
  TranslationProgress
} from '@/types/translation';

import { translationMemory } from './TranslationMemory';

interface TranslationTask {
  id: string;
  project_id: string;
  source_text: string;
  context?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'rejected';
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  notes?: string;
  word_count: number;
  character_count: number;
}

interface TranslationProject {
  id: string;
  name: string;
  source_lang: string;
  target_langs: string[];
  status: 'draft' | 'active' | 'review' | 'completed';
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  description?: string;
  progress: number;
}

interface Translation {
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
  time_spent?: number; // in minutes
}

export class TranslationWorkflow {
  /**
   * Create a new translation project
   */
  async createProject(
    name: string,
    sourceLang: string,
    targetLangs: string[],
    createdBy: string,
    metadata: Partial<TranslationProject> = {}
  ): Promise<TranslationProject | null> {
    try {
      const { data, error } = await supabase
        .from('translation_projects')
        .insert({
          name,
          source_lang: sourceLang,
          target_langs: targetLangs,
          created_by: createdBy,
          status: 'draft',
          progress: 0,
          ...metadata
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  /**
   * Add tasks to a project
   */
  async addTasks(
    projectId: string,
    texts: Array<{ text: string; context?: string; category?: string }>,
    priority: TranslationTask['priority'] = 'medium'
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const item of texts) {
      try {
        // Check if task already exists
        const { data: existing } = await supabase
          .from('translation_tasks')
          .select('id')
          .eq('project_id', projectId)
          .eq('source_text', item.text)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        await supabase.from('translation_tasks').insert({
          project_id: projectId,
          source_text: item.text,
          context: item.context,
          category: item.category || 'general',
          priority,
          status: 'pending',
          created_by: 'system',
          word_count: item.text.split(/\s+/).length,
          character_count: item.text.length
        });

        created++;
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }

    // Update project progress
    await this.updateProjectProgress(projectId);

    return { created, skipped };
  }

  /**
   * Get available tasks for a translator
   */
  async getAvailableTasks(
    translatorId: string,
    targetLang: string,
    limit = 10
  ): Promise<TranslationTask[]> {
    try {
      // Get projects that include the target language
      const { data: projects } = await supabase
        .from('translation_projects')
        .select('id')
        .contains('target_langs', [targetLang])
        .eq('status', 'active');

      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map(p => p.id);

      // Get pending tasks
      const { data, error } = await supabase
        .from('translation_tasks')
        .select('*')
        .in('project_id', projectIds)
        .eq('status', 'pending')
        .is('assigned_to', null)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting available tasks:', error);
      return [];
    }
  }

  /**
   * Claim a task for translation
   */
  async claimTask(taskId: string, translatorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('translation_tasks')
        .update({
          assigned_to: translatorId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('status', 'pending')
        .is('assigned_to', null);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error claiming task:', error);
      return false;
    }
  }

  /**
   * Submit translation
   */
  async submitTranslation(
    taskId: string,
    translatorId: string,
    targetText: string,
    notes?: string
  ): Promise<Translation | null> {
    try {
      // Check TM for matches
      const task = await this.getTask(taskId);
      const tmMatches = task
        ? await translationMemory.search(
            task.source_text,
            'en', // This should come from project
            'pl', // This should come from project
            { minScore: 0.9 }
          )
        : [];

      const { data, error } = await supabase
        .from('translations')
        .insert({
          task_id: taskId,
          translator_id: translatorId,
          target_text: targetText,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          notes,
          tm_matches: tmMatches.length
        })
        .select()
        .single();

      if (error) throw error;

      // Update task status
      await supabase
        .from('translation_tasks')
        .update({ status: 'review' })
        .eq('id', taskId);

      // Add to translation memory if no exact match found
      if (task && tmMatches.length === 0) {
        await translationMemory.add(
          task.source_text,
          targetText,
          'en', // From project
          'pl', // From project
          {
            category: task.category,
            context: task.context,
            approved: false // Needs review
          }
        );
      }

      return data;
    } catch (error) {
      console.error('Error submitting translation:', error);
      return null;
    }
  }

  /**
   * Approve translation
   */
  async approveTranslation(
    translationId: string,
    approvedBy: string,
    qualityScore?: number
  ): Promise<boolean> {
    try {
      // Get translation with task details
      const { data: translation } = await supabase
        .from('translations')
        .select(`
          *,
          task:translation_tasks(
            source_text,
            project_id,
            translation_projects!inner(
              source_lang,
              target_langs
            )
          )
        `)
        .eq('id', translationId)
        .single();

      if (!translation) return false;

      // Update translation
      const { error } = await supabase
        .from('translations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approvedBy,
          quality_score: qualityScore
        })
        .eq('id', translationId);

      if (error) throw error;

      // Update task status
      await supabase
        .from('translation_tasks')
        .update({ status: 'completed' })
        .eq('id', translation.task.id);

      // Add to translation memory as approved
      if (translation.task && translation.task.translation_projects) {
        const project = translation.task.translation_projects as any;
        await translationMemory.add(
          translation.task.source_text,
          translation.target_text,
          project.source_lang,
          project.target_langs[0], // Simplified - should handle multiple
          {
            approved: true,
            quality_score: qualityScore,
            category: translation.task.category,
            created_by: approvedBy
          }
        );
      }

      // Update project progress
      await this.updateProjectProgress(translation.task.project_id);

      return true;
    } catch (error) {
      console.error('Error approving translation:', error);
      return false;
    }
  }

  /**
   * Reject translation
   */
  async rejectTranslation(
    translationId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('translations')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', translationId);

      if (error) throw error;

      // Get task to update status
      const { data: translation } = await supabase
        .from('translations')
        .select('task_id')
        .eq('id', translationId)
        .single();

      if (translation) {
        await supabase
          .from('translation_tasks')
          .update({ status: 'pending', assigned_to: null })
          .eq('id', translation.task_id);
      }

      return true;
    } catch (error) {
      console.error('Error rejecting translation:', error);
      return false;
    }
  }

  /**
   * Get translator statistics
   */
  async getTranslatorStats(
    translatorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    tasksCompleted: number;
    wordsTranslated: number;
    averageQuality: number;
    timeSpent: number;
    earnings?: number;
  }> {
    try {
      let query = supabase
        .from('translations')
        .select(`
          *,
          task:translation_tasks(word_count, character_count)
        `)
        .eq('translator_id', translatorId)
        .eq('status', 'approved');

      if (startDate) {
        query = query.gte('approved_at', startDate);
      }

      if (endDate) {
        query = query.lte('approved_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        tasksCompleted: data?.length || 0,
        wordsTranslated: data?.reduce((sum, t) => sum + (t.task?.word_count || 0), 0) || 0,
        averageQuality: data?.reduce((sum, t) => sum + (t.quality_score || 0), 0) / (data?.length || 1) || 0,
        timeSpent: data?.reduce((sum, t) => sum + (t.time_spent || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting translator stats:', error);
      return {
        tasksCompleted: 0,
        wordsTranslated: 0,
        averageQuality: 0,
        timeSpent: 0
      };
    }
  }

  /**
   * Get project progress
   */
  private async updateProjectProgress(projectId: string): Promise<void> {
    try {
      // Get task counts
      const { data: tasks } = await supabase
        .from('translation_tasks')
        .select('status')
        .eq('project_id', projectId);

      if (!tasks) return;

      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Update project
      await supabase
        .from('translation_projects')
        .update({
          progress,
          updated_at: new Date().toISOString(),
          status: progress === 100 ? 'completed' : 'active'
        })
        .eq('id', projectId);
    } catch (error) {
      console.error('Error updating project progress:', error);
    }
  }

  /**
   * Get single task
   */
  private async getTask(taskId: string): Promise<TranslationTask | null> {
    try {
      const { data, error } = await supabase
        .from('translation_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Export project translations
   */
  async exportProject(
    projectId: string,
    format: 'json' | 'xliff' | 'csv' = 'json'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('translation_tasks')
        .select(`
          *,
          translations!left(
            target_text,
            status,
            translator_id,
            approved_by
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);

        case 'csv':
          const headers = ['source_text', 'target_text', 'status', 'category', 'context'];
          const rows = data?.map(task => [
            task.source_text,
            task.translations?.[0]?.target_text || '',
            task.translations?.[0]?.status || 'pending',
            task.category,
            task.context || ''
          ]) || [];

          return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        case 'xliff':
          // Simplified XLIFF format
          let xliff = '<?xml version="1.0" encoding="UTF-8"?>\n';
          xliff += '<xliff version="1.2">\n';
          xliff += '  <file source-language="en" target-language="pl">\n';
          xliff += '    <body>\n';

          data?.forEach(task => {
            xliff += `      <trans-unit id="${task.id}">\n`;
            xliff += `        <source>${task.source_text}</source>\n`;
            if (task.translations?.[0]) {
              xliff += `        <target>${task.translations[0].target_text}</target>\n`;
            }
            xliff += '      </trans-unit>\n';
          });

          xliff += '    </body>\n';
          xliff += '  </file>\n';
          xliff += '</xliff>';

          return xliff;

        default:
          return null;
      }
    } catch (error) {
      console.error('Error exporting project:', error);
      return null;
    }
  }
}

// Create singleton instance
export const translationWorkflow = new TranslationWorkflow();