// oxlint-disable react/set-state-in-effect, react-hooks/exhaustive-deps
import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Plus, Check, Trash2, Activity, Calendar, Archive, ArchiveRestore } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HabitService } from '../services/habitService';
import { getLocalDateString, addLocalDays } from '../services/dateUtils';
import type { Habit } from '../types';

interface HabitsViewProps {
  userId: string;
}

export const HabitsView: React.FC<HabitsViewProps> = ({ userId }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [newHabitTarget, setNewHabitTarget] = useState<number>(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const todayStr = getLocalDateString();

  // Compute past 7 days dates array using local arithmetic
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    return addLocalDays(todayStr, -(6 - i));
  });

  const dayLetters = last7Days.map(dateStr => {
    const d = new Date(dateStr + 'T12:00:00'); // noon local time avoids DST edge cases
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  });

  const loadHabits = async () => {
    setLoading(true);
    try {
      const data = await HabitService.getHabits(userId, showArchived);
      setHabits(data);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, [userId, showArchived]);

  const handleToggleHabit = async (habitId: string, targetDate: string) => {
    const added = await HabitService.toggleHabitForDate(userId, habitId, targetDate);
    if (added && targetDate === todayStr) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
    await loadHabits();
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    await HabitService.createHabit(userId, newHabitName.trim(), newHabitFrequency, newHabitTarget);
    setNewHabitName('');
    setNewHabitFrequency('daily');
    setNewHabitTarget(1);
    setShowAddForm(false);
    await loadHabits();
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (window.confirm('Permanently delete this habit?')) {
      await HabitService.deleteHabit(userId, habitId);
      await loadHabits();
    }
  };

  const handleArchiveHabit = async (habitId: string) => {
    await HabitService.archiveHabit(userId, habitId);
    await loadHabits();
  };

  const handleUnarchiveHabit = async (habitId: string) => {
    await HabitService.unarchiveHabit(userId, habitId);
    await loadHabits();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--accent-gradient-success)', padding: '0.6rem', borderRadius: '10px', display: 'flex' }}>
            <Activity size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Habits & Daily Consistency</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Non-negotiable daily standards, 7-day consistency dots & streaks
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem', gap: '0.35rem' }}
          >
            {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            <span>{showArchived ? 'Show Active' : 'Show Archived'}</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', gap: '0.4rem' }}
          >
            <Plus size={16} />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Add Habit Inline Form */}
      {showAddForm && (
        <form onSubmit={handleCreateHabit} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Habit name (e.g. 3L Water, 15m Reading, Cold Shower)..."
            value={newHabitName}
            onChange={e => setNewHabitName(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 0.9rem',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem',
            }}
            autoFocus
          />

          <select
            value={newHabitFrequency === 'daily' ? 'daily' : `weekly-${newHabitTarget}`}
            onChange={e => {
              const val = e.target.value;
              if (val === 'daily') {
                setNewHabitFrequency('daily');
                setNewHabitTarget(1);
              } else {
                const count = Number(val.replace('weekly-', '')) || 3;
                setNewHabitFrequency('weekly');
                setNewHabitTarget(count);
              }
            }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 0.8rem',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.85rem',
            }}
          >
            <option value="daily">Every day (Daily)</option>
            <option value="weekly-3">3x / week</option>
            <option value="weekly-4">4x / week</option>
            <option value="weekly-5">5x / week</option>
          </select>

          <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
            Save Habit
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="btn-secondary"
            style={{ padding: '0.6rem 1rem' }}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Habits List */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading habits & streaks...
          </div>
        ) : habits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Calendar size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>No habits tracked yet. Click "+ New Habit" to begin!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {habits.map(habit => {
              const logs = habit.logs || [];
              const isTodayCompleted = logs.some(l => l.completed_date === todayStr);

              return (
                <div
                  key={habit.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.1rem',
                    borderLeft: `4px solid ${isTodayCompleted ? 'var(--accent-success)' : 'var(--accent-primary)'}`,
                    flexWrap: 'wrap',
                    gap: '0.8rem',
                  }}
                >
                  {/* Habit Info & Streaks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {habit.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '4px',
                          background: 'rgba(20, 184, 166, 0.15)',
                          color: '#2dd4bf',
                          border: '1px solid rgba(20, 184, 166, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        {habit.frequency === 'weekly' ? `${habit.target_count_per_period}x / wk` : 'Daily'}
                      </span>
                      {habit.archived_at && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          (Archived)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span
                        className="streak-badge"
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          background: habit.current_streak > 0 ? 'var(--accent-gradient-warning)' : 'rgba(148, 163, 184, 0.2)',
                          color: '#fff',
                        }}
                      >
                        <Flame size={12} color="#fff" />
                        <span>{habit.current_streak} Day Streak</span>
                      </span>

                      {habit.longest_streak > 0 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Trophy size={12} color="#f59e0b" /> Best: {habit.longest_streak}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 7-Day Consistency Matrix & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', maxWidth: '100%', overflowX: 'auto', padding: '0.2rem 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        {dayLetters.map((label, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: '28px',
                              textAlign: 'center',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: last7Days[idx] === todayStr ? 'var(--accent-primary)' : 'var(--text-muted)',
                            }}
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        {last7Days.map(dateStr => {
                          const completed = logs.some(l => l.completed_date === dateStr);
                          const isDateToday = dateStr === todayStr;

                          return (
                            <button
                              key={dateStr}
                              onClick={() => handleToggleHabit(habit.id, dateStr)}
                              title={`${dateStr}: ${completed ? 'Completed (Click to undo)' : 'Not done (Click to mark done)'}`}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                border: isDateToday
                                  ? '2px solid var(--accent-primary)'
                                  : '1px solid var(--border-glass)',
                                background: completed
                                  ? 'var(--accent-gradient-success)'
                                  : 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                padding: 0,
                                flexShrink: 0,
                              }}
                            >
                              {completed && <Check size={14} color="#fff" strokeWidth={3} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Archive / Unarchive Button */}
                    <button
                      onClick={() => habit.archived_at ? handleUnarchiveHabit(habit.id) : handleArchiveHabit(habit.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, padding: '0.3rem', flexShrink: 0 }}
                      title={habit.archived_at ? 'Restore habit to active' : 'Archive habit'}
                    >
                      {habit.archived_at ? (
                        <ArchiveRestore size={16} color="var(--accent-primary)" />
                      ) : (
                        <Archive size={16} color="var(--text-muted)" />
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '0.3rem', flexShrink: 0 }}
                      title="Permanently delete habit"
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
    </div>
  );
};
