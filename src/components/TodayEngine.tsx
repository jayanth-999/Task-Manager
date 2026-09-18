import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  AlertCircle,
  ShoppingCart,
  RotateCcw,
  Plus,
  Edit3,
  Dumbbell,
  Moon,
  Trash2,
  ArrowRight,
  Compass,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RoadmapService } from '../services/roadmapService';
import { getLocalDateString, formatLocalDate, addLocalDays } from '../services/dateUtils';
import { getPreferences } from '../services/userPreferences';
import { formatTimeLabel } from '../services/taskService';
import type { Task, TaskStatus, Roadmap, RoadmapPhase, RoadmapMilestone } from '../types';

interface TodayEngineProps {
  tasks: Task[];
  userId: string;
  onToggleTask: (taskId: string, currentStatus: TaskStatus) => void;
  onAddTask: (taskPartial: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveToNextDay: (taskId: string) => void;
  onResetRoutine: () => void;
  onRolloverOverdue?: () => void;
  onNavigateTab: (tab: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const TodayEngine: React.FC<TodayEngineProps> = ({
  tasks,
  userId,
  onToggleTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveToNextDay,
  onResetRoutine,
  onRolloverOverdue,
  onNavigateTab,
  selectedDate,
  onDateChange,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [isCompletedOpen, setIsCompletedOpen] = useState<boolean>(false);
  const [activeMilestoneInfo, setActiveMilestoneInfo] = useState<{
    roadmap: Roadmap;
    phase: RoadmapPhase;
    milestone: RoadmapMilestone;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load current active roadmap milestone
  useEffect(() => {
    RoadmapService.getActiveMilestone(userId).then(setActiveMilestoneInfo);
  }, [userId, tasks]);

  const handleTaskCheck = (taskId: string, currentStatus: TaskStatus) => {
    if (currentStatus !== 'completed') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
    onToggleTask(taskId, currentStatus);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask({
      title: quickTitle.trim(),
      due_date: selectedDate,
      category: 'general',
      priority: 'medium',
    });
    setQuickTitle('');
  };

  const todayStr = getLocalDateString();
  const isToday = selectedDate === todayStr;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const rolledOverTasks = tasks.filter(t => t.is_rolled_over);

  const prefs = getPreferences();
  const workStart = prefs.workStart || '14:00';
  const workEnd = prefs.workEnd || '23:00';

  // Determine the single "Next Up" task for today with 5-tier dynamic priority
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived' && t.status !== 'trash');
  const nextUpTask = isToday
    ? (
      // Tier 1: In progress task
      activeTasks.find(t => t.status === 'in_progress') ??
      // Tier 2: Currently happening now in time window
      activeTasks.find(t => t.scheduled_start && t.scheduled_end && t.scheduled_start <= currentTime && currentTime <= t.scheduled_end) ??
      // Tier 3: Next upcoming today
      activeTasks
        .filter(t => t.scheduled_start && t.scheduled_start >= currentTime)
        .sort((a, b) => a.scheduled_start!.localeCompare(b.scheduled_start!))[0] ??
      // Tier 4: Rolled over
      activeTasks.find(t => t.is_rolled_over) ??
      // Tier 5: Earliest scheduled
      activeTasks.sort((a, b) => (a.scheduled_start ?? '99:99').localeCompare(b.scheduled_start ?? '99:99'))[0] ??
      null
    )
    : null;

  const isHappeningNow = Boolean(
    nextUpTask?.scheduled_start &&
    nextUpTask?.scheduled_end &&
    nextUpTask.scheduled_start <= currentTime &&
    currentTime <= nextUpTask.scheduled_end
  );

  const filteredTasks = tasks.filter(t => {
    if (hideCompleted && t.status === 'completed') return false;
    if (activeCategoryFilter === 'all') return true;
    return t.category === activeCategoryFilter;
  });

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'routine', label: '🌅 Routine' },
    { id: 'work', label: '🏢 Work Shift' },
    { id: 'learning', label: '🤖 Tech Learning' },
    { id: 'fitness', label: '🏋️‍♂️ Fitness' },
    { id: 'cooking', label: '🥗 Cooking' },
    { id: 'leisure', label: '🎮 Leisure' },
  ];

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'routine': return 'rgba(245, 158, 11, 0.2)';
      case 'work': return 'rgba(59, 130, 246, 0.2)';
      case 'learning': return 'rgba(139, 92, 246, 0.2)';
      case 'fitness': return 'rgba(16, 185, 129, 0.2)';
      case 'cooking': return 'rgba(236, 72, 153, 0.2)';
      case 'leisure': return 'rgba(14, 165, 233, 0.2)';
      default: return 'rgba(148, 163, 184, 0.2)';
    }
  };

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Date Switcher & Progress Summary Panel */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Calendar size={22} color="var(--accent-primary)" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {isToday ? "Today's Schedule & Action Engine" : `Schedule for ${formatLocalDate(selectedDate)}`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {isToday ? 'Live Day Timeline' : 'Historical / Future Day View'}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  🏢 Shift: {formatTimeLabel(workStart)} – {formatTimeLabel(workEnd)}
                </span>
              </div>
            </div>
          </div>

            {/* Date Controls & Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              aria-label="Select Date"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <button
              className="btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              onClick={() => onDateChange(addLocalDays(selectedDate, -1))}
            >
              ← Prev
            </button>
            <button
              className={isToday ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              onClick={() => onDateChange(todayStr)}
            >
              Today
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              onClick={() => onDateChange(addLocalDays(selectedDate, 1))}
            >
              Next →
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', gap: '0.3rem' }}
              onClick={onResetRoutine}
              title="Re-populate today's default routine tasks"
            >
              <RotateCcw size={13} />
              Reset Routine
            </button>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Completed <strong>{completedTasks}</strong> of <strong>{totalTasks}</strong> routine & daily actions
            </span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{progressPercent}% Done</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--accent-gradient-success)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Rolled over alert & Overdue counter */}
        {rolledOverTasks.length > 0 && isToday && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.8rem', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>📥</span>
              <span><strong>{rolledOverTasks.length}</strong> {rolledOverTasks.length === 1 ? 'task was' : 'tasks were'} rolled over from previous days</span>
            </span>
            {onRolloverOverdue && (
              <button
                type="button"
                onClick={onRolloverOverdue}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#f59e0b' }}
              >
                🔄 Reschedule Any Incomplete Tasks
              </button>
            )}
          </div>
        )}
      </div>

      {/* ⚡ Next Up — Dynamic best-next-action card (Today only, when tasks exist) */}
      {nextUpTask && (
        <div
          className="glass-card"
          style={{
            borderLeft: isHappeningNow ? '4px solid var(--accent-success)' : '4px solid var(--accent-primary)',
            background: isHappeningNow
              ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(59,130,246,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.06) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
            <div style={{ background: isHappeningNow ? 'var(--accent-gradient-success)' : 'var(--accent-gradient)', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexShrink: 0 }}>
              <Zap size={20} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: isHappeningNow ? 'var(--accent-success)' : 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {nextUpTask.status === 'in_progress' ? '🔥 In Progress' : isHappeningNow ? '🟢 Happening Now' : '⚡ Next Up'}
                </span>
                {nextUpTask.is_rolled_over && <span style={{ fontSize: '0.7rem', color: 'var(--accent-warning)', fontWeight: 600 }}>• Rolled over</span>}
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nextUpTask.title}
              </h4>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                {nextUpTask.scheduled_start && (
                  <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: isHappeningNow ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.15)', color: isHappeningNow ? 'var(--accent-success)' : 'var(--text-muted)', fontWeight: isHappeningNow ? 600 : 400 }}>
                    🕐 {formatTimeLabel(nextUpTask.scheduled_start)}{nextUpTask.scheduled_end ? ` – ${formatTimeLabel(nextUpTask.scheduled_end)}` : ''}
                  </span>
                )}
                {nextUpTask.category && (
                  <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(148,163,184,0.15)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {nextUpTask.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
            <button
              onClick={() => onNavigateTab('focus')}
              className="btn-primary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', gap: '0.3rem' }}
            >
              <Zap size={13} /> Start Focus
            </button>
            <button
              onClick={() => handleTaskCheck(nextUpTask.id, nextUpTask.status)}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', gap: '0.3rem', color: 'var(--accent-success)' }}
            >
              <CheckCircle2 size={13} /> Done
            </button>
            <button
              onClick={() => onMoveToNextDay(nextUpTask.id)}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', gap: '0.3rem' }}
              title="Move to next day"
            >
              <ArrowRight size={13} /> Move
            </button>
            <button
              onClick={() => onEditTask(nextUpTask)}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', gap: '0.3rem' }}
              title="Edit task details"
            >
              <Edit3 size={13} /> Edit
            </button>
          </div>
        </div>
      )}

      {/* Empty state — when no tasks exist today, show a friendly CTA instead of 0 of 0 */}
      {totalTasks === 0 && isToday && (
        <div
          className="glass-panel"
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.2rem',
          }}
        >
          <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>🎯</div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.4rem' }}>Your day is a blank canvas</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px' }}>
              Add your first task to get started, or load a starter routine to see how Apex organises your day.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('[data-quickadd]');
                input?.focus();
              }}
              className="btn-primary"
              style={{ gap: '0.4rem', padding: '0.7rem 1.4rem' }}
            >
              <Plus size={16} /> Add your first task
            </button>
            <button
              onClick={onResetRoutine}
              className="btn-secondary"
              style={{ gap: '0.4rem', padding: '0.7rem 1.4rem' }}
            >
              <RotateCcw size={16} /> Load starter routine
            </button>
          </div>
        </div>
      )}

      {/* Active Roadmap Target Banner (Connecting Goals to Today) */}
      {activeMilestoneInfo && (
        <div
          className="glass-card"
          style={{
            borderLeft: '4px solid var(--accent-secondary)',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
              <Compass size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Active Career Roadmap Focus • {activeMilestoneInfo.roadmap.title}
                </span>
                <span className="streak-badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                  {activeMilestoneInfo.phase.title}
                </span>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                🎯 {activeMilestoneInfo.milestone.title}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                This is your current skill milestone. Complete today's learning action to advance your 4-month career target!
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('roadmaps')}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
          >
            View Full Roadmap →
          </button>
        </div>
      )}

      {/* Auto-Rollover Alert Banner (When uncompleted tasks move right) */}
      {rolledOverTasks.length > 0 && (
        <div
          className="glass-card"
          style={{
            borderLeft: '4px solid var(--accent-warning)',
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <RotateCcw size={20} color="var(--accent-warning)" />
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-warning)' }}>
                {rolledOverTasks.length} Unfinished Task{rolledOverTasks.length > 1 ? 's' : ''} Rolled Over ("Moved Right")
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Uncompleted tasks from previous days have automatically moved to today's schedule so you never lose momentum.
              </p>
            </div>
          </div>
          <span className="streak-badge" style={{ background: 'var(--accent-warning)', fontSize: '0.75rem' }}>
            Auto-Rollover Active
          </span>
        </div>
      )}

      {/* Core Shift & Routine Highlights with Interactive Quick-Jump Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.8rem' }}>
        {/* Work Shift Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Office Shift + Commute
            </span>
            <Clock size={16} color="var(--accent-primary)" />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>02:00 PM – 11:00 PM</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0.6rem 0' }}>
            Includes 1:30 PM travel buffer & 11:00 PM return commute.
          </p>
          <div style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', padding: '0.4rem 0.6rem', borderRadius: '6px', color: 'var(--text-primary)' }}>
            🎯 <strong>1-Hour Tech Learning:</strong> 5:00 PM – 6:00 PM
          </div>
        </div>

        {/* 1-Hour Learning Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Skill Building (4-Mo Goal)
            </span>
            <BookOpen size={16} color="var(--accent-secondary)" />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>30m AI Agents + 30m DevOps</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0.6rem 0' }}>
            MCPs, RAG & pure Python exercises without Copilot.
          </p>
          <button
            onClick={() => onNavigateTab('learning')}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', justifyContent: 'center' }}
          >
            Open 1-Hr Learning Tracker →
          </button>
        </div>

        {/* Fitness & Workout Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)', fontWeight: 700, textTransform: 'uppercase' }}>
              Morning Fitness & Diet
            </span>
            <Dumbbell size={16} color="var(--accent-success)" />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>07:30 AM – 08:30 AM</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0.6rem 0' }}>
            Home Bodyweight or Gym Equipment + Pre/Post Diet.
          </p>
          <button
            onClick={() => onNavigateTab('fitness')}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', justifyContent: 'center' }}
          >
            View Workout & Diet Steps →
          </button>
        </div>

        {/* Sleep & Rest Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
              Rest & Recovery
            </span>
            <Moon size={16} color="#38bdf8" />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>12:00 AM – 07:00 AM</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0.6rem 0' }}>
            7 Hours dedicated sleep + 12:30 PM pre-work leisure time.
          </p>
          <button
            onClick={() => onNavigateTab('investment')}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', justifyContent: 'center' }}
          >
            Morning Investment Study (10-15m) →
          </button>
        </div>
      </div>

      {/* Day-Before Grocery Shopping Alert Banner */}
      <div
        className="glass-card"
        style={{
          borderLeft: '4px solid var(--accent-warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
            <ShoppingCart size={20} color="var(--accent-warning)" />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Day-Before Grocery Alert for Tomorrow's Meals</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Buy ingredients today (Pasta, Eggs, Paneer, Spinach, Broccoli) for tomorrow's cooking schedule.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('recipes')}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
        >
          View Recipes & Grocery Checklist →
        </button>
      </div>

      {/* Category Filter Pills & Display Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const count = cat.id === 'all' ? tasks.length : tasks.filter(t => t.category === cat.id).length;
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={isActive ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={e => setHideCompleted(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Hide completed tasks
        </label>
      </div>

      {/* Interactive Daily Task & Routine Checklist */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Daily Routine & Action Checklist</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({filteredTasks.length} items shown)
            </span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            💡 Tip: Click any task or ✏️ to customize its time, subtasks & details
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ marginBottom: '0.6rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No tasks in this category.</p>
            <span style={{ fontSize: '0.8rem' }}>Add a new task below or switch filters!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {/* Active Tasks */}
            {filteredTasks.filter(t => t.status !== 'completed').map(task => {
              const timeDisplay = task.scheduled_start
                ? `${task.scheduled_start}${task.scheduled_end ? ` – ${task.scheduled_end}` : ''}`
                : task.due_time || '';

              return (
                <div
                  key={task.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.8rem 1rem',
                    background: 'var(--bg-glass-card)',
                    borderLeft: `4px solid ${
                      task.milestone_id
                        ? 'var(--accent-secondary)'
                        : task.priority === 'critical'
                        ? 'var(--accent-danger)'
                        : task.priority === 'high'
                        ? 'var(--accent-warning)'
                        : 'var(--accent-primary)'
                    }`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Left: Checkbox & Task Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => handleTaskCheck(task.id, task.status)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                      title="Mark as done"
                    >
                      <Circle size={24} color="var(--text-muted)" />
                    </button>

                    <div
                      onClick={() => onEditTask(task)}
                      style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1, minWidth: 0 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {task.title}
                        </span>

                        {/* Subtasks Progress Pill */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: 'var(--accent-primary)',
                              fontWeight: 600,
                            }}
                          >
                            ☑️ {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
                          </span>
                        )}

                        {/* Rolled over badge */}
                        {task.is_rolled_over && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.25)',
                              color: 'var(--accent-warning)',
                              fontWeight: 700,
                            }}
                            title={`Carried forward from ${task.source_date || 'previous day'}`}
                          >
                            🔄 Rolled Over
                          </span>
                        )}

                        {/* Roadmap milestone badge */}
                        {task.milestone_id && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(139, 92, 246, 0.25)',
                              color: 'var(--accent-secondary)',
                              fontWeight: 700,
                            }}
                          >
                            🎯 Roadmap Target
                          </span>
                        )}

                        {/* Category tag */}
                        {task.category && !task.milestone_id && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: getCategoryColor(task.category),
                              color: 'var(--text-primary)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {task.category}
                          </span>
                        )}
                      </div>

                      {/* Description / Time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                        {timeDisplay && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                            <Clock size={12} /> {timeDisplay}
                          </span>
                        )}
                        {task.description && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Priority, Move to Next Day, Edit & Delete Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        background:
                          task.priority === 'critical' || task.priority === 'high'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(59, 130, 246, 0.2)',
                        color:
                          task.priority === 'critical' || task.priority === 'high'
                            ? 'var(--accent-danger)'
                            : 'var(--accent-primary)',
                      }}
                    >
                      {task.priority}
                    </span>

                    {/* Move to Tomorrow Button (Move Right) */}
                    <button
                      onClick={() => onMoveToNextDay(task.id)}
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', gap: '0.2rem' }}
                      title="Move task right (to tomorrow)"
                    >
                      <ArrowRight size={13} />
                      <span className="hide-on-mobile">Move Right</span>
                    </button>

                    <button
                      onClick={() => onEditTask(task)}
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                      title="Edit task & custom time"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '0.2rem' }}
                      title="Delete task"
                    >
                      <Trash2 size={16} color="var(--accent-danger)" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Collapsible Completed Section */}
            {!hideCompleted && filteredTasks.some(t => t.status === 'completed') && (
              <div style={{ marginTop: '0.6rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0.4rem 0',
                  }}
                >
                  {isCompletedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>Completed Tasks ({filteredTasks.filter(t => t.status === 'completed').length})</span>
                </button>

                {isCompletedOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                    {filteredTasks.filter(t => t.status === 'completed').map(task => {
                      const timeDisplay = task.scheduled_start
                        ? `${task.scheduled_start}${task.scheduled_end ? ` – ${task.scheduled_end}` : ''}`
                        : task.due_time || '';

                      return (
                        <div
                          key={task.id}
                          className="glass-card"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.8rem 1rem',
                            background: 'rgba(30, 41, 59, 0.3)',
                            borderLeft: '4px solid var(--accent-success)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: 1, minWidth: 0 }}>
                            <button
                              onClick={() => handleTaskCheck(task.id, task.status)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                              title="Mark as pending"
                            >
                              <CheckCircle2 size={24} color="var(--accent-success)" />
                            </button>

                            <div
                              onClick={() => onEditTask(task)}
                              style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1, minWidth: 0 }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="task-completed-text" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                  {task.title}
                                </span>

                                {task.subtasks && task.subtasks.length > 0 && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '4px',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: 'var(--accent-success)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    ☑️ {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
                                  </span>
                                )}
                              </div>

                              {timeDisplay && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                  {timeDisplay}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                            <button
                              onClick={() => onEditTask(task)}
                              className="btn-secondary"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '0.2rem' }}
                            >
                              <Trash2 size={16} color="var(--accent-danger)" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Form at Bottom */}
      <form onSubmit={handleQuickAdd} className="glass-panel" style={{ padding: '0.8rem', display: 'flex', gap: '0.8rem' }}>
        <input
          type="text"
          data-quickadd="true"
          placeholder="Add custom task or routine item (e.g. Read 20 pages at 11:30 PM, Revise K8s networking)..."
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          style={{
            flex: 1,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.7rem 1rem',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0.7rem 1.4rem' }}>
          <Plus size={16} /> Add Action
        </button>
      </form>
    </div>
  );
};
