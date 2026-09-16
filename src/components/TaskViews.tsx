import React, { useState } from 'react';
import { List, LayoutGrid, Calendar as CalendarIcon, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '../types';

interface TaskViewsProps {
  tasks: Task[];
  onToggleTask: (taskId: string, currentStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskViews: React.FC<TaskViewsProps> = ({ tasks, onToggleTask, onDeleteTask }) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* View Switcher Header */}
      <div className="glass-panel" style={{ padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Task Management & Views</h2>
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
          <button
            className={viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            onClick={() => setViewMode('list')}
          >
            <List size={16} /> List View
          </button>
          <button
            className={viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={16} /> Kanban Board
          </button>
          <button
            className={viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon size={16} /> Calendar
          </button>
        </div>
      </div>

      {/* Render View Mode */}
      {viewMode === 'list' && (
        <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {tasks.map(task => (
            <div key={task.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <button onClick={() => onToggleTask(task.id, task.status)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  {task.status === 'completed' ? <CheckCircle2 size={20} color="var(--accent-success)" /> : <Circle size={20} color="var(--text-muted)" />}
                </button>
                <span className={task.status === 'completed' ? 'task-completed-text' : ''}>{task.title}</span>
              </div>
              <button onClick={() => onDeleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>
                <Trash2 size={16} color="var(--accent-danger)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* To Do Column */}
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem', color: 'var(--accent-primary)' }}>To Do ({todoTasks.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {todoTasks.map(t => (
                <div key={t.id} className="glass-card" style={{ padding: '0.8rem' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t.title}</p>
                  <button onClick={() => onToggleTask(t.id, t.status)} className="btn-secondary" style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    Mark Completed
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem', color: 'var(--accent-success)' }}>Completed ({completedTasks.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {completedTasks.map(t => (
                <div key={t.id} className="glass-card" style={{ padding: '0.8rem' }}>
                  <p className="task-completed-text" style={{ fontSize: '0.9rem' }}>{t.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CalendarIcon size={40} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h3>Interactive Calendar View</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Tasks are displayed on their scheduled start and due dates across the month.</p>
        </div>
      )}
    </div>
  );
};

