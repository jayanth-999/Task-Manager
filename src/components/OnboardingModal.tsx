import React, { useState } from 'react';
import { Target, Heart, ShoppingBag, BookOpen, ArrowRight, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { markOnboardingComplete } from '../services/userPreferences';
import { formatTimeLabel } from '../services/taskService';

interface OnboardingModalProps {
  onComplete: (prefs: {
    name: string;
    workStart: string;
    workEnd: string;
    selectedGoals: Array<'career' | 'health' | 'errands' | 'learning'>;
    startEmpty: boolean;
  }) => void;
}

type Goal = 'career' | 'health' | 'errands' | 'learning';

const GOALS: Array<{ id: Goal; icon: string; label: string; description: string }> = [
  { id: 'career', icon: '🚀', label: 'Career Growth', description: 'Roadmaps, learning, skills, DevOps, AI' },
  { id: 'health', icon: '💪', label: 'Daily Health', description: 'Workouts, meals, hydration, sleep' },
  { id: 'errands', icon: '📋', label: 'Life Admin', description: 'Groceries, errands, chores, bills' },
  { id: 'learning', icon: '🧠', label: 'Learning & Skills', description: 'Courses, reading, practice, certifications' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [workStart, setWorkStart] = useState('14:00');
  const [workEnd, setWorkEnd] = useState('23:00');
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [startEmpty, setStartEmpty] = useState(false);

  const totalSteps = 5;

  const toggleGoal = (goal: Goal) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleComplete = () => {
    markOnboardingComplete({
      name,
      workStart,
      workEnd,
      selectedGoals,
    });
    onComplete({ name, workStart, workEnd, selectedGoals, startEmpty });
  };

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 = true; // work hours have defaults
  const canProceedStep3 = selectedGoals.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        padding: '1rem',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="First-time setup wizard"
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: 'clamp(1.2rem, 5vw, 2.2rem)',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative',
        }}
      >
        {/* Decorative gradient blob */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            opacity: 0.12,
            pointerEvents: 'none',
          }}
        />

        {/* Step progress bar */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: i < step ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step 1 — Name */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                Welcome to Apex
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                One system to convert your goals into today's actions. Let's set you up in 60 seconds.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                What should we call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canProceedStep1 && setStep(2)}
                placeholder="Your name or nickname"
                autoFocus
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.8rem 1rem',
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="btn-primary"
              style={{ justifyContent: 'center', opacity: canProceedStep1 ? 1 : 0.4 }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2 — Work Hours */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                Hi {name}! When do you work?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                This lets Apex plan your day around your schedule, not against it.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Work starts at
                </label>
                <input
                  type="time"
                  value={workStart}
                  onChange={e => setWorkStart(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.7rem',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Work ends at
                </label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={e => setWorkEnd(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.7rem',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Goal Selection */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                What goals matter to you?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Apex will surface the right features and tasks based on your priorities.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {GOALS.map(goal => {
                const selected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.9rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${selected ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                      background: selected ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{goal.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{goal.label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{goal.description}</div>
                    </div>
                    {selected && <CheckCircle2 size={20} color="var(--accent-primary)" />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', opacity: canProceedStep3 ? 1 : 0.4 }}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Start Mode Selection */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                How do you want to start?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                You can always add more tasks and customise your schedule later.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button
                onClick={() => setStartEmpty(false)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${!startEmpty ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                  background: !startEmpty ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s',
                }}
              >
                <Zap size={24} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Start with a simple plan</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Apex generates 3–5 starter tasks based on your selected goals. Add, remove, or edit anytime.
                  </div>
                </div>
                {!startEmpty && <CheckCircle2 size={20} color="var(--accent-primary)" style={{ flexShrink: 0, marginLeft: 'auto' }} />}
              </button>

              <button
                onClick={() => setStartEmpty(true)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${startEmpty ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                  background: startEmpty ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s',
                }}
              >
                <Target size={24} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Start empty</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Blank slate — add your own tasks from scratch, at your own pace.
                  </div>
                </div>
                {startEmpty && <CheckCircle2 size={20} color="var(--accent-primary)" style={{ flexShrink: 0, marginLeft: 'auto' }} />}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                ← Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', fontSize: '1rem' }}
              >
                Review My Plan <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Plan Confirmation */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                Your Plan is Ready, {name || 'Leader'}!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                We've customized your day around your work hours and primary focus areas.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🏢 Work Shift</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {formatTimeLabel(workStart)} – {formatTimeLabel(workEnd)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🎯 Focus Goals</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                  {selectedGoals.length > 0 ? selectedGoals.map(g => GOALS.find(x => x.id === g)?.icon).join(' ') : 'General Productivity'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  📋 Plan Overview:
                </span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {!startEmpty
                    ? '10 structured daily routines & shift tasks loaded to guide your day from wake-up to evening wind-down.'
                    : 'Clean slate activated. You can add custom tasks or import a roadmap anytime.'}
                </p>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {!startEmpty ? 'First up: Check off your morning routine and kick off your day!' : 'First up: Capture your #1 priority task in the input bar!'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => setStep(4)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                ← Back
              </button>
              <button
                onClick={handleComplete}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', fontSize: '1rem', gap: '0.4rem' }}
              >
                Launch Today 🚀
              </button>
            </div>
          </div>
        )}

        {/* Goal icon strip at bottom */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', opacity: 0.4 }}>
          <Target size={14} /><Heart size={14} /><ShoppingBag size={14} /><BookOpen size={14} />
        </div>
      </div>
    </div>
  );
};

