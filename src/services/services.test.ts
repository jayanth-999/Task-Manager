import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { TaskService, isDateMatchingRecurrence, getCustomizedDailyRoutine, formatTimeLabel } from './taskService';
import { HabitService } from './habitService';
import { RoadmapService } from './roadmapService';
import { SyncEngine } from './syncEngine';
import { calculateElapsedFocusMinutes } from './focusService';
import { calculateActiveStreak, dateKey, addLocalDays } from './dateUtils';
import { throwIfSupabaseError } from './supabaseResult';
import type { Task, Habit } from '../types';

const guestId = 'guest-local-user';
const now = '2026-09-17T10:00:00.000Z';

function task(id: string, user_id = guestId): Task {
  return {
    id, user_id, title: 'Regression task', status: 'todo', priority: 'medium',
    due_date: dateKey(), category: 'general', version: 1,
    created_at: now, updated_at: now,
  };
}

beforeAll(() => {
  // Node's Web Crypto is available in supported test environments; this keeps
  // older runners compatible with the services' UUID generation.
  if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => 'test-uuid' } });
  let counter = 0;
  const generateId = () =>
    `00000000-0000-0000-0000-${String(++counter).padStart(12, '0')}` as `${string}-${string}-${string}-${string}-${string}`;
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: generateId },
      configurable: true,
    });
  } else {
    try {
      const probe = globalThis.crypto.randomUUID();
      if (!probe || (probe as string) === 'test-uuid') {
        (globalThis.crypto as { randomUUID: () => `${string}-${string}-${string}-${string}-${string}` }).randomUUID = generateId;
      }
    } catch {
      (globalThis.crypto as { randomUUID: () => `${string}-${string}-${string}-${string}-${string}` }).randomUUID = generateId;
    }
  }
});

describe('task deletion and restore', () => {
  it('restores a soft-deleted task that normal local queries intentionally hide', async () => {
    const record = task(`delete-restore-${Date.now()}`);
    await SyncEngine.saveLocalItem('tasks', record);
    await TaskService.deleteTask(guestId, record.id);
    expect((await SyncEngine.getLocalItems<Task>('tasks', guestId)).some(item => item.id === record.id)).toBe(false);

    const restored = await TaskService.restoreTask(guestId, record.id);
    expect(restored?.deleted_at).toBeUndefined();
    expect((await SyncEngine.getLocalItems<Task>('tasks', guestId)).some(item => item.id === record.id)).toBe(true);
  });
});

describe('focus timing', () => {
  it('records elapsed wall-clock minutes rather than a configured timer length', () => {
    const started = new Date('2026-09-17T10:00:00.000Z');
    expect(calculateElapsedFocusMinutes(started, new Date('2026-09-17T10:07:31.000Z'))).toBe(8);
    expect(calculateElapsedFocusMinutes(started, started)).toBe(1);
  });
});

describe('streak calculation', () => {
  it('counts consecutive calendar dates and accepts a streak starting yesterday', () => {
    const nowDate = new Date(2026, 8, 17, 12);
    expect(calculateActiveStreak(['2026-09-16', '2026-09-15', '2026-09-14'], nowDate)).toBe(3);
    expect(calculateActiveStreak(['2026-09-17', '2026-09-15'], nowDate)).toBe(1);
  });
});

describe('guest migration', () => {
  it('rekeys guest records so they are available to the signed-in account', async () => {
    const id = `guest-migration-${Date.now()}`;
    await SyncEngine.saveLocalItem('tasks', task(id));
    await SyncEngine.migrateGuestDataToAccount('account-under-test');

    expect((await SyncEngine.getLocalItems<Task>('tasks', 'account-under-test')).some(item => item.id === id)).toBe(true);
    expect((await SyncEngine.getLocalItems<Task>('tasks', guestId)).some(item => item.id === id)).toBe(false);
  });
});

describe('rollover safety and recurring routines', () => {
  it('does not roll today’s tasks forward when viewing a future date', async () => {
    const today = dateKey();
    const tomorrow = addLocalDays(today, 1);
    const testTask = task(`rollover-safety-${Date.now()}`);
    testTask.due_date = today;
    testTask.status = 'todo';
    testTask.is_recurring = false;
    await SyncEngine.saveLocalItem('tasks', testTask);

    // Call rollover targeting tomorrow — it must clamp to today and NOT move today's task to tomorrow
    const rolledOver = await TaskService.rolloverIncompleteTasks(guestId, tomorrow);
    expect(rolledOver.some(t => t.id === testTask.id)).toBe(false);

    // Check task in storage still has due_date === today
    const stored = await SyncEngine.getLocalItem<Task>('tasks', testTask.id);
    expect(stored?.due_date).toBe(today);
  });

  it('automatically displays recurring routine tasks on next days', async () => {
    const today = dateKey();
    const tomorrow = addLocalDays(today, 1);
    const routineTask: Task = {
      id: `routine-test-${Date.now()}`,
      user_id: guestId,
      title: 'Morning Meditation & Core',
      status: 'todo',
      priority: 'high',
      due_date: today,
      category: 'routine',
      is_recurring: true,
      version: 1,
      created_at: now,
      updated_at: now,
    };
    await SyncEngine.saveLocalItem('tasks', routineTask);

    // Now request tasks for tomorrow — it should instantiate the routine task for tomorrow!
    const tomorrowTasks = await TaskService.getTasks(guestId, tomorrow);
    expect(tomorrowTasks.some(t => t.title === routineTask.title && t.due_date === tomorrow)).toBe(true);
  });
});

describe('habit deduplication', () => {
  it('consolidates duplicate habits and purges redundant copies', async () => {
    const testUserId = `test-user-habits-${Date.now()}`;
    const habitA: Habit = {
      id: `ha-1-${Date.now()}`,
      user_id: testUserId,
      name: 'Morning Workout & Hydration',
      frequency: 'daily',
      target_count_per_period: 1,
      current_streak: 2,
      longest_streak: 5,
      created_at: now,
      updated_at: now,
    };
    const habitB: Habit = {
      id: `ha-2-${Date.now()}`,
      user_id: testUserId,
      name: 'Morning Fitness / Workout',
      frequency: 'daily',
      target_count_per_period: 1,
      current_streak: 3,
      longest_streak: 7,
      created_at: now,
      updated_at: now,
    };

    await SyncEngine.saveLocalItem('habits', habitA);
    await SyncEngine.saveLocalItem('habits', habitB);

    // Also add a log to habitB
    await SyncEngine.saveLocalItem('habit_logs', {
      id: `log-${Date.now()}`,
      habit_id: habitB.id,
      user_id: testUserId,
      completed_date: '2026-09-17',
      created_at: now,
    });

    const habits = await HabitService.getHabits(testUserId);
    // Should be deduplicated into 1 habit!
    const workoutHabits = habits.filter(h => h.name.toLowerCase().includes('workout') || h.name.toLowerCase().includes('fitness'));
    expect(workoutHabits.length).toBe(1);

    // The single habit should have the completion log merged
    expect(workoutHabits[0].logs?.some(l => l.completed_date === '2026-09-17')).toBe(true);

    // Duplicate record in storage should be deleted
    const storedDup = await SyncEngine.getLocalItem<Habit>('habits', habitB.id);
    expect(storedDup).toBeUndefined();
  });
});

describe('cloud hydration and local storage without queue', () => {
  it('saves items locally without creating outbound sync queue items', async () => {
    const queueBefore = await SyncEngine.getSyncQueue();
    const hydratedTask = task(`hydrated-task-${Date.now()}`);
    await SyncEngine.saveLocalItemWithoutQueue('tasks', hydratedTask);

    const stored = await SyncEngine.getLocalItem<Task>('tasks', hydratedTask.id);
    expect(stored?.id).toBe(hydratedTask.id);

    const queueAfter = await SyncEngine.getSyncQueue();
    expect(queueAfter.length).toBe(queueBefore.length);
  });
});

describe('explicit Kanban status transitions', () => {
  it('correctly transitions tasks across todo, in_progress, completed, and back', async () => {
    const testTask = task(`kanban-flow-${Date.now()}`);
    testTask.status = 'todo';
    await SyncEngine.saveLocalItem('tasks', testTask);

    // 1. Move to in_progress
    const inProg = await TaskService.setTaskStatus(guestId, testTask.id, 'in_progress');
    expect(inProg?.status).toBe('in_progress');
    expect(inProg?.completed_at).toBeUndefined();

    // 2. Move to completed
    const done = await TaskService.setTaskStatus(guestId, testTask.id, 'completed');
    expect(done?.status).toBe('completed');
    expect(done?.completed_at).toBeDefined();

    // 3. Reopen back to todo
    const reopened = await TaskService.setTaskStatus(guestId, testTask.id, 'todo');
    expect(reopened?.status).toBe('todo');
    expect(reopened?.completed_at).toBeUndefined();
  });
});

describe('recurring routine exceptions and move right', () => {
  it('records a recurrence exception on the parent template when an occurrence is moved', async () => {
    const userId = `recur-user-${Date.now()}`;
    const parentTemplate: Task = {
      id: `template-${Date.now()}`,
      user_id: userId,
      title: 'Daily Evening Review',
      status: 'todo',
      priority: 'high',
      due_date: '2026-09-16',
      category: 'routine',
      is_recurring: true,
      recurrence_exceptions: [],
      version: 1,
      created_at: now,
      updated_at: now,
    };
    await SyncEngine.saveLocalItem('tasks', parentTemplate);

    // Instantiating for 2026-09-17 yields the occurrence
    const tasksSep17 = await TaskService.getTasks(userId, '2026-09-17');
    const occurrence = tasksSep17.find(t => t.parent_task_id === parentTemplate.id);
    expect(occurrence).toBeDefined();
    expect(occurrence?.is_recurring).toBe(false);

    // Move the occurrence to the next day ("Move Right")
    await TaskService.moveTaskToNextDay(userId, occurrence!.id);

    // Parent template must remain is_recurring: true, and have '2026-09-17' in recurrence_exceptions
    const updatedParent = await SyncEngine.getLocalItem<Task>('tasks', parentTemplate.id);
    expect(updatedParent?.is_recurring).toBe(true);
    expect(updatedParent?.recurrence_exceptions).toContain('2026-09-17');

    // Querying Sep 17 again should NOT re-instantiate this routine task because of the exception
    const freshSep17 = await TaskService.getTasks(userId, '2026-09-17');
    expect(freshSep17.some(t => t.parent_task_id === parentTemplate.id && t.due_date === '2026-09-17')).toBe(false);
  });
});

describe('month calendar date range query', () => {
  it('retrieves tasks strictly within a date range and excludes out-of-range tasks', async () => {
    const userId = `range-user-${Date.now()}`;
    const taskSep5 = task(`t-sep5-${Date.now()}`, userId);
    taskSep5.due_date = '2026-09-05';

    const taskSep20 = task(`t-sep20-${Date.now()}`, userId);
    taskSep20.due_date = '2026-09-20';

    const taskOct10 = task(`t-oct10-${Date.now()}`, userId);
    taskOct10.due_date = '2026-10-10';

    await SyncEngine.saveLocalItem('tasks', taskSep5);
    await SyncEngine.saveLocalItem('tasks', taskSep20);
    await SyncEngine.saveLocalItem('tasks', taskOct10);

    const rangeTasks = await TaskService.getTasksForDateRange(userId, '2026-09-01', '2026-09-30');
    expect(rangeTasks.some(t => t.id === taskSep5.id)).toBe(true);
    expect(rangeTasks.some(t => t.id === taskSep20.id)).toBe(true);
    expect(rangeTasks.some(t => t.id === taskOct10.id)).toBe(false);
  });
});

describe('roadmap primary-state logic', () => {
  it('demotes existing primary roadmaps when a new primary roadmap is created', async () => {
    const userId = `roadmap-user-${Date.now()}`;
    const roadmap1 = await RoadmapService.createRoadmapFromData(userId, {
      title: 'DevOps Mastery',
      duration_months: 3,
      is_primary: true,
      phases: [{
        title: 'Phase 1',
        milestones: [{ title: 'Docker Containers', target_day: 7 }],
      }],
    });
    expect(roadmap1.is_primary).toBe(true);

    const roadmap2 = await RoadmapService.createRoadmapFromData(userId, {
      title: 'Fullstack AI Engineering',
      duration_months: 4,
      is_primary: true,
      phases: [{
        title: 'Phase 1',
        milestones: [{ title: 'LLM Prompt Engineering & RAG', target_day: 10 }],
      }],
    });
    expect(roadmap2.is_primary).toBe(true);

    // Verify roadmap1 was demoted to is_primary === false
    const allRoadmaps = await RoadmapService.getRoadmaps(userId);
    const updatedRoadmap1 = allRoadmaps.find(r => r.id === roadmap1.id);
    const updatedRoadmap2 = allRoadmaps.find(r => r.id === roadmap2.id);

    expect(updatedRoadmap1?.is_primary).toBe(false);
    expect(updatedRoadmap2?.is_primary).toBe(true);
  });
});

describe('supabase error handling', () => {
  it('throws an error when Supabase reports a failure', () => {
    expect(() => {
      throwIfSupabaseError({
        error: {
          message: 'column "category" does not exist',
          details: 'Error 42703',
          hint: '',
          code: '42703',
        },
      });
    }).toThrow('column "category" does not exist');
  });

  it('does not throw when result has no error', () => {
    expect(() => {
      throwIfSupabaseError({ data: [{ id: '1' }], error: null });
    }).not.toThrow();
  });
});

describe('recurrence rules evaluation', () => {
  it('correctly matches daily, weekday, and weekly recurrence rules', () => {
    const startDate = '2026-09-17'; // Thursday

    // Daily
    expect(isDateMatchingRecurrence('2026-09-17', startDate, 'FREQ=DAILY')).toBe(true);
    expect(isDateMatchingRecurrence('2026-09-18', startDate, 'FREQ=DAILY')).toBe(true);
    expect(isDateMatchingRecurrence('2026-09-19', startDate, 'FREQ=DAILY')).toBe(true);
    expect(isDateMatchingRecurrence('2026-09-16', startDate, 'FREQ=DAILY')).toBe(false); // Before start date

    // Weekdays (MO,TU,WE,TH,FR)
    const weekdayRule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
    expect(isDateMatchingRecurrence('2026-09-17', startDate, weekdayRule)).toBe(true); // Thu
    expect(isDateMatchingRecurrence('2026-09-18', startDate, weekdayRule)).toBe(true); // Fri
    expect(isDateMatchingRecurrence('2026-09-19', startDate, weekdayRule)).toBe(false); // Sat
    expect(isDateMatchingRecurrence('2026-09-20', startDate, weekdayRule)).toBe(false); // Sun
    expect(isDateMatchingRecurrence('2026-09-21', startDate, weekdayRule)).toBe(true); // Mon

    // Weekly (same day of week as start date: Thursday)
    const weeklyRule = 'FREQ=WEEKLY';
    expect(isDateMatchingRecurrence('2026-09-17', startDate, weeklyRule)).toBe(true); // Thu
    expect(isDateMatchingRecurrence('2026-09-24', startDate, weeklyRule)).toBe(true); // Thu (+7)
    expect(isDateMatchingRecurrence('2026-09-18', startDate, weeklyRule)).toBe(false); // Fri
    expect(isDateMatchingRecurrence('2026-09-25', startDate, weeklyRule)).toBe(false); // Fri
  });
});

describe('series vs occurrence editing', () => {
  it('updates only the occurrence when updateSeries is false', async () => {
    const parent = task(`parent-tmpl-${Date.now()}`);
    parent.title = 'Daily Standup Meeting';
    parent.is_recurring = true;
    parent.recurrence_rule = 'FREQ=DAILY';
    await SyncEngine.saveLocalItem('tasks', parent);

    const occurrence = task(`occ-${Date.now()}`);
    occurrence.title = 'Daily Standup Meeting';
    occurrence.parent_task_id = parent.id;
    occurrence.due_date = '2026-09-18';
    occurrence.is_recurring = false;
    await SyncEngine.saveLocalItem('tasks', occurrence);

    // Edit occurrence only
    await TaskService.updateTask(guestId, occurrence.id, { title: 'Special Standup with Guest' }, false);

    const storedOcc = await SyncEngine.getLocalItem<Task>('tasks', occurrence.id);
    const storedParent = await SyncEngine.getLocalItem<Task>('tasks', parent.id);

    expect(storedOcc?.title).toBe('Special Standup with Guest');
    expect(storedParent?.title).toBe('Daily Standup Meeting'); // Parent template untouched
  });

  it('updates both the parent template and occurrence when updateSeries is true', async () => {
    const parent = task(`parent-series-${Date.now()}`);
    parent.title = 'Morning System Check';
    parent.is_recurring = true;
    parent.recurrence_rule = 'FREQ=DAILY';
    await SyncEngine.saveLocalItem('tasks', parent);

    const occurrence = task(`occ-series-${Date.now()}`);
    occurrence.title = 'Morning System Check';
    occurrence.parent_task_id = parent.id;
    occurrence.due_date = '2026-09-18';
    occurrence.is_recurring = false;
    await SyncEngine.saveLocalItem('tasks', occurrence);

    // Edit whole series
    await TaskService.updateTask(guestId, occurrence.id, { title: 'Morning Automated Health Check' }, true);

    const storedOcc = await SyncEngine.getLocalItem<Task>('tasks', occurrence.id);
    const storedParent = await SyncEngine.getLocalItem<Task>('tasks', parent.id);

    expect(storedOcc?.title).toBe('Morning Automated Health Check');
    expect(storedParent?.title).toBe('Morning Automated Health Check'); // Parent template updated
  });
});

describe('skip occurrence', () => {
  it('adds the skipped date to parent recurrence_exceptions and deletes the occurrence', async () => {
    const parent = task(`parent-skip-${Date.now()}`);
    parent.title = 'Evening Gym Session';
    parent.is_recurring = true;
    parent.recurrence_exceptions = [];
    await SyncEngine.saveLocalItem('tasks', parent);

    const occurrence = task(`occ-skip-${Date.now()}`);
    occurrence.title = 'Evening Gym Session';
    occurrence.parent_task_id = parent.id;
    occurrence.due_date = '2026-09-18';
    await SyncEngine.saveLocalItem('tasks', occurrence);

    const skipped = await TaskService.skipOccurrence(guestId, occurrence.id);
    expect(skipped).toBe(true);

    // Parent has exception
    const storedParent = await SyncEngine.getLocalItem<Task>('tasks', parent.id);
    expect(storedParent?.recurrence_exceptions).toContain('2026-09-18');

    // Occurrence is soft-deleted
    const storedOcc = await SyncEngine.getLocalItem<Task>('tasks', occurrence.id);
    expect(storedOcc?.deleted_at).toBeDefined();
  });
});

describe('customized daily routine generation', () => {
  it('generates work shift according to configured work hours', () => {
    const routine = getCustomizedDailyRoutine('09:00', '18:00');
    const workTask = routine.find(t => t.category === 'work');

    expect(workTask).toBeDefined();
    expect(workTask?.title).toContain('9:00 AM – 6:00 PM');
    expect(workTask?.scheduled_start).toBe('09:00');
    expect(workTask?.scheduled_end).toBe('18:00');
    expect(workTask?.due_time).toBe('09:00');
    expect(workTask?.recurrence_rule).toBe('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
  });

  it('formats 12-hour AM/PM time labels correctly', () => {
    expect(formatTimeLabel('07:30')).toBe('7:30 AM');
    expect(formatTimeLabel('12:00')).toBe('12:00 PM');
    expect(formatTimeLabel('14:00')).toBe('2:00 PM');
    expect(formatTimeLabel('23:00')).toBe('11:00 PM');
    expect(formatTimeLabel('00:00')).toBe('12:00 AM');
  });
});

describe('errands persistence', () => {
  it('persists location-based errands in task collection', async () => {
    const errand = await TaskService.createTask(guestId, {
      title: 'Buy N95 Masks and Vitamin C',
      category: 'errands',
      location: 'Pharmacy',
      status: 'todo',
    });

    expect(errand.category).toBe('errands');
    expect(errand.location).toBe('Pharmacy');

    const stored = await SyncEngine.getLocalItem<Task>('tasks', errand.id);
    expect(stored?.title).toBe('Buy N95 Masks and Vitamin C');
    expect(stored?.location).toBe('Pharmacy');
    expect(stored?.category).toBe('errands');
  });
});

describe('weekly recurrence and skip persistence in taskService', () => {
  it('instantiates weekly recurring tasks strictly on matching day-of-week intervals', async () => {
    const userId = `weekly-recur-user-${Date.now()}`;
    const baseDate = dateKey();
    const nextWeekDate = addLocalDays(baseDate, 7);
    const tomorrowDate = addLocalDays(baseDate, 1);
    const threeDaysDate = addLocalDays(baseDate, 3);

    const weeklyTemplate: Task = {
      id: `weekly-tmpl-${Date.now()}`,
      user_id: userId,
      title: 'Weekly Sprint Retrospective & Demo',
      status: 'todo',
      priority: 'high',
      due_date: baseDate,
      category: 'work',
      is_recurring: true,
      recurrence_rule: 'FREQ=WEEKLY',
      version: 1,
      created_at: now,
      updated_at: now,
    };
    await SyncEngine.saveLocalItem('tasks', weeklyTemplate);

    // 1. Check next week (+7 days): must instantiate
    const nextWeekTasks = await TaskService.getTasks(userId, nextWeekDate);
    expect(nextWeekTasks.some(t => t.parent_task_id === weeklyTemplate.id && t.due_date === nextWeekDate)).toBe(true);

    // 2. Check tomorrow (+1 day): must NOT instantiate
    const tomorrowTasks = await TaskService.getTasks(userId, tomorrowDate);
    expect(tomorrowTasks.some(t => t.parent_task_id === weeklyTemplate.id)).toBe(false);

    // 3. Check +3 days: must NOT instantiate
    const threeDaysTasks = await TaskService.getTasks(userId, threeDaysDate);
    expect(threeDaysTasks.some(t => t.parent_task_id === weeklyTemplate.id)).toBe(false);
  });

  it('preserves skip exceptions across multiple queries and does not resurrect skipped instances', async () => {
    const userId = `skip-persist-user-${Date.now()}`;
    const baseDate = dateKey();
    const day1 = addLocalDays(baseDate, 1);
    const day2 = addLocalDays(baseDate, 2);

    const dailyTemplate: Task = {
      id: `daily-persist-${Date.now()}`,
      user_id: userId,
      title: 'Daily Core Exercises',
      status: 'todo',
      priority: 'medium',
      due_date: baseDate,
      category: 'fitness',
      is_recurring: true,
      recurrence_rule: 'FREQ=DAILY',
      recurrence_exceptions: [],
      version: 1,
      created_at: now,
      updated_at: now,
    };
    await SyncEngine.saveLocalItem('tasks', dailyTemplate);

    // 1. Fetch day 1 tasks — occurrence is instantiated
    const day1Tasks = await TaskService.getTasks(userId, day1);
    const occDay1 = day1Tasks.find(t => t.parent_task_id === dailyTemplate.id);
    expect(occDay1).toBeDefined();

    // 2. Skip this occurrence on day 1
    const skipped = await TaskService.skipOccurrence(userId, occDay1!.id);
    expect(skipped).toBe(true);

    // 3. Re-query day 1 — should NOT resurrect because day 1 is in parent recurrence_exceptions
    const day1TasksAfterSkip = await TaskService.getTasks(userId, day1);
    expect(day1TasksAfterSkip.some(t => t.parent_task_id === dailyTemplate.id && t.due_date === day1)).toBe(false);

    // 4. Query day 2 — day 2 should still instantiate normally
    const day2Tasks = await TaskService.getTasks(userId, day2);
    expect(day2Tasks.some(t => t.parent_task_id === dailyTemplate.id && t.due_date === day2)).toBe(true);
  });

  it('resets today routine cleanly with resetDailyRoutine', async () => {
    const userId = `reset-routine-user-${Date.now()}`;
    const today = dateKey();

    // 1. First add starter routine
    await TaskService.addStarterRoutine(userId, today);
    const initialTasks = await TaskService.getTasks(userId, today);
    expect(initialTasks.length).toBeGreaterThan(0);

    // 2. Add an obsolete routine task
    const customTask: Task = {
      id: `old-routine-${Date.now()}`,
      user_id: userId,
      title: 'Obsolete Routine Task',
      status: 'todo',
      priority: 'low',
      due_date: today,
      category: 'routine',
      version: 1,
      created_at: now,
      updated_at: now,
    };
    await SyncEngine.saveLocalItem('tasks', customTask);

    // 3. Reset daily routine
    const resetTasks = await TaskService.resetDailyRoutine(userId, today);
    expect(resetTasks.some(t => t.id === customTask.id)).toBe(false);
    expect(resetTasks.some(t => t.title.includes('Wake Up'))).toBe(true);
  });
});




