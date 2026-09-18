import React, { useState, useMemo, useEffect } from 'react';
import {
  List,
  LayoutGrid,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type { Task, TaskStatus, Priority } from '../types';
import { getLocalDateString } from '../services/dateUtils';
import { TaskService } from '../services/taskService';

interface TaskViewsProps {
  tasks: Task[];
  userId?: string;
  onToggleTask: (taskId: string, currentStatus: TaskStatus) => void;
  onSetTaskStatus?: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onSelectDate?: (date: string) => void;
}

export const TaskViews: React.FC<TaskViewsProps> = ({
  tasks,
  userId,
  onToggleTask,
  onSetTaskStatus,
  onDeleteTask,
  onEditTask,
  onSelectDate,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [calendarMode, setCalendarMode] = useState<'grid' | 'agenda'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Month navigation for Calendar View
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, statusFilter, categoryFilter]);

  // Priority badge styling
  const getPriorityBadge = (p?: Priority) => {
    switch (p) {
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)', text: 'Critical' };
      case 'high':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-warning)', text: 'High' };
      case 'low':
        return { bg: 'rgba(148, 163, 184, 0.2)', color: 'var(--text-muted)', text: 'Low' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', text: 'Medium' };
    }
  };

  // Calendar calculations
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Day of week for first day (0=Sun, 1=Mon, ..., 6=Sat). We map Mon=0 ... Sun=6
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = getLocalDateString();

    // Previous month padding
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to reach 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month, startingDayIndex, daysInMonth, daysInPrevMonth]);

  const [monthTasks, setMonthTasks] = useState<Task[]>([]);

  // Load all tasks for the visible month when calendar view is selected
  useEffect(() => {
    if (viewMode !== 'calendar' || !userId) return;
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    TaskService.getTasksForDateRange(userId, startStr, endStr)
      .then(fetched => setMonthTasks(fetched))
      .catch(err => console.warn('Failed loading month tasks:', err));
  }, [viewMode, currentCalendarDate, userId, year, month, tasks]);

  // Map tasks to dates (uses full month when in calendar view, or passed tasks)
  const activeCalendarTasks = viewMode === 'calendar' && monthTasks.length > 0 ? monthTasks : tasks;
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    activeCalendarTasks.forEach(t => {
      const d = t.due_date;
      if (d) {
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(t);
      }
    });
    return map;
  }, [activeCalendarTasks]);

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const blockedTasks = filteredTasks.filter(t => t.status === 'blocked');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* View Switcher & Control Header */}
      <div className="glass-panel" style={{ padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Task Center & Views</h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            List, Kanban, and Month Calendar Grid • {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
          <button
            className={viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', gap: '0.3rem' }}
            onClick={() => setViewMode('list')}
          >
            <List size={16} /> <span className="hide-on-mobile">List </span>View
          </button>
          <button
            className={viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', gap: '0.3rem' }}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={16} /> <span className="hide-on-mobile">Kanban </span>Board
          </button>
          <button
            className={viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', gap: '0.3rem' }}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon size={16} /> <span className="hide-on-mobile">Calendar </span>Grid
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '0.8rem 1.2rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search tasks by name or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.8rem 0.5rem 2.2rem',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          aria-label="Filter by priority"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}
        >
          <option value="all">All Categories</option>
          <option value="routine">Routine</option>
          <option value="work">Work Shift</option>
          <option value="learning">Tech Learning</option>
          <option value="fitness">Fitness</option>
          <option value="cooking">Cooking</option>
          <option value="leisure">Leisure</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* 1. LIST VIEW */}
      {viewMode === 'list' && (
        <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <p>No tasks match your search and filter criteria.</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const isCompleted = task.status === 'completed';
              const pBadge = getPriorityBadge(task.priority);

              return (
                <div
                  key={task.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.8rem 1rem',
                    background: isCompleted ? 'rgba(30, 41, 59, 0.3)' : 'var(--bg-glass-card)',
                    borderLeft: `4px solid ${pBadge.color}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => onToggleTask(task.id, task.status)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title={isCompleted ? 'Mark pending' : 'Mark done'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={22} color="var(--accent-success)" />
                      ) : (
                        <Circle size={22} color="var(--text-muted)" />
                      )}
                    </button>

                    <div
                      onClick={() => onEditTask?.(task)}
                      style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1, minWidth: 0 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className={isCompleted ? 'task-completed-text' : ''} style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                          {task.title}
                        </span>

                        <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: pBadge.bg, color: pBadge.color, fontWeight: 700, textTransform: 'uppercase' }}>
                          {pBadge.text}
                        </span>

                        {task.category && (
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {task.category}
                          </span>
                        )}

                        {task.subtasks && task.subtasks.length > 0 && (
                          <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                            ☑️ {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        {task.due_date && <span>📅 Due: {task.due_date}</span>}
                        {task.scheduled_start && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={12} /> {task.scheduled_start}
                          </span>
                        )}
                        {task.description && (
                          <span style={{ maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {onEditTask && (
                      <button
                        onClick={() => onEditTask(task)}
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit task"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: '0.2rem' }}
                      title="Delete task"
                    >
                      <Trash2 size={16} color="var(--accent-danger)" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* To Do Column */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)' }}>To Do ({todoTasks.length})</h3>
              <span className="streak-badge" style={{ fontSize: '0.7rem' }}>Pending</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {todoTasks.map(t => {
                const pBadge = getPriorityBadge(t.priority);
                return (
                  <div key={t.id} className="glass-card" style={{ padding: '0.8rem', borderLeft: `3px solid ${pBadge.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, flex: 1, paddingRight: '0.4rem' }}>{t.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: pBadge.bg, color: pBadge.color, fontWeight: 700 }}>
                          {pBadge.text}
                        </span>
                        {onEditTask && (
                          <button
                            type="button"
                            onClick={() => onEditTask(t)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            title="Edit task"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteTask(t.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '2px' }}
                          title="Delete task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {t.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.3rem 0' }}>{t.description}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.due_date || 'Today'}</span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          onClick={() => (onSetTaskStatus ? onSetTaskStatus(t.id, 'blocked') : onToggleTask(t.id, 'blocked'))}
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#ef4444' }}
                          title="Mark as blocked"
                        >
                          Block
                        </button>
                        <button
                          onClick={() => (onSetTaskStatus ? onSetTaskStatus(t.id, 'in_progress') : onToggleTask(t.id, t.status))}
                          className="btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', gap: '0.2rem' }}
                        >
                          Start <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-warning)' }}>In Progress ({inProgressTasks.length})</h3>
              <span className="streak-badge" style={{ background: 'var(--accent-warning)', fontSize: '0.7rem' }}>Active</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {inProgressTasks.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No active tasks</p>
              ) : (
                inProgressTasks.map(t => {
                  const pBadge = getPriorityBadge(t.priority);
                  return (
                    <div key={t.id} className="glass-card" style={{ padding: '0.8rem', borderLeft: `3px solid ${pBadge.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, flex: 1, paddingRight: '0.4rem' }}>{t.title}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: pBadge.bg, color: pBadge.color, fontWeight: 700 }}>
                            {pBadge.text}
                          </span>
                          {onEditTask && (
                            <button
                              type="button"
                              onClick={() => onEditTask(t)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              title="Edit task"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteTask(t.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '2px' }}
                            title="Delete task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            onClick={() => (onSetTaskStatus ? onSetTaskStatus(t.id, 'todo') : onToggleTask(t.id, 'todo'))}
                            className="btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', gap: '0.2rem' }}
                          >
                            <ArrowLeft size={11} /> Back
                          </button>
                          <button
                            onClick={() => (onSetTaskStatus ? onSetTaskStatus(t.id, 'blocked') : onToggleTask(t.id, 'blocked'))}
                            className="btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', color: '#ef4444' }}
                          >
                            Block
                          </button>
                        </div>
                        <button
                          onClick={() => (onSetTaskStatus ? onSetTaskStatus(t.id, 'completed') : onToggleTask(t.id, 'in_progress'))}
                          className="btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: 'var(--accent-gradient-success)', gap: '0.2rem' }}
                        >
                          Complete <CheckCircle2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Blocked Column */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-danger)' }}>Blocked ({blockedTasks.length})</h3>
              <span className="streak-badge" style={{ background: 'var(--accent-danger)', fontSize: '0.7rem' }}>Blocked</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {blockedTasks.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No blocked tasks</p>
              ) : (
                blockedTasks.map(t => {
                  const pBadge = getPriorityBadge(t.priority);
                  return (
                    <div key={t.id} className="glass-card" style={{ padding: '0.8rem', borderLeft: `3px solid var(--accent-danger)` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, flex: 1, paddingRight: '0.4rem' }}>{t.title}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: pBadge.bg, color: pBadge.color, fontWeight: 700 }}>
                            {pBadge.text}
                          </span>
                          {onEditTask && (
                            <button
                              type="button"
                              onClick={() => onEditTask(t)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              title="Edit task"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteTask(t.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '2px' }}
                            title="Delete task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <button
                          onClick={() => (onSetTaskStatus ? onSetTaskStatus(t.id, 'todo') : onToggleTask(t.id, 'todo'))}
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                        >
                          To Do
                        </button>
                        <button
                          onClick={() => (onSetTaskStatus ? onSetTaskStatus(t.id, 'in_progress') : onToggleTask(t.id, 'blocked'))}
                          className="btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                        >
                          Unblock → Work
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-success)' }}>Completed ({completedTasks.length})</h3>
              <span className="streak-badge" style={{ background: 'var(--accent-success)', fontSize: '0.7rem' }}>Done</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {completedTasks.map(t => (
                <div key={t.id} className="glass-card" style={{ padding: '0.8rem', background: 'rgba(30, 41, 59, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="task-completed-text" style={{ fontSize: '0.9rem', flex: 1 }}>{t.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <button
                        onClick={() => (onSetTaskStatus ? onSetTaskStatus(t.id, 'todo') : onToggleTask(t.id, t.status))}
                        className="btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', gap: '0.2rem' }}
                        title="Reopen task"
                      >
                        Reopen
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(t.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '2px' }}
                        title="Delete task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE MONTH CALENDAR GRID */}
      {viewMode === 'calendar' && (
        <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Calendar Header with Month Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {monthNames[month]} {year}
              </h3>
              <button
                className="btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setCurrentCalendarDate(new Date())}
              >
                Current Month
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                <button
                  type="button"
                  className={calendarMode === 'grid' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                  onClick={() => setCalendarMode('grid')}
                >
                  Grid
                </button>
                <button
                  type="button"
                  className={calendarMode === 'agenda' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                  onClick={() => setCalendarMode('agenda')}
                >
                  Agenda
                </button>
              </div>
              <button
                className="btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setCurrentCalendarDate(new Date())}
              >
                Today
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.35rem 0.7rem' }}
                onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.35rem 0.7rem' }}
                onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                aria-label="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {calendarMode === 'grid' ? (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', paddingBottom: '0.5rem' }}>
              <div style={{ minWidth: '460px' }}>
                {/* Weekday Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-glass)' }}>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>

                {/* Days Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginTop: '0.5rem' }}>
                  {calendarDays.map((cell, idx) => {
                    const dayTasks = tasksByDate.get(cell.dateStr) || [];
                    const completedCount = dayTasks.filter(t => t.status === 'completed').length;
                    const allDone = dayTasks.length > 0 && completedCount === dayTasks.length;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => onSelectDate?.(cell.dateStr)}
                        style={{
                          minHeight: '88px',
                          padding: '0.4rem',
                          background: cell.isToday
                            ? 'rgba(59, 130, 246, 0.15)'
                            : cell.isCurrentMonth
                            ? 'var(--bg-glass-card)'
                            : 'rgba(15, 23, 42, 0.3)',
                          border: cell.isToday
                            ? '1px solid var(--accent-primary)'
                            : '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-sm)',
                          opacity: cell.isCurrentMonth ? 1 : 0.45,
                          cursor: onSelectDate ? 'pointer' : 'default',
                          display: 'flex',
                          flexDirection: 'column',
                          textAlign: 'left',
                          width: '100%',
                          gap: '0.3rem',
                          overflow: 'hidden',
                          color: 'inherit',
                        }}
                        title={`Open schedule & tasks for ${cell.dateStr}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: cell.isToday ? 800 : 600,
                              color: cell.isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                            }}
                          >
                            {cell.dayNumber}
                          </span>
                          {dayTasks.length > 0 && (
                            <span
                              style={{
                                fontSize: '0.62rem',
                                padding: '1px 5px',
                                borderRadius: '8px',
                                background: allDone ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.2)',
                                color: allDone ? 'var(--accent-success)' : 'var(--accent-primary)',
                                fontWeight: 700,
                              }}
                            >
                              {completedCount}/{dayTasks.length} {allDone ? '✓' : ''}
                            </span>
                          )}
                        </div>

                        {/* Task Pills on the Day */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', width: '100%' }}>
                          {dayTasks.slice(0, 3).map(t => (
                            <div
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask?.(t);
                              }}
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                background: t.status === 'completed'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : t.priority === 'critical'
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : 'rgba(59, 130, 246, 0.2)',
                                color: t.status === 'completed' ? 'var(--accent-success)' : 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                              }}
                              title={t.title}
                            >
                              {t.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <span style={{ fontSize: '0.62rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                              +{dayTasks.length - 3} more
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {calendarDays
                .filter(cell => cell.isCurrentMonth && (tasksByDate.get(cell.dateStr) || []).length > 0)
                .map(cell => {
                  const dayTasks = tasksByDate.get(cell.dateStr) || [];
                  return (
                    <div key={cell.dateStr} className="glass-card" style={{ padding: '0.8rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: cell.isToday ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            {cell.dateStr} {cell.isToday && '(Today)'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectDate?.(cell.dateStr)}
                          className="btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                        >
                          Open in Today Engine →
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {dayTasks.map(t => (
                          <div
                            key={t.id}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.3rem 0' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                              <button
                                type="button"
                                onClick={() => onToggleTask(t.id, t.status)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                {t.status === 'completed' ? <CheckCircle2 size={16} color="var(--accent-success)" /> : <Circle size={16} color="var(--text-muted)" />}
                              </button>
                              <span className={t.status === 'completed' ? 'task-completed-text' : ''} style={{ fontWeight: 500 }}>
                                {t.title}
                              </span>
                              {t.scheduled_start && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  ({t.scheduled_start})
                                </span>
                              )}
                            </div>
                            {onEditTask && (
                              <button
                                type="button"
                                onClick={() => onEditTask(t)}
                                className="btn-secondary"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem' }}
                              >
                                <Edit3 size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              {calendarDays.filter(cell => cell.isCurrentMonth && (tasksByDate.get(cell.dateStr) || []).length > 0).length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No tasks scheduled for this month yet. Click any day in Grid mode to schedule one!
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
