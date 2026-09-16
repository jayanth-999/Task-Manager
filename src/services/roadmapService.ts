import { supabase } from './supabaseClient';
import type { Roadmap, RoadmapPhase, RoadmapMilestone } from '../types';

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
  static calculateRoadmapProgress(roadmap: Roadmap): number {
    if (!roadmap.phases || roadmap.phases.length === 0) return 0;
    let totalMilestones = 0;
    let completedMilestones = 0;

    roadmap.phases.forEach(p => {
      p.milestones?.forEach(m => {
        totalMilestones++;
        if (m.status === 'completed') completedMilestones++;
      });
    });

    if (totalMilestones === 0) return 0;
    return Math.round((completedMilestones / totalMilestones) * 100);
  }

  static async getRoadmaps(userId: string): Promise<Roadmap[]> {
    if (userId === 'guest-local-user') {
      const raw = localStorage.getItem('apex_roadmaps');
      if (!raw) {
        // Initialize default 4-Month DevOps + AI Career Roadmap
        const defaultRoadmap = await this.createRoadmapFromTemplate(userId, 'tpl-devops-ai-4m');
        return [defaultRoadmap];
      }
      return JSON.parse(raw);
    }

    const { data, error } = await supabase
      .from('roadmaps')
      .select('*, roadmap_phases(*, roadmap_milestones(*))')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const defaultRoadmap = await this.createRoadmapFromTemplate(userId, 'tpl-devops-ai-4m');
      return [defaultRoadmap];
    }
    return data;
  }

  static async getActiveMilestone(userId: string): Promise<{
    roadmap: Roadmap;
    phase: RoadmapPhase;
    milestone: RoadmapMilestone;
  } | null> {
    const roadmaps = await this.getRoadmaps(userId);
    const primary = roadmaps.find(r => r.is_primary && r.status === 'active') || roadmaps[0];
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

    roadmaps.forEach(r => {
      r.phases?.forEach(p => {
        p.milestones?.forEach(m => {
          if (m.id === milestoneId) {
            m.status = 'completed';
            m.completion_percentage = 100;
            targetRoadmap = r;
          }
        });
      });
    });

    if (targetRoadmap && userId === 'guest-local-user') {
      localStorage.setItem('apex_roadmaps', JSON.stringify(roadmaps));
    }
    return targetRoadmap;
  }

  static async createRoadmapFromTemplate(userId: string, templateId: string, customTitle?: string): Promise<Roadmap> {
    const tpl = BUILTIN_TEMPLATES.find(t => t.id === templateId) || BUILTIN_TEMPLATES[0];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + tpl.duration_months);

    const roadmapId = crypto.randomUUID();

    const phases: RoadmapPhase[] = tpl.structure.phases.map((p, pIdx) => {
      const phaseId = crypto.randomUUID();
      return {
        id: phaseId,
        roadmap_id: roadmapId,
        user_id: userId,
        title: p.title,
        phase_order: p.phase_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        milestones: p.milestones.map((m, mIdx) => ({
          id: crypto.randomUUID(),
          phase_id: phaseId,
          user_id: userId,
          title: m.title,
          status: pIdx === 0 && mIdx === 0 ? 'in_progress' : 'pending',
          completion_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      };
    });

    const newRoadmap: Roadmap = {
      id: roadmapId,
      user_id: userId,
      template_id: tpl.id,
      template_version: 1,
      title: customTitle || tpl.title,
      description: tpl.description,
      category: tpl.category,
      duration_months: tpl.duration_months,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
      is_primary: true,
      color_code: '#3B82F6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phases,
    };

    if (userId === 'guest-local-user') {
      const raw = localStorage.getItem('apex_roadmaps');
      const existing: Roadmap[] = raw ? JSON.parse(raw) : [];
      existing.unshift(newRoadmap);
      localStorage.setItem('apex_roadmaps', JSON.stringify(existing));
      return newRoadmap;
    }

    await supabase.from('roadmaps').insert(newRoadmap);
    return newRoadmap;
  }
}
