// oxlint-disable react/set-state-in-effect, react-hooks/exhaustive-deps
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, CheckCircle2, Circle, CalendarPlus, Trash2 } from 'lucide-react';
import { TaskService } from '../services/taskService';
import { SyncEngine } from '../services/syncEngine';
import { dateKey } from '../services/dateUtils';
import type { Task } from '../types';

interface ErrandsViewProps {
  userId?: string;
  onAddTaskToToday?: (errand: Task) => void;
}

export const ErrandsView: React.FC<ErrandsViewProps> = ({
  userId = 'guest-local-user',
  onAddTaskToToday,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [errands, setErrands] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('Supermarket');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const loadErrands = async () => {
    try {
      const allLocal = await SyncEngine.getLocalItems<Task>('tasks', userId);
      const errandTasks = allLocal.filter(t => t.category === 'errands' && !t.deleted_at);
      setErrands(errandTasks);
    } catch (e) {
      console.warn('Failed loading errands:', e);
    }
  };

  useEffect(() => {
    loadErrands();
  }, [userId]);

  const handleAddErrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = await TaskService.createTask(userId, {
      title: newTitle.trim(),
      category: 'errands',
      location: newLocation,
      status: 'todo',
      priority: 'low',
    });
    setErrands(prev => [created, ...prev]);
    setNewTitle('');
  };

  const handleToggleErrand = async (errand: Task) => {
    const newStatus = await TaskService.toggleTaskCompletion(userId, errand.id, errand.status);
    setErrands(prev => prev.map(e => e.id === errand.id ? { ...e, status: newStatus } : e));
  };

  const handleDeleteErrand = async (errandId: string) => {
    await TaskService.deleteTask(userId, errandId);
    setErrands(prev => prev.filter(e => e.id !== errandId));
  };

  const handleSendToToday = (errand: Task) => {
    if (onAddTaskToToday) {
      onAddTaskToToday(errand);
    } else {
      TaskService.createTask(userId, {
        title: errand.title,
        category: 'errands',
        location: errand.location,
        due_date: dateKey(),
        status: 'todo',
        priority: 'medium',
      });
    }
    setAddedNotice(`"${errand.title}" added to Today's schedule!`);
    setTimeout(() => setAddedNotice(null), 4000);
  };

  const locations = ['All', 'Supermarket', 'Pharmacy', 'Hardware Store', 'Office'];

  const filtered = selectedLocation === 'All'
    ? errands
    : errands.filter(e => (e.location || '').toLowerCase() === selectedLocation.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <MapPin size={22} color="var(--accent-primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Location-Based Non-Urgent Errands List</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>"When I happen to visit" non-urgent reminder checklist • Persisted across devices</span>
          </div>
        </div>
      </div>

      {addedNotice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 1rem', color: 'var(--accent-success)', fontSize: '0.85rem' }}>
          ✓ {addedNotice}
        </div>
      )}

      {/* Location Filter Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {locations.map(loc => (
          <button
            key={loc}
            onClick={() => setSelectedLocation(loc)}
            className={selectedLocation === loc ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            📍 {loc}
          </button>
        ))}
      </div>

      {/* Add New Errand */}
      <form onSubmit={handleAddErrand} className="glass-panel" style={{ padding: '0.8rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <select
          value={newLocation}
          onChange={e => setNewLocation(e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}
        >
          <option value="Supermarket">Supermarket</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Hardware Store">Hardware Store</option>
          <option value="Office">Office</option>
        </select>
        <input
          type="text"
          placeholder="Non-urgent errand (e.g., Buy extra batteries when near hardware store)..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          style={{ flex: 1, minWidth: '200px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}
        />
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Add Errand
        </button>
      </form>

      {/* Errands List */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {filtered.length === 0 && <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No errands here yet. Add your first one above.</p>}
        {filtered.map(errand => {
          const isDone = errand.status === 'completed';
          return (
            <div
              key={errand.id}
              className="glass-card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: '200px' }}>
                <button
                  type="button"
                  onClick={() => handleToggleErrand(errand)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {isDone ? <CheckCircle2 size={18} color="var(--accent-success)" /> : <Circle size={18} color="var(--text-muted)" />}
                </button>
                <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                  📍 {errand.location || 'General'}
                </span>
                <span className={isDone ? 'task-completed-text' : ''} style={{ fontSize: '0.9rem' }}>
                  {errand.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleSendToToday(errand)}
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                  title="Add this errand to today's task list"
                >
                  <CalendarPlus size={13} /> Add to Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteErrand(errand.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}
                  title="Delete errand"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
