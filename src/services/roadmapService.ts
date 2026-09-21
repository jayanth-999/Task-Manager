import { SyncEngine } from './syncEngine';
import { supabase, isCloudConfigured } from './supabaseClient';
import type { Task, Roadmap, RoadmapPhase, RoadmapMilestone } from '../types';
import { throwIfSupabaseError } from './supabaseResult';
import { getLocalDateString } from './dateUtils';
import { createId } from './idUtils';

export interface RoadmapImport {
  title: string;
  description?: string;
  category?: string;
  duration_months: number;
  is_primary?: boolean;
  phases: Array<{
    title: string;
    description?: string;
    milestones: Array<{ title: string; description?: string; target_day?: number }>;
  }>;
}

export const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-devops-ai-4m',
    title: 'DevOps + AI Career Roadmap',
    category: 'Career',
    duration_months: 4,
    description: 'Master core DevOps infrastructure & AI Agents / RAG / MCPs for job readiness in 4 months.',
    structure: {
      phases: [
        {
          title: 'Phase 1 — Linux & Python Fundamentals',
          phase_order: 1,
          milestones: [
            { title: 'Linux Core Commands, Process Management & Shell Scripting', target_day: 15 },
            { title: 'Python Core & Refactoring (Native No-Copilot Exercises)', target_day: 30 },
          ],
        },
        {
          title: 'Phase 2 — Containerization & Kubernetes Orchestration',
          phase_order: 2,
          milestones: [
            { title: 'Docker Containerization & Multi-Stage Production Builds', target_day: 45 },
            { title: 'Kubernetes Pods, Services, Ingress & Helm Deployments', target_day: 60 },
          ],
        },
        {
          title: 'Phase 3 — Infrastructure as Code & Cloud CI/CD',
          phase_order: 3,
          milestones: [
            { title: 'Terraform Modules, State Management & Cloud Provisioning', target_day: 75 },
            { title: 'CI/CD Automation with GitHub Actions & Quality Gates', target_day: 90 },
          ],
        },
        {
          title: 'Phase 4 — AI Agents, RAG & MCP Architecture',
          phase_order: 4,
          milestones: [
            { title: 'RAG Architecture, Chunking & Vector Database Embeddings', target_day: 105 },
            { title: 'AI Agent Systems, Tool Calling & Model Context Protocol (MCP)', target_day: 120 },
          ],
        },
      ],
    },
  },
  {
    id: 'tpl-cloud-k8s-6m',
    title: 'Cloud & Kubernetes Architecture',
    category: 'Cloud Engineering',
    duration_months: 6,
    description: 'Deep dive into Kubernetes internals, CKA prep, and Cloud Native Security.',
    structure: {
      phases: [
        {
          title: 'Phase 1 — CKA Fundamentals & Networking',
          phase_order: 1,
          milestones: [{ title: 'Kubernetes Control Plane & CNI Networking', target_day: 30 }],
        },
        {
          title: 'Phase 2 — Advanced Storage & Security Policies',
          phase_order: 2,
          milestones: [{ title: 'CSI Storage, Network Policies & RBAC', target_day: 60 }],
        },
      ],
    },
  },
];

export class RoadmapService {
  static calculateRoadmapProgress(roadmap: Roadmap): { percentage: number; totalMilestones: number; completedMilestones: number } {
    if (!roadmap.phases || roadmap.phases.length === 0) {
      return { percentage: 0, totalMilestones: 0, completedMilestones: 0 };
    }
    let totalMilestones = 0;
    let completedMilestones = 0;

    roadmap.phases.forEach(p => {
      p.milestones?.forEach(m => {
        totalMilestones++;
        if (m.status === 'completed') completedMilestones++;
      });
    });

    if (totalMilestones === 0) {
      return { percentage: 0, totalMilestones: 0, completedMilestones: 0 };
    }
    return {
      percentage: Math.round((completedMilestones / totalMilestones) * 100),
      totalMilestones,
      completedMilestones,
    };
  }

  static async getRoadmaps(userId: string): Promise<Roadmap[]> {
    let roadmaps: Roadmap[] = [];

    if (!isCloudConfigured || userId === 'guest-local-user') {
      roadmaps = await SyncEngine.getLocalItems<Roadmap>('roadmaps', userId);
    } else {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*, roadmap_phases(*, roadmap_milestones(*))')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        roadmaps = await SyncEngine.getLocalItems<Roadmap>('roadmaps', userId);
      } else {
        roadmaps = data ?? [];
        await SyncEngine.bulkSaveLocalItemsWithoutQueue('roadmaps', roadmaps);
      }
    }

    return roadmaps;
  }

  static async getActiveMilestone(userId: string): Promise<{
    roadmap: Roadmap;
    phase: RoadmapPhase;
    milestone: RoadmapMilestone;
  } | null> {
    const roadmaps = await this.getRoadmaps(userId);
    // Only select roadmaps with status === 'active'
    const activeRoadmaps = roadmaps.filter(r => r.status === 'active');
    const primary = activeRoadmaps.find(r => r.is_primary) || activeRoadmaps[0];
    if (!primary || !primary.phases) return null;

    for (const phase of primary.phases) {
      if (phase.milestones) {
        for (const milestone of phase.milestones) {
          if (milestone.status !== 'completed') {
            return { roadmap: primary, phase, milestone };
          }
        }
      }
    }
    return null;
  }

  static async completeMilestone(userId: string, milestoneId: string): Promise<Roadmap | null> {
    const roadmaps = await this.getRoadmaps(userId);
    let targetRoadmap: Roadmap | null = null;

    for (const r of roadmaps) {
      for (const p of r.phases || []) {
        for (const m of p.milestones || []) {
          if (m.id === milestoneId) {
            m.status = 'completed';
            m.completion_percentage = 100;
            targetRoadmap = r;
          }
        }
      }
    }

    if (targetRoadmap) {
      const updatedRoadmap: Roadmap = targetRoadmap;
      updatedRoadmap.updated_at = new Date().toISOString();
      await SyncEngine.saveLocalItem('roadmaps', updatedRoadmap, 'UPDATE');

      if (isCloudConfigured && userId !== 'guest-local-user') {
        try {
          const result = await supabase
            .from('roadmap_milestones')
            .update({ status: 'completed', completion_percentage: 100 })
            .eq('id', milestoneId);
          throwIfSupabaseError(result);
        } catch (err) {
          console.warn('Failed cloud sync for milestone completion:', err);
        }
      }
    }

    return targetRoadmap;
  }

  /** Hide a roadmap while keeping its completed history recoverable in storage. */
  static async deleteRoadmap(userId: string, roadmapId: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    const roadmap = await SyncEngine.getLocalItem<Roadmap>('roadmaps', roadmapId);
    if (roadmap?.user_id === userId) {
      roadmap.deleted_at = deletedAt;
      roadmap.updated_at = deletedAt;
      await SyncEngine.saveLocalItem('roadmaps', roadmap);
    }

    // Preserve a planned task, but remove the reference to a roadmap that no longer exists.
    if (roadmap) {
      const tasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      for (const task of tasks) {
        const belongsToRoadmap = roadmap.phases?.some(phase => phase.milestones?.some(milestone => milestone.id === task.milestone_id));
        if (belongsToRoadmap) {
          task.milestone_id = undefined;
          task.updated_at = new Date().toISOString();
          await SyncEngine.saveLocalItem('tasks', task);
        }
      }
    }

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const { data, error } = await supabase
          .from('roadmaps')
          .update({ deleted_at: deletedAt, updated_at: deletedAt })
          .eq('id', roadmapId)
          .eq('user_id', userId)
          .select('id, deleted_at')
          .maybeSingle();
        throwIfSupabaseError({ error });
        if (!data?.deleted_at) throw new Error(`Roadmap ${roadmapId} was not deleted in Supabase`);
      } catch (err) {
        console.warn('Queued roadmap deletion for sync:', err);
      }
    }
  }

  static async createRoadmapFromTemplate(userId: string, templateId: string, customTitle?: string): Promise<Roadmap> {
    const tpl = BUILTIN_TEMPLATES.find(t => t.id === templateId) || BUILTIN_TEMPLATES[0];
    return this.createRoadmapFromData(userId, {
      title: customTitle || tpl.title,
      description: tpl.description,
      category: tpl.category,
      duration_months: tpl.duration_months,
      phases: tpl.structure.phases,
    }, tpl.id);
  }

  /** Creates a roadmap from the portable JSON format exposed in the UI. */
  static async createRoadmapFromData(userId: string, input: RoadmapImport, templateId?: string): Promise<Roadmap> {
    if (!input.title?.trim() || !Number.isFinite(input.duration_months) || input.duration_months < 1 || !input.phases?.length) {
      throw new Error('A roadmap needs a title, a duration of at least one month, and one or more phases.');
    }
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + input.duration_months);

    const roadmapId = createId();

    const phases: RoadmapPhase[] = input.phases.map((p, pIdx) => {
      const phaseId = createId();
      return {
        id: phaseId,
        roadmap_id: roadmapId,
        user_id: userId,
        title: p.title,
        description: p.description,
        phase_order: pIdx + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        milestones: p.milestones.map((m, mIdx) => ({
          id: createId(),
          phase_id: phaseId,
          user_id: userId,
          title: m.title,
          description: m.description,
          target_date: typeof m.target_day === 'number'
            ? getLocalDateString(new Date(startDate.getTime() + Math.max(0, m.target_day - 1) * 86400000))
            : undefined,
          status: pIdx === 0 && mIdx === 0 ? 'in_progress' : 'pending',
          completion_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      };
    });

    // Demote any existing primary roadmaps for this user
    const existingRoadmaps = await this.getRoadmaps(userId);
    for (const r of existingRoadmaps) {
      if (r.is_primary) {
        r.is_primary = false;
        r.updated_at = new Date().toISOString();
        await SyncEngine.saveLocalItem('roadmaps', r, 'UPDATE');
        if (isCloudConfigured && userId !== 'guest-local-user') {
          try {
            const res = await supabase.from('roadmaps').update({ is_primary: false, updated_at: r.updated_at }).eq('id', r.id).eq('user_id', userId);
            throwIfSupabaseError(res);
          } catch (e) {
            console.warn('Failed to demote old primary roadmap in cloud:', e);
          }
        }
      }
    }

    const newRoadmap: Roadmap = {
      id: roadmapId,
      user_id: userId,
      template_id: undefined, // Leave undefined so DB UUID column does not fail on string IDs
      template_key: templateId,
      template_version: 1,
      title: input.title.trim(),
      description: input.description,
      category: input.category || 'Personal roadmap',
      duration_months: input.duration_months,
      start_date: getLocalDateString(startDate),
      end_date: getLocalDateString(endDate),
      status: 'active',
      is_primary: true,
      color_code: '#3B82F6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phases,
    };

    await SyncEngine.saveLocalItem('roadmaps', newRoadmap, 'INSERT');

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        // Save roadmap record
        const { phases: _, ...roadmapRecord } = newRoadmap;
        const resRoadmap = await supabase.from('roadmaps').insert(roadmapRecord);
        throwIfSupabaseError(resRoadmap);
        for (const phase of phases) {
          const { milestones: phaseMilestones, ...phaseRecord } = phase;
          const resPhase = await supabase.from('roadmap_phases').insert(phaseRecord);
          throwIfSupabaseError(resPhase);
          if (phaseMilestones && phaseMilestones.length > 0) {
            const resMilestones = await supabase.from('roadmap_milestones').insert(phaseMilestones);
            throwIfSupabaseError(resMilestones);
          }
        }
      } catch (err) {
        console.warn('Failed cloud save for roadmap, cached locally:', err);
      }
    }

    return newRoadmap;
  }

  static parseRoadmapImport(json: string): RoadmapImport {
    let value: unknown;
    try {
      value = JSON.parse(json);
    } catch {
      throw new Error('The file is not valid JSON. Download the template and keep its structure.');
    }
    const data = value as Partial<RoadmapImport>;
    if (!data || typeof data.title !== 'string' || !Array.isArray(data.phases)) {
      throw new Error('The roadmap must include a title and a phases list.');
    }
    const duration = Number(data.duration_months);
    if (!Number.isInteger(duration) || duration < 1 || duration > 120) {
      throw new Error('duration_months must be a whole number between 1 and 120.');
    }
    const phases = data.phases.map((phase, index) => {
      if (!phase || typeof phase.title !== 'string' || !Array.isArray(phase.milestones) || phase.milestones.length === 0) {
        throw new Error(`Phase ${index + 1} needs a title and at least one milestone.`);
      }
      return {
        title: phase.title,
        description: phase.description,
        milestones: phase.milestones.map((milestone, milestoneIndex) => {
          if (!milestone || typeof milestone.title !== 'string' || !milestone.title.trim()) {
            throw new Error(`Milestone ${milestoneIndex + 1} in phase ${index + 1} needs a title.`);
          }
          const targetDay = milestone.target_day === undefined ? undefined : Number(milestone.target_day);
          if (targetDay !== undefined && (!Number.isInteger(targetDay) || targetDay < 1)) {
            throw new Error('target_day must be a positive whole number.');
          }
          return { title: milestone.title.trim(), description: milestone.description, target_day: targetDay };
        }),
      };
    });
    return { title: data.title.trim(), description: data.description, category: data.category, duration_months: duration, phases };
  }

  static async linkMilestoneToDailyTask(userId: string, milestoneId: string, dueDate: string): Promise<Task | null> {
    const roadmaps = await this.getRoadmaps(userId);
    let targetMilestone: RoadmapMilestone | null = null;
    let targetRoadmap: Roadmap | null = null;

    for (const r of roadmaps) {
      for (const p of r.phases || []) {
        for (const m of p.milestones || []) {
          if (m.id === milestoneId) {
            targetMilestone = m;
            targetRoadmap = r;
            break;
          }
        }
      }
    }

    if (!targetMilestone) return null;

    // “Add to today” is safe to click repeatedly; it must not create duplicate work.
    const existingTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
    const existing = existingTasks.find(task => task.milestone_id === milestoneId && task.due_date === dueDate && !task.deleted_at);
    if (existing) return existing;

    const newTask: Task = {
      id: createId(),
      user_id: userId,
      title: `🎯 ${targetMilestone.title}`,
      description: `Roadmap Target from "${targetRoadmap?.title || 'Career Goal'}"`,
      milestone_id: milestoneId,
      due_date: dueDate,
      status: 'todo',
      priority: 'high',
      category: 'learning',
      scheduled_start: '17:00',
      scheduled_end: '18:00',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await SyncEngine.saveLocalItem('tasks', newTask);

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const res = await supabase.from('tasks').insert(newTask);
        throwIfSupabaseError(res);
      } catch (err) {
        console.warn('Queued roadmap milestone task sync:', err);
      }
    }

    return newTask;
  }
}
