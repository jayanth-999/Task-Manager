// oxlint-disable react/immutability, react/set-state-in-effect, react-hooks/exhaustive-deps
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Clock, Flame, Zap, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FocusService } from '../services/focusService';
import type { Task, FocusSession } from '../types';

interface FocusViewProps {
  userId: string;
  tasks: Task[];
  onToggleTask?: (taskId: string) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ userId, tasks, onToggleTask }) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [duration, setDuration] = useState<number>(25 * 60); // 25 mins in seconds
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [completedPromptTask, setCompletedPromptTask] = useState<Task | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const timerRef = useRef<number | null>(null);

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  const loadSessions = async () => {
    try {
      const data = await FocusService.getFocusSessions(userId);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load focus sessions:', err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [userId]);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleCompleteSession(duration);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, duration, mode, selectedTaskId]);

  const handleModeChange = (newMode: 'focus' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    const secs = newMode === 'focus' ? 25 * 60 : 5 * 60;
    setDuration(secs);
    setTimeLeft(secs);
  };

  const handleToggleTimer = () => {
    setIsRunning(prev => !prev);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const handleCompleteSession = async (elapsedSeconds = duration) => {
    setIsRunning(false);
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.7 } });

    if (mode === 'focus') {
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
      await FocusService.logFocusSession(userId, minutes, selectedTaskId || undefined);
      await FocusService.logFocusSession(userId, minutes, selectedTaskId || undefined, new Date(), sessionNotes);
      await loadSessions();

      if (selectedTaskId) {
        const matched = tasks.find(t => t.id === selectedTaskId);
        if (matched && matched.status !== 'completed') {
          setCompletedPromptTask(matched);
        }
      }
      setSessionNotes('');
      handleModeChange('break');
    } else {
      handleModeChange('focus');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.round(((duration - timeLeft) / duration) * 100);

  const stats = FocusService.calculateFocusStats(sessions);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.6rem', borderRadius: '10px', display: 'flex' }}>
            <Clock size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Deep Focus & Pomodoro Engine</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              25/5 interval timer linked directly to your active tasks & goals
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleModeChange('focus')}
            className={mode === 'focus' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            25m Focus
          </button>
          <button
            onClick={() => handleModeChange('break')}
            className={mode === 'break' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            5m Short Break
          </button>
        </div>
      </div>

      {/* Focus Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Zap size={22} color="var(--accent-primary)" />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today's Focus</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{stats.todayMinutes} mins</h4>
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Flame size={22} color="var(--accent-warning)" />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Past 7 Days Focus</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{Math.round(stats.weekMinutes / 60 * 10) / 10} hours</h4>
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Award size={22} color="var(--accent-success)" />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Sessions</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{stats.totalSessions} sessions</h4>
          </div>
        </div>
      </div>

      {/* Main Timer Display Panel */}
      <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        {/* Linked Task Selector */}
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            Link Focus Session to Task (Optional):
          </label>
          <select
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">-- General Unassigned Focus --</option>
            {activeTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Task Completion Prompt Banner */}
        {completedPromptTask && (
          <div
            className="glass-card"
            style={{
              maxWidth: '400px',
              width: '100%',
              borderLeft: '4px solid var(--accent-success)',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              🎉 Focus Sprint Logged! Mark "{completedPromptTask.title}" as completed?
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => {
                  if (onToggleTask) onToggleTask(completedPromptTask.id);
                  setCompletedPromptTask(null);
                }}
                className="btn-primary"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
              >
                ✓ Mark Completed
              </button>
              <button
                onClick={() => setCompletedPromptTask(null)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
              >
                Keep Open
              </button>
            </div>
          </div>
        )}

        {/* Digital Countdown Timer */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: '4.5rem',
              fontWeight: 900,
              letterSpacing: '2px',
              fontVariantNumeric: 'tabular-nums',
              color: mode === 'focus' ? 'var(--text-primary)' : 'var(--accent-success)',
            }}
          >
            {timeFormatted}
          </div>
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
          {mode === 'focus' ? '🎯 High-Performance Focus Block' : '☕ Rest & Mind Reset'}
        </span>

        {/* Session Notes Input */}
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'left' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
            Session Notes & Takeaways (Optional):
          </label>
          <textarea
            placeholder="Key accomplishments or focus notes for this sprint..."
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Timer Action Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={handleToggleTimer}
            className="btn-primary"
            style={{ padding: '0.8rem 2rem', fontSize: '1rem', gap: '0.5rem' }}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
          </button>

          <button
            onClick={handleResetTimer}
            className="btn-secondary"
            style={{ padding: '0.8rem 1.2rem', fontSize: '0.9rem' }}
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>

          {isRunning && (
            <button
              onClick={() => handleCompleteSession(duration - timeLeft)}
              className="btn-secondary"
              style={{ padding: '0.8rem 1.2rem', fontSize: '0.9rem', color: 'var(--accent-success)' }}
              title="Finish session early and log minutes"
            >
              <CheckCircle2 size={18} /> Finish Early
            </button>
          )}
        </div>

        {/* Linear progress bar */}
        <div style={{ width: '100%', maxWidth: '400px', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: mode === 'focus' ? 'var(--accent-gradient)' : 'var(--accent-gradient-success)',
              transition: 'width 1s linear',
            }}
          />
        </div>
      </div>

      {/* Recent Focus Session Log */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem' }}>Recent Logged Sessions</h3>
        {sessions.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No completed sessions yet. Start your first 25m focus sprint above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {sessions.slice(0, 5).map(s => {
              const linkedTask = tasks.find(t => t.id === s.task_id);
              const dateDisplay = s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '';
              const timeDisplay = s.completed_at ? new Date(s.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div
                  key={s.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <CheckCircle2 size={18} color="var(--accent-success)" />
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {linkedTask ? linkedTask.title : 'General Deep Work Session'}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {dateDisplay} at {timeDisplay}
                      </div>
                      {s.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                          "{s.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="streak-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)' }}>
                    +{s.duration_minutes} mins
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
