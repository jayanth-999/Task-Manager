import { supabase, isCloudConfigured } from './supabaseClient';
import { SyncEngine } from './syncEngine';
import { RoadmapService } from './roadmapService';
import { calculateActiveStreak, dateKey, addLocalDays, parseLocalDate, getLocalDateString } from './dateUtils';
import { getPreferences } from './userPreferences';
import { throwIfSupabaseError } from './supabaseResult';
import type { Task, Priority, TaskStatus } from '../types';

export function formatTimeLabel(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${ampm}`;
}

export function isDateMatchingRecurrence(
  dateStr: string,
  startDateStr: string,
  recurrenceRule?: string
): boolean {
  if (dateStr < startDateStr) return false;
  if (!recurrenceRule || recurrenceRule === 'FREQ=DAILY') return true;

  const targetDate = parseLocalDate(dateStr);
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  if (recurrenceRule.includes('BYDAY=')) {
    const byDayPart = recurrenceRule.split('BYDAY=')[1]?.split(';')[0] || '';
    const dayCodes = byDayPart.split(',').map(d => d.trim().toUpperCase());
    const dayMap: Record<string, number> = {
      SU: 0,
      MO: 1,
      TU: 2,
      WE: 3,
      TH: 4,
      FR: 5,
      SA: 6,
    };
    const matchedDays = dayCodes.map(c => dayMap[c]).filter(d => d !== undefined);
    return matchedDays.includes(dayOfWeek);
  }

  if (recurrenceRule.startsWith('FREQ=WEEKLY')) {
    const originDate = parseLocalDate(startDateStr);
    return targetDate.getDay() === originDate.getDay();
  }

  return true;
}

export function getCustomizedDailyRoutine(
  workStart: string = '14:00',
  workEnd: string = '23:00'
): Array<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>> {
  const startLabel = formatTimeLabel(workStart);
  const endLabel = formatTimeLabel(workEnd);

  return [
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
      recurrence_rule: 'FREQ=DAILY',
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
      recurrence_rule: 'FREQ=DAILY',
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
      recurrence_rule: 'FREQ=DAILY',
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
      recurrence_rule: 'FREQ=DAILY',
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
      recurrence_rule: 'FREQ=DAILY',
    },
    {
      title: '🎮 Leisure, Rest & Personal Recharge Time',
      description: 'Relaxation, gaming, reading, or hobby time before getting ready for work.',
      status: 'todo',
      priority: 'low',
      due_time: '12:30',
      scheduled_start: '12:30',
      scheduled_end: '13:30',
      category: 'leisure',
      is_recurring: true,
      recurrence_rule: 'FREQ=DAILY',
    },
    {
      title: `🏢 Work Shift (${startLabel} – ${endLabel})`,
      description: 'Primary engineering work tasks, sprint deliverables, and team collaboration.',
      status: 'todo',
      priority: 'critical',
      due_time: workStart,
      scheduled_start: workStart,
      scheduled_end: workEnd,
      category: 'work',
      is_recurring: true,
      recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    },
    {
      title: '🤖 1-Hour Tech Learning: AI Agents, RAG & MCP (30 Mins)',
      description: 'Dedicated 30 mins: AI Agents, RAG chunking & embeddings, System Design & MCPs.',
      status: 'todo',
      priority: 'critical',
      due_time: '17:00',
      scheduled_start: '17:00',
      scheduled_end: '17:30',
      category: 'learning',
      is_recurring: true,
      recurrence_rule: 'FREQ=DAILY',
    },
    {
      title: '⚙️ 1-Hour Tech Learning: DevOps & Pure Python - No Copilot (30 Mins)',
      description: 'Dedicated 30 mins: K8s/Docker/Linux/Terraform + native Python coding practice without Copilot.',
      status: 'todo',
      priority: 'critical',
      due_time: '17:30',
      scheduled_start: '17:30',
      scheduled_end: '18:00',
      category: 'learning',
      is_recurring: true,
      recurrence_rule: 'FREQ=DAILY',
    },
    {
      title: '🛒 Commute & Day-Before Grocery Check for Tomorrow',
      description: 'Return home and verify ingredients for tomorrow’s planned recipes.',
      status: 'todo',
      priority: 'medium',
      due_time: workEnd,
      scheduled_start: workEnd,
      scheduled_end: '23:30',
      category: 'errands',
      is_recurring: true,
      recurrence_rule: 'FREQ=DAILY',
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
      recurrence_rule: 'FREQ=DAILY',
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
      recurrence_rule: 'FREQ=DAILY',
    },
  ];
}

export const DEFAULT_DAILY_ROUTINE = getCustomizedDailyRoutine('14:00', '23:00');

export class TaskService {
  private static dailyLoadLocks = new Map<string, Promise<Task[]>>();

  // Fetch tasks strictly for the specified date
  static async getTasks(userId: string, targetDate?: string): Promise<Task[]> {
    const dateStr = targetDate || dateKey();
    const key = `${userId}:${dateStr}`;
    const running = this.dailyLoadLocks.get(key);
    if (running) return running;

    const load = this.getTasksInternal(userId, dateStr);
    this.dailyLoadLocks.set(key, load);
    try {
      return await load;
    } finally {
      this.dailyLoadLocks.delete(key);
    }
  }

  private static async getTasksInternal(userId: string, dateStr: string): Promise<Task[]> {
    let tasksForDate: Task[] = [];

    if (!isCloudConfigured || userId === 'guest-local-user') {
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      tasksForDate = localTasks.filter(t => t.due_date === dateStr);
    } else {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, subtasks(*)')
        .eq('user_id', userId)
        .eq('due_date', dateStr)
        .is('deleted_at', null)
        .order('scheduled_start', { ascending: true, nullsFirst: false });

      if (error) {
        const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
        tasksForDate = localTasks.filter(t => t.due_date === dateStr);
      } else {
        // Hydrate cloud-fetched tasks into local IndexedDB without re-queueing outbound mutations
        tasksForDate = data ?? [];
        await SyncEngine.bulkSaveLocalItemsWithoutQueue('tasks', tasksForDate);
      }
    }

    // Ensure recurring tasks generate an occurrence on dateStr
    const allLocalTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
    const recurringTemplates = new Map<string, Task>();

    // 1. Gather local recurring templates (strictly is_recurring = true, not occurrences)
    for (const t of allLocalTasks) {
      if (t.is_recurring && !t.parent_task_id && !t.deleted_at) {
        const normKey = (t.title || '').trim().toLowerCase();
        if (normKey && !recurringTemplates.has(normKey)) {
          recurringTemplates.set(normKey, t);
        }
      }
    }

    // 2. Gather cloud recurring templates if cloud is configured
    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const { data: cloudTemplates } = await supabase
          .from('tasks')
          .select('*, subtasks(*)')
          .eq('user_id', userId)
          .eq('is_recurring', true)
          .is('parent_task_id', null)
          .is('deleted_at', null);

        if (cloudTemplates && cloudTemplates.length > 0) {
          for (const ct of cloudTemplates) {
            const normKey = (ct.title || '').trim().toLowerCase();
            if (normKey && !recurringTemplates.has(normKey)) {
              recurringTemplates.set(normKey, ct);
            }
          }
          await SyncEngine.bulkSaveLocalItemsWithoutQueue('tasks', cloudTemplates);
        }
      } catch (err) {
        console.warn('Failed to load cloud recurring templates:', err);
      }
    }

    if (recurringTemplates.size > 0) {
      const now = new Date().toISOString();
      let activeMilestone: Awaited<ReturnType<typeof RoadmapService.getActiveMilestone>> | null = null;

      for (const rec of recurringTemplates.values()) {
        // Skip if this specific date was marked as an exception
        if (rec.recurrence_exceptions && rec.recurrence_exceptions.includes(dateStr)) {
          continue;
        }

        // Evaluate recurrence rule (daily, weekdays, weekly)
        const templateStartDate = rec.due_date || (rec.created_at ? getLocalDateString(new Date(rec.created_at)) : dateStr);
        if (!isDateMatchingRecurrence(dateStr, templateStartDate, rec.recurrence_rule)) {
          continue;
        }

        const normTitle = rec.title.trim().toLowerCase();
        // Check if an occurrence already exists on dateStr (active or deleted)
        const alreadyOnDate = allLocalTasks.some(
          t => t.due_date === dateStr && (t.parent_task_id === rec.id || t.title.trim().toLowerCase() === normTitle)
        );

        if (!alreadyOnDate) {
          if (!activeMilestone) {
            try {
              activeMilestone = await RoadmapService.getActiveMilestone(userId);
            } catch {
              activeMilestone = null;
            }
          }

          const isMilestoneTarget = rec.category === 'learning' && activeMilestone;
          const occurrenceId = crypto.randomUUID();
          const instantiated: Task = {
            id: occurrenceId,
            user_id: userId,
            parent_task_id: rec.id,
            title: isMilestoneTarget && activeMilestone ? `🎯 ${activeMilestone.milestone.title}` : rec.title,
            description: rec.description,
            status: 'todo',
            priority: rec.priority,
            due_date: dateStr,
            due_time: rec.due_time,
            scheduled_start: rec.scheduled_start,
            scheduled_end: rec.scheduled_end,
            category: rec.category,
            estimated_minutes: rec.estimated_minutes,
            location: rec.location,
            milestone_id: isMilestoneTarget && activeMilestone ? activeMilestone.milestone.id : rec.milestone_id,
            is_recurring: false, // Occurrences are individual instances, NOT recurring templates!
            recurrence_rule: rec.recurrence_rule || 'FREQ=DAILY',
            subtasks: (rec.subtasks || []).map((s, idx) => ({
              id: crypto.randomUUID(),
              task_id: occurrenceId,
              user_id: userId,
              title: s.title,
              is_completed: false,
              position: idx,
              created_at: now,
              updated_at: now,
            })),
            version: 1,
            created_at: now,
            updated_at: now,
          };

          await SyncEngine.saveLocalItem('tasks', instantiated, 'INSERT');
          if (isCloudConfigured && userId !== 'guest-local-user') {
            try {
              const { subtasks: _, ...recRecord } = instantiated;
              const result = await supabase.from('tasks').insert(recRecord);
              throwIfSupabaseError(result);
            } catch (err) {
              console.warn('Queued recurring task instance for sync:', err);
            }
          }
          tasksForDate.push(instantiated);
        }
      }
    }

    // Sort by scheduled start
    tasksForDate.sort((a, b) => (a.scheduled_start || '99:99').localeCompare(b.scheduled_start || '99:99'));

    const seen = new Set<string>();
    const duplicateIds: string[] = [];
    const deduplicated = tasksForDate.filter(task => {
      // Only collapse records the app generated itself. Two user-created tasks may legitimately have the same title.
      const key = task.milestone_id
        ? `milestone:${task.milestone_id}:${task.due_date}`
        : task.parent_task_id
          ? `parent:${task.parent_task_id}:${task.due_date}`
          : task.is_recurring
            ? `routine:${task.title}:${task.due_date}:${task.scheduled_start || ''}:${task.scheduled_end || ''}`
            : null;
      if (!key || !seen.has(key)) {
        if (key) seen.add(key);
        return true;
      }
      duplicateIds.push(task.id);
      return false;
    });
    await Promise.all(duplicateIds.map(id => this.deleteTask(userId, id)));
    return deduplicated;
  }

  /** Adds the personalized routine based on configured work hours. */
  static async addStarterRoutine(userId: string, targetDate: string): Promise<Task[]> {
    const existing = await this.getTasks(userId, targetDate);
    if (existing.some(task => task.is_recurring)) return existing;
    const activeMilestone = await RoadmapService.getActiveMilestone(userId);
    const prefs = getPreferences();
    const routineTemplates = getCustomizedDailyRoutine(prefs.workStart || '14:00', prefs.workEnd || '23:00');
    const now = new Date().toISOString();
    const starterTasks = routineTemplates.map((item, index): Task => ({
      ...item,
      id: crypto.randomUUID(),
      user_id: userId,
      title: item.category === 'learning' && activeMilestone && index === 5 ? `🎯 ${activeMilestone.milestone.title}` : item.title,
      milestone_id: item.category === 'learning' && activeMilestone && index === 5 ? activeMilestone.milestone.id : undefined,
      due_date: targetDate,
      subtasks: [],
      version: 1,
      created_at: now,
      updated_at: now,
    }));
    for (const task of starterTasks) await SyncEngine.saveLocalItem('tasks', task, 'INSERT');
    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const result = await supabase.from('tasks').insert(starterTasks);
        throwIfSupabaseError(result);
      } catch (err) {
        console.warn('Queued starter routine for sync:', err);
      }
    }
    return this.getTasks(userId, targetDate);
  }

  // Calculate Streak
  static async calculateStreak(userId: string): Promise<number> {
    let allTasks: Task[] = [];
    if (isCloudConfigured && userId !== 'guest-local-user') {
      const { data } = await supabase.from('tasks').select('*').eq('user_id', userId).is('deleted_at', null);
      allTasks = data || [];
    } else {
      allTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
    }
    const completedDates = allTasks
      .filter(t => t.status === 'completed' && (t.completed_at || t.due_date))
      .map(t => (t.completed_at ? dateKey(new Date(t.completed_at)) : t.due_date!))
      .sort()
      .reverse();

    return calculateActiveStreak(completedDates);
  }

  static async calculateCompletionStreak(userId: string): Promise<number> {
    return this.calculateStreak(userId);
  }

  // Create a new task (strictly assigning to taskPartial.due_date)
  static async createTask(userId: string, taskPartial: Partial<Task>): Promise<Task> {
    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: taskPartial.title || 'Untitled Task',
      description: taskPartial.description || '',
      status: taskPartial.status || 'todo',
      priority: taskPartial.priority || 'medium',
      due_date: taskPartial.due_date || dateKey(),
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
      subtasks: taskPartial.subtasks || [],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await SyncEngine.saveLocalItem('tasks', newTask, 'INSERT');

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const { subtasks: _, ...taskRecord } = newTask;
        const result = await supabase.from('tasks').insert(taskRecord);
        throwIfSupabaseError(result);
      } catch (err) {
        console.warn('Queued task for cloud sync:', err);
      }
    }

    return newTask;
  }

  // Query tasks for an entire date range (e.g. for Month Calendar view)
  static async getTasksForDateRange(userId: string, startDate: string, endDate: string): Promise<Task[]> {
    if (!isCloudConfigured || userId === 'guest-local-user') {
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      return localTasks.filter(t => t.due_date && t.due_date >= startDate && t.due_date <= endDate);
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, subtasks(*)')
        .eq('user_id', userId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .is('deleted_at', null)
        .order('due_date', { ascending: true });

      if (error) {
        console.warn('Failed to fetch date range from cloud, falling back to local:', error);
        const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
        return localTasks.filter(t => t.due_date && t.due_date >= startDate && t.due_date <= endDate);
      }

      const tasks = data ?? [];
      await SyncEngine.bulkSaveLocalItemsWithoutQueue('tasks', tasks);
      return tasks;
    } catch (err) {
      console.warn('Error fetching date range tasks:', err);
      const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
      return localTasks.filter(t => t.due_date && t.due_date >= startDate && t.due_date <= endDate);
    }
  }

  // Update existing task including Subtasks & times
  static async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>,
    updateSeries: boolean = false
  ): Promise<Task | null> {
    let target = (await SyncEngine.getLocalItems<Task>('tasks', userId)).find(t => t.id === taskId);
    if (!target && isCloudConfigured && userId !== 'guest-local-user') {
      const { data } = await supabase.from('tasks').select('*, subtasks(*)').eq('id', taskId).eq('user_id', userId).maybeSingle();
      if (data) {
        target = data;
        await SyncEngine.saveLocalItemWithoutQueue('tasks', target);
      }
    }
    if (!target) return null;

    // If updateSeries is true and this is an occurrence with a parent_task_id, update the parent template too
    if (updateSeries && target.parent_task_id) {
      let parentTemplate = (await SyncEngine.getLocalItems<Task>('tasks', userId)).find(t => t.id === target!.parent_task_id);
      if (!parentTemplate && isCloudConfigured && userId !== 'guest-local-user') {
        const { data } = await supabase.from('tasks').select('*, subtasks(*)').eq('id', target.parent_task_id).eq('user_id', userId).maybeSingle();
        if (data) parentTemplate = data;
      }

      if (parentTemplate) {
        // Copy non-date/non-instance properties to parent
        const {
          id: _id,
          user_id: _uid,
          due_date: _dd,
          parent_task_id: _ptid,
          is_exception: _ie,
          source_date: _sd,
          is_rolled_over: _ro,
          created_at: _ca,
          subtasks: _sub,
          ...seriesUpdates
        } = updates;

        Object.assign(parentTemplate, seriesUpdates, { updated_at: new Date().toISOString() });
        await SyncEngine.saveLocalItem('tasks', parentTemplate, 'UPDATE');

        if (isCloudConfigured && userId !== 'guest-local-user') {
          try {
            const res = await supabase.from('tasks').update(seriesUpdates).eq('id', parentTemplate.id).eq('user_id', userId);
            throwIfSupabaseError(res);
          } catch (err) {
            console.warn('Queued series parent update for sync:', err);
          }
        }
      }
    }

    Object.assign(target, updates, { updated_at: new Date().toISOString() });
    await SyncEngine.saveLocalItem('tasks', target, 'UPDATE');

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const { subtasks: _, ...cleanUpdates } = updates;
        const result = await supabase.from('tasks').update(cleanUpdates).eq('id', taskId).eq('user_id', userId);
        throwIfSupabaseError(result);
      } catch (err) {
        console.warn('Queued task update for sync:', err);
      }
    }

    return target;
  }

  // Skip a recurring occurrence for a specific day
  static async skipOccurrence(userId: string, taskId: string): Promise<boolean> {
    let target = (await SyncEngine.getLocalItems<Task>('tasks', userId)).find(t => t.id === taskId);
    if (!target && isCloudConfigured && userId !== 'guest-local-user') {
      const { data } = await supabase.from('tasks').select('*, subtasks(*)').eq('id', taskId).eq('user_id', userId).maybeSingle();
      if (data) target = data;
    }
    if (!target || !target.due_date) return false;

    const occurrenceDate = target.due_date;
    const parentId = target.parent_task_id;

    if (parentId) {
      let parentTemplate = (await SyncEngine.getLocalItems<Task>('tasks', userId)).find(t => t.id === parentId);
      if (!parentTemplate && isCloudConfigured && userId !== 'guest-local-user') {
        const { data } = await supabase.from('tasks').select('*, subtasks(*)').eq('id', parentId).eq('user_id', userId).maybeSingle();
        if (data) parentTemplate = data;
      }

      if (parentTemplate) {
        const exceptions = new Set(parentTemplate.recurrence_exceptions || []);
        exceptions.add(occurrenceDate);
        parentTemplate.recurrence_exceptions = Array.from(exceptions);
        parentTemplate.updated_at = new Date().toISOString();
        await SyncEngine.saveLocalItem('tasks', parentTemplate, 'UPDATE');

        if (isCloudConfigured && userId !== 'guest-local-user') {
          try {
            const res = await supabase.from('tasks').update({ recurrence_exceptions: parentTemplate.recurrence_exceptions }).eq('id', parentId).eq('user_id', userId);
            throwIfSupabaseError(res);
          } catch (err) {
            console.warn('Queued skip occurrence exception update for sync:', err);
          }
        }
      }
    }

    // Now delete this occurrence
    await this.deleteTask(userId, taskId);
    return true;
  }

  // Explicit Task Status Transition (Kanban support & milestone synchronization)
  static async setTaskStatus(userId: string, taskId: string, newStatus: TaskStatus): Promise<Task | null> {
    let target = (await SyncEngine.getLocalItems<Task>('tasks', userId)).find(t => t.id === taskId);
    if (!target && isCloudConfigured && userId !== 'guest-local-user') {
      const { data } = await supabase.from('tasks').select('*, subtasks(*)').eq('id', taskId).eq('user_id', userId).maybeSingle();
      if (data) {
        target = data;
        await SyncEngine.saveLocalItemWithoutQueue('tasks', target);
      }
    }
    if (!target) return null;

    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
    target.status = newStatus;
    target.completed_at = completedAt ?? undefined;
    target.updated_at = new Date().toISOString();

    await SyncEngine.saveLocalItem('tasks', target, 'UPDATE');

    // Milestone rollup if completed
    if (target.milestone_id && newStatus === 'completed') {
      try {
        await RoadmapService.completeMilestone(userId, target.milestone_id);
      } catch (err) {
        console.warn('Failed milestone completion rollup:', err);
      }
    }

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const result = await supabase.from('tasks').update({
          status: newStatus,
          completed_at: completedAt,
          updated_at: target.updated_at,
        }).eq('id', taskId).eq('user_id', userId);
        throwIfSupabaseError(result);
      } catch (err) {
        console.warn('Queued status update for sync:', err);
      }
    }

    return target;
  }

  // Toggle Task Completion (Strike-through effect) and sync with Roadmap milestone
  static async toggleTaskCompletion(userId: string, taskId: string, currentStatus: TaskStatus): Promise<TaskStatus> {
    const newStatus: TaskStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    const updated = await this.setTaskStatus(userId, taskId, newStatus);
    return updated ? updated.status : newStatus;
  }

  // Reset daily routine tasks without duplicate pollution
  static async resetDailyRoutine(userId: string, targetDate: string): Promise<Task[]> {
    const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);

    // Remove existing tasks for this date from local store
    for (const t of localTasks) {
      if (t.due_date === targetDate) {
        await SyncEngine.deleteLocalItem('tasks', t.id);
      }
    }

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const result = await supabase.from('tasks').delete().eq('user_id', userId).eq('due_date', targetDate);
        throwIfSupabaseError(result);
      } catch (err) {
        console.warn('Queued cloud delete for routine reset:', err);
      }
    }

    // Now re-fetch which will cleanly initialize the default routine
    return this.getTasks(userId, targetDate);
  }

  // Auto-rollover uncompleted tasks strictly from past dates (due_date < todayDate) into todayDate ("Move Right")
  static async rolloverIncompleteTasks(userId: string, targetDate: string = dateKey()): Promise<Task[]> {
    const today = dateKey();
    // Rollover only targets the actual today; never roll forward when viewing future dates
    const effectiveTargetDate = targetDate > today ? today : targetDate;
    const localTasks = await SyncEngine.getLocalItems<Task>('tasks', userId);
    const overdueUnfinished = localTasks.filter(
      // Routine items repeat daily anyway. Only one-off tasks from PAST dates (strictly < effectiveTargetDate) roll forward.
      t => t.due_date && t.due_date < effectiveTargetDate && t.status !== 'completed' && !t.deleted_at && !t.is_recurring && !t.parent_task_id
    );

    const rolledOver: Task[] = [];
    for (const t of overdueUnfinished) {
      t.source_date = t.due_date;
      t.due_date = effectiveTargetDate;
      t.is_rolled_over = true;
      t.updated_at = new Date().toISOString();
      await SyncEngine.saveLocalItem('tasks', t, 'UPDATE');
      rolledOver.push(t);

      if (isCloudConfigured && userId !== 'guest-local-user') {
        try {
          const result = await supabase.from('tasks').update({
            due_date: effectiveTargetDate,
            source_date: t.source_date,
            is_rolled_over: true,
            updated_at: t.updated_at,
          }).eq('id', t.id).eq('user_id', userId);
          throwIfSupabaseError(result);
        } catch (err) {
          console.warn('Queued rollover for sync:', err);
        }
      }
    }

    return rolledOver;
  }

  // Move a single task to next day ("Move Right" button)
  static async moveTaskToNextDay(userId: string, taskId: string): Promise<Task | null> {
    let target = (await SyncEngine.getLocalItems<Task>('tasks', userId)).find(t => t.id === taskId);
    if (!target && isCloudConfigured && userId !== 'guest-local-user') {
      const { data } = await supabase.from('tasks').select('*, subtasks(*)').eq('id', taskId).eq('user_id', userId).maybeSingle();
      if (data) {
        target = data;
        await SyncEngine.saveLocalItemWithoutQueue('tasks', target);
      }
    }
    if (!target || !target.due_date) return null;

    const originalDate = target.due_date;
    const nextDate = addLocalDays(originalDate, 1);

    // If target is an occurrence of a recurring template, add originalDate to exceptions of template
    if (target.parent_task_id) {
      const parentTemplate = (await SyncEngine.getLocalItems<Task>('tasks', userId)).find(t => t.id === target.parent_task_id);
      if (parentTemplate) {
        const exceptions = new Set(parentTemplate.recurrence_exceptions || []);
        exceptions.add(originalDate);
        parentTemplate.recurrence_exceptions = Array.from(exceptions);
        parentTemplate.updated_at = new Date().toISOString();
        await SyncEngine.saveLocalItem('tasks', parentTemplate, 'UPDATE');
        if (isCloudConfigured && userId !== 'guest-local-user') {
          try {
            const res = await supabase.from('tasks').update({ recurrence_exceptions: parentTemplate.recurrence_exceptions }).eq('id', parentTemplate.id).eq('user_id', userId);
            throwIfSupabaseError(res);
          } catch (err) {
            console.warn('Queued recurrence exception update for sync:', err);
          }
        }
      }
    }

    target.source_date = originalDate;
    target.due_date = nextDate;
    target.is_rolled_over = true;
    target.is_exception = true;
    target.updated_at = new Date().toISOString();

    await SyncEngine.saveLocalItem('tasks', target, 'UPDATE');

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const result = await supabase.from('tasks').update({
          due_date: nextDate,
          source_date: originalDate,
          is_rolled_over: true,
          is_exception: true,
          updated_at: target.updated_at,
        }).eq('id', taskId).eq('user_id', userId);
        throwIfSupabaseError(result);
      } catch (err) {
        console.warn('Queued move right for sync:', err);
      }
    }

    return target;
  }

  // Soft Delete Task
  static async deleteTask(userId: string, taskId: string): Promise<Task | null> {
    let target = (await SyncEngine.getLocalItems<Task>('tasks', userId)).find(t => t.id === taskId);
    if (!target && isCloudConfigured && userId !== 'guest-local-user') {
      const { data } = await supabase.from('tasks').select('*, subtasks(*)').eq('id', taskId).eq('user_id', userId).maybeSingle();
      if (data) {
        target = data;
        await SyncEngine.saveLocalItemWithoutQueue('tasks', target);
      }
    }
    if (!target) return null;

    target.deleted_at = new Date().toISOString();
    await SyncEngine.saveLocalItem('tasks', target, 'UPDATE');

    if (isCloudConfigured && userId !== 'guest-local-user') {
      try {
        const result = await supabase.from('tasks').update({ deleted_at: target.deleted_at }).eq('id', taskId).eq('user_id', userId);
        throwIfSupabaseError(result);
      } catch (err) {
        console.warn('Queued delete for sync:', err);
      }
    }

    return target;
  }

  // Restore Soft-Deleted Task (for Undo)
  static async restoreTask(userId: string, taskId: string): Promise<Task | null> {
    let target = await SyncEngine.getLocalItem<Task>('tasks', taskId);
    if (!target && isCloudConfigured && userId !== 'guest-local-user') {
      const { data } = await supabase.from('tasks').select('*, subtasks(*)').eq('id', taskId).eq('user_id', userId).maybeSingle();
      if (data) {
        target = data;
      }
    }
    if (target?.user_id !== userId) return null;
    if (target) {
      target.deleted_at = undefined;
      target.updated_at = new Date().toISOString();
      await SyncEngine.saveLocalItem('tasks', target, 'UPDATE');
      if (isCloudConfigured && userId !== 'guest-local-user') {
        try {
          const result = await supabase.from('tasks').update({ deleted_at: null, updated_at: target.updated_at }).eq('id', taskId).eq('user_id', userId);
          throwIfSupabaseError(result);
        } catch (err) {
          console.warn('Queued task restore for sync:', err);
        }
      }
      return target;
    }
    return null;
  }

  // Natural Language Parser for Quick Capture
  static parseNaturalLanguageInput(input: string): { title: string; due_date?: string; due_time?: string; priority?: Priority; category?: any } {
    let title = input;
    let due_date: string | undefined = undefined;
    let due_time: string | undefined = undefined;
    let priority: Priority = 'medium';
    let category = 'general';

    const lower = input.toLowerCase();
    const todayDateStr = dateKey();

    if (lower.includes('tomorrow')) {
      due_date = addLocalDays(todayDateStr, 1);
      title = title.replace(/tomorrow/i, '').trim();
    } else if (lower.includes('today')) {
      due_date = todayDateStr;
      title = title.replace(/today/i, '').trim();
    }

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
