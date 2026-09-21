// oxlint-disable react/set-state-in-effect
import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Check } from 'lucide-react';
import type { Task, Priority } from '../types';
import { createId } from '../services/idUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (taskId: string, updates: Partial<Task>, updateSeries?: boolean) => void;
  onDelete: (taskId: string) => void;
  onSkipOccurrence?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  onDelete,
  onSkipOccurrence,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<any>('routine');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('FREQ=DAILY');
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; is_completed: boolean }>>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setCategory(task.category || 'general');
      setScheduledStart(task.scheduled_start || task.due_time || '');
      setScheduledEnd(task.scheduled_end || '');
      setDueDate(task.due_date || '');
      setIsRecurring(Boolean(task.is_recurring || task.parent_task_id));
      setRecurrenceRule(task.recurrence_rule || 'FREQ=DAILY');
      setApplyToSeries(false);
      setSubtasks(task.subtasks?.map(s => ({ id: s.id, title: s.title, is_completed: s.is_completed })) || []);
    }
  }, [task]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      task.id,
      {
        title,
        description,
        priority,
        category,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        due_time: scheduledStart,
        due_date: dueDate || undefined,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : undefined,
        subtasks: subtasks.map((s, idx) => ({
          id: s.id,
          task_id: task.id,
          user_id: task.user_id,
          title: s.title,
          is_completed: s.is_completed,
          position: idx,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      },
      applyToSeries
    );
    onClose();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [...prev, { id: createId(), title: newSubtask.trim(), is_completed: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, is_completed: !s.is_completed } : s));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const completedSubtasks = subtasks.filter(s => s.is_completed).length;

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-modal-title"
        className="glass-panel"
        style={{ width: '100%', maxWidth: '520px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>✏️</span>
            <h3 id="edit-task-modal-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Edit Task & Custom Schedule</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.7rem', color: 'var(--text-primary)', outline: 'none' }}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Notes / Recipe / Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add guidance, recipes, or details..."
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.7rem', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Date & Times */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.6rem', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Start Time
              </label>
              <input
                type="time"
                value={scheduledStart}
                onChange={e => setScheduledStart(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.6rem', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                End Time
              </label>
              <input
                type="time"
                value={scheduledEnd}
                onChange={e => setScheduledEnd(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.6rem', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.6rem', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="routine">Routine</option>
                <option value="work">Work (2-11 PM)</option>
                <option value="learning">Tech Learning</option>
                <option value="fitness">Fitness / Gym</option>
                <option value="cooking">Cooking / Meals</option>
                <option value="leisure">Leisure / Rest</option>
                <option value="errands">Errands</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.6rem', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Daily Routine / Recurrence Toggle */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '0.7rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                style={{ width: '17px', height: '17px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  🔄 Recurring Task
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  This task repeats according to your chosen schedule
                </span>
              </div>
            </label>

            {isRecurring && (
              <div style={{ marginTop: '0.6rem', paddingLeft: '1.6rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Recurrence Frequency
                </label>
                <select
                  value={recurrenceRule}
                  onChange={e => setRecurrenceRule(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                >
                  <option value="FREQ=DAILY">Every Day</option>
                  <option value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">Weekdays (Mon–Fri)</option>
                  <option value="FREQ=WEEKLY">Once a Week</option>
                </select>
              </div>
            )}
          </div>

          {/* Series Edit & Skip Occurrence (if editing an occurrence or parent template) */}
          {(task.parent_task_id || task.is_recurring) && (
            <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 'var(--radius-sm)', padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                🔁 Recurring Occurrence Options
              </div>
              {task.parent_task_id && (
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="seriesScope"
                      checked={!applyToSeries}
                      onChange={() => setApplyToSeries(false)}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    This day only
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="seriesScope"
                      checked={applyToSeries}
                      onChange={() => setApplyToSeries(true)}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    All occurrences (entire series)
                  </label>
                </div>
              )}
              {task.parent_task_id && onSkipOccurrence && (
                <button
                  type="button"
                  onClick={() => {
                    onSkipOccurrence(task.id);
                    onClose();
                  }}
                  className="btn-secondary"
                  style={{ alignSelf: 'flex-start', fontSize: '0.75rem', padding: '0.35rem 0.7rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                >
                  ⏭️ Skip This Day Only
                </button>
              )}
            </div>
          )}

          {/* Subtasks Progress */}
          <div style={{ background: 'var(--bg-secondary)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', marginTop: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Subtasks ({completedSubtasks}/{subtasks.length})
              </span>
              {subtasks.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                  {Math.round((completedSubtasks / subtasks.length) * 100)}%
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <input
                type="text"
                placeholder="Add a subtask (e.g. Revise Pods, Chop vegetables)..."
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}
              />
              <button type="button" onClick={handleAddSubtask} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {subtasks.map(s => (
                <div
                  key={s.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.3rem 0' }}
                >
                  <div
                    onClick={() => toggleSubtask(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                  >
                    <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.is_completed ? 'var(--accent-primary)' : 'transparent', flexShrink: 0 }}>
                      {s.is_completed && <Check size={12} color="#fff" />}
                    </div>
                    <span className={s.is_completed ? 'task-completed-text' : ''}>{s.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSubtask(s.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 6px' }}
                    title="Delete subtask"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
            <button
              type="button"
              onClick={() => { onDelete(task.id); onClose(); }}
              className="btn-secondary"
              style={{ color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <Trash2 size={16} /> Delete
            </button>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
