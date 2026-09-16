import { supabase } from './supabaseClient';
import { SyncEngine } from './syncEngine';
import { RoadmapService } from './roadmapService';
import type { Task, Priority, TaskStatus } from '../types';

export const DEFAULT_DAILY_ROUTINE: Array<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>> = [
  {
    title: '🌅 Wake Up, Hydration & Pre-Workout Energizing Snack',
    description: '1 Banana + 5 Almonds or warm lemon honey water for morning energy.',
    status: 'todo',
    priority: 'medium',
    due_time: '07:00',
    scheduled_start: '07:00',
    scheduled_end: '07:30',
    category: 'routine',
    is_recurring: true,
  },
  {
    title: '🏋️‍♂️ Morning Workout (Home Bodyweight / Gym Routine)',
    description: 'Home: Push-ups, Squats, Plank & Core | Gym: Bench, Cable Pulldown, Shoulder Press.',
    status: 'todo',
    priority: 'high',
    due_time: '07:30',
    scheduled_start: '07:30',
    scheduled_end: '08:30',
    category: 'fitness',
    is_recurring: true,
  },
  {
    title: '🍳 Post-Workout High-Protein Breakfast & Recovery',
    description: '3 Boiled eggs or 100g sautéed paneer/tofu with sprouts or oats for muscle recovery.',
    status: 'todo',
    priority: 'high',
    due_time: '08:30',
    scheduled_start: '08:30',
    scheduled_end: '09:00',
    category: 'routine',
    is_recurring: true,
  },
  {
    title: '📈 Morning Investment & Market Trends Study (10–15 Mins)',
    description: 'Review top market news headlines, macro indicators, ETF/SIP tracking, and tech trends.',
    status: 'todo',
    priority: 'medium',
    due_time: '09:00',
    scheduled_start: '09:00',
    scheduled_end: '09:15',
    category: 'learning',
    is_recurring: true,
  },
  {
    title: '🥗 Cooking & Meal Preparation (Lunch & Pre-Work Food)',
    description: 'Cook nutritious lunch & pre-work meal (e.g., Quick One-Pot Pasta or Paneer Stir-Fry).',
    status: 'todo',
    priority: 'high',
    due_time: '10:00',
    scheduled_start: '10:00',
    scheduled_end: '12:30',
    category: 'cooking',
    is_recurring: true,
  },
  {
    title: '🎮 Leisure, Rest & Personal Recharge Time',
    description: 'Relaxation, gaming, reading, or hobby time before getting ready for the office.',
    status: 'todo',
    priority: 'low',
    due_time: '12:30',
    scheduled_start: '12:30',
    scheduled_end: '13:30',
    category: 'leisure',
    is_recurring: true,
  },
  {
    title: '🚗 Commute to Office Buffer',
    description: 'Travel to office, listen to tech podcasts or market updates.',
    status: 'todo',
    priority: 'medium',
    due_time: '13:30',
    scheduled_start: '13:30',
    scheduled_end: '14:00',
    category: 'work',
    is_recurring: true,
  },
  {
    title: '🏢 Office Work Shift (2:00 PM – 11:00 PM)',
    description: 'Primary engineering work tasks, sprint deliverables, and team collaboration.',
    status: 'todo',
    priority: 'critical',
    due_time: '14:00',
    scheduled_start: '14:00',
    scheduled_end: '23:00',
    category: 'work',
    is_recurring: true,
  },
  {
    title: '🤖 1-Hour Tech Learning: AI Agents, RAG & MCP (30 Mins)',
    description: 'Dedicated 30 mins inside shift: AI Agents, RAG chunking & embeddings, System Design & MCPs.',
    status: 'todo',
    priority: 'critical',
    due_time: '17:00',
    scheduled_start: '17:00',
    scheduled_end: '17:30',
    category: 'learning',
    is_recurring: true,
  },
  {
    title: '⚙️ 1-Hour Tech Learning: DevOps & Pure Python - No Copilot (30 Mins)',
    description: 'Dedicated 30 mins inside shift: K8s/Docker/Linux/Terraform + native Python coding practice without Copilot.',
    status: 'todo',
    priority: 'critical',
    due_time: '17:30',
    scheduled_start: '17:30',
    scheduled_end: '18:00',
    category: 'learning',
    is_recurring: true,
  },
  {
    title: '🛒 Commute Home & Day-Before Grocery Check for Tomorrow',
    description: 'Return home and verify ingredients for tomorrow’s planned recipes.',
    status: 'todo',
    priority: 'medium',
    due_time: '23:00',
    scheduled_start: '23:00',
    scheduled_end: '23:30',
    category: 'errands',
    is_recurring: true,
  },
  {
    title: '🛋️ Evening Wind-Down & Relax',
    description: 'Decompress after work shift, light reading, prepare for rest.',
    status: 'todo',
    priority: 'low',
    due_time: '23:30',
    scheduled_start: '23:30',
    scheduled_end: '00:00',
    category: 'leisure',
    is_recurring: true,
  },
  {
    title: '😴 Sleeping Hours (7 Hours Rest)',
    description: 'Deep restorative sleep from midnight to 7:00 AM.',
    status: 'todo',
    priority: 'high',
    due_time: '00:00',
    scheduled_start: '00:00',
    scheduled_end: '07:00',
    category: 'routine',
    is_recurring: true,
  }
];

export class TaskService {
  // Fetch tasks for a given date; if none exist, initialize the default daily routine and sync active roadmap
  static async getTasks(userId: string, targetDate?: string): Promise<Task[]> {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    // Check active roadmap milestone
    const activeMilestoneInfo = await RoadmapService.getActiveMilestone(userId);

    if (userId === 'guest-local-user') {
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      const filtered = localTasks.filter(t => t.due_date === dateStr);

      if (filtered.length === 0) {
        // Initialize default daily routine for this date
        const initialTasks: Task[] = DEFAULT_DAILY_ROUTINE.map((item, index) => {
          let title = item.title;
          let milestoneId: string | undefined = undefined;

          // Inject active roadmap milestone into today's learning task!
          if (item.category === 'learning' && activeMilestoneInfo && index === 8) {
            title = `🎯 Roadmap Milestone: ${activeMilestoneInfo.milestone.title}`;
            milestoneId = activeMilestoneInfo.milestone.id;
          }

          return {
            ...item,
            id: `routine-${dateStr}-${index}`,
            user_id: userId,
            title,
            milestone_id: milestoneId,
            due_date: dateStr,
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        for (const task of initialTasks) {
          await SyncEngine.saveLocalItem('tasks', task);
        }
        return initialTasks;
      }
      return filtered;
    }

    // Cloud query
    const { data, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*)')
      .eq('user_id', userId)
      .eq('due_date', dateStr)
      .is('deleted_at', null)
      .order('scheduled_start', { ascending: true, nullsFirst: false });

    if (error || !data || data.length === 0) {
      const initialTasks: Task[] = DEFAULT_DAILY_ROUTINE.map((item, index) => {
        let title = item.title;
        let milestoneId: string | undefined = undefined;

        if (item.category === 'learning' && activeMilestoneInfo && index === 8) {
          title = `🎯 Roadmap Milestone: ${activeMilestoneInfo.milestone.title}`;
          milestoneId = activeMilestoneInfo.milestone.id;
        }

        return {
          ...item,
          id: crypto.randomUUID(),
          user_id: userId,
          title,
          milestone_id: milestoneId,
          due_date: dateStr,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      try {
        await supabase.from('tasks').upsert(initialTasks);
        return initialTasks;
      } catch {
        return initialTasks;
      }
    }

    return data;
  }

  // Auto-rollover uncompleted tasks from past dates to targetDate ("Move Right")
  static async rolloverIncompleteTasks(userId: string, targetDate: string): Promise<Task[]> {
    if (userId === 'guest-local-user') {
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      const overdueUnfinished = localTasks.filter(
        t => t.due_date && t.due_date < targetDate && t.status !== 'completed' && !t.deleted_at
      );

      const rolledOver: Task[] = [];
      for (const t of overdueUnfinished) {
        t.source_date = t.due_date;
        t.due_date = targetDate;
        t.is_rolled_over = true;
        t.updated_at = new Date().toISOString();
        await SyncEngine.saveLocalItem('tasks', t);
        rolledOver.push(t);
      }
      return rolledOver;
    }

    // Cloud query
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .lt('due_date', targetDate)
      .neq('status', 'completed')
      .is('deleted_at', null);

    if (data && data.length > 0) {
      const updates = data.map(t => ({
        ...t,
        source_date: t.due_date,
        due_date: targetDate,
        is_rolled_over: true,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('tasks').upsert(updates);
      return updates;
    }
    return [];
  }

  // Move a single task to the next day ("Move Right" button)
  static async moveTaskToNextDay(userId: string, taskId: string): Promise<Task | null> {
    if (userId === 'guest-local-user') {
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      const target = localTasks.find(t => t.id === taskId);
      if (target && target.due_date) {
        const d = new Date(target.due_date);
        d.setDate(d.getDate() + 1);
        target.source_date = target.due_date;
        target.due_date = d.toISOString().split('T')[0];
        target.is_rolled_over = true;
        target.updated_at = new Date().toISOString();
        await SyncEngine.saveLocalItem('tasks', target);
        return target;
      }
      return null;
    }

    const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
    if (task && task.due_date) {
      const d = new Date(task.due_date);
      d.setDate(d.getDate() + 1);
      const nextDate = d.toISOString().split('T')[0];

      const { data: updated } = await supabase
        .from('tasks')
        .update({
          source_date: task.due_date,
          due_date: nextDate,
          is_rolled_over: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();
      return updated;
    }
    return null;
  }

  // Create a new custom task
  static async createTask(userId: string, taskPartial: Partial<Task>): Promise<Task> {
    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: taskPartial.title || 'Untitled Task',
      description: taskPartial.description || '',
      status: taskPartial.status || 'todo',
      priority: taskPartial.priority || 'medium',
      due_date: taskPartial.due_date || new Date().toISOString().split('T')[0],
      due_time: taskPartial.due_time,
      scheduled_start: taskPartial.scheduled_start,
      scheduled_end: taskPartial.scheduled_end,
      category: taskPartial.category || 'general',
      estimated_minutes: taskPartial.estimated_minutes || 30,
      location: taskPartial.location,
      milestone_id: taskPartial.milestone_id,
      project_id: taskPartial.project_id,
      is_recurring: taskPartial.is_recurring || false,
      recurrence_rule: taskPartial.recurrence_rule,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (userId === 'guest-local-user') {
      await SyncEngine.saveLocalItem('tasks', newTask);
      return newTask;
    }

    const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
    if (error) {
      await SyncEngine.saveLocalItem('tasks', newTask);
      return newTask;
    }
    return data;
  }

  // Update existing task (custom times, title, priority, etc.)
  static async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const updatedAt = new Date().toISOString();
    if (userId === 'guest-local-user') {
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      const target = localTasks.find(t => t.id === taskId);
      if (target) {
        Object.assign(target, updates, { updated_at: updatedAt });
        await SyncEngine.saveLocalItem('tasks', target);
        return target;
      }
      return null;
    }

    const { data } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: updatedAt })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    return data;
  }

  // Reset daily routine tasks for the selected date
  static async resetDailyRoutine(userId: string, targetDate: string): Promise<Task[]> {
    if (userId === 'guest-local-user') {
      const freshRoutine: Task[] = DEFAULT_DAILY_ROUTINE.map((item, index) => ({
        ...item,
        id: `routine-${targetDate}-${index}-${Date.now()}`,
        user_id: userId,
        due_date: targetDate,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      for (const t of freshRoutine) {
        await SyncEngine.saveLocalItem('tasks', t);
      }
      return freshRoutine;
    }

    await supabase.from('tasks').delete().eq('user_id', userId).eq('due_date', targetDate);
    return this.getTasks(userId, targetDate);
  }

  // Toggle Task Completion (Strike-through effect) and sync with Roadmap milestone if linked
  static async toggleTaskCompletion(userId: string, taskId: string, currentStatus: TaskStatus): Promise<TaskStatus> {
    const newStatus: TaskStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : undefined;

    if (userId === 'guest-local-user') {
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      const target = localTasks.find(t => t.id === taskId);
      if (target) {
        target.status = newStatus;
        target.completed_at = completedAt;
        target.updated_at = new Date().toISOString();
        await SyncEngine.saveLocalItem('tasks', target);

        // If this task was linked to a roadmap milestone and marked completed, roll up milestone!
        if (target.milestone_id && newStatus === 'completed') {
          await RoadmapService.completeMilestone(userId, target.milestone_id);
        }
      }
      return newStatus;
    }

    const { data: updatedTask } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updatedTask && updatedTask.milestone_id && newStatus === 'completed') {
      await RoadmapService.completeMilestone(userId, updatedTask.milestone_id);
    }

    return newStatus;
  }

  // Soft Delete Task
  static async deleteTask(userId: string, taskId: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    if (userId === 'guest-local-user') {
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      const target = localTasks.find(t => t.id === taskId);
      if (target) {
        target.deleted_at = deletedAt;
        await SyncEngine.saveLocalItem('tasks', target);
      }
      return;
    }

    await supabase.from('tasks').update({ deleted_at: deletedAt }).eq('id', taskId).eq('user_id', userId);
  }

  // Natural Language Parser for Quick Capture
  static parseNaturalLanguageInput(input: string): { title: string; due_date?: string; due_time?: string; priority?: Priority; category?: any } {
    let title = input;
    let due_date: string | undefined = undefined;
    let due_time: string | undefined = undefined;
    let priority: Priority = 'medium';
    let category = 'general';

    const lower = input.toLowerCase();
    const today = new Date();

    if (lower.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      due_date = tomorrow.toISOString().split('T')[0];
      title = title.replace(/tomorrow/i, '').trim();
    } else if (lower.includes('today')) {
      due_date = today.toISOString().split('T')[0];
      title = title.replace(/today/i, '').trim();
    }

    // Time parsing (e.g. 6 PM or 18:00)
    const timeMatch = lower.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3];

      if (ampm && ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
      if (ampm && ampm.toLowerCase() === 'am' && hours === 12) hours = 0;

      due_time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      title = title.replace(timeMatch[0], '').trim();
    }

    if (lower.includes('urgent') || lower.includes('critical')) {
      priority = 'critical';
      title = title.replace(/urgent|critical/gi, '').trim();
    } else if (lower.includes('high priority')) {
      priority = 'high';
      title = title.replace(/high priority/gi, '').trim();
    }

    if (lower.includes('workout') || lower.includes('gym')) category = 'fitness';
    else if (lower.includes('learn') || lower.includes('study') || lower.includes('python') || lower.includes('devops')) category = 'learning';
    else if (lower.includes('cook') || lower.includes('recipe') || lower.includes('meal')) category = 'cooking';
    else if (lower.includes('work') || lower.includes('office')) category = 'work';

    return { title, due_date, due_time, priority, category };
  }
}
