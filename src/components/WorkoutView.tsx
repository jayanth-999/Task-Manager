import React, { useState } from 'react';
import { Dumbbell, Home, Zap, Apple } from 'lucide-react';
import type { WorkoutMode } from '../types';
import { WORKOUT_TEMPLATES, DIET_GUIDE } from '../services/workoutService';

export const WorkoutView: React.FC = () => {
  const [mode, setMode] = useState<WorkoutMode>(() => {
    try {
      const saved = localStorage.getItem('apex_workout_mode');
      if (saved === 'home' || saved === 'gym') return saved;
    } catch {}
    return 'home';
  });

  const handleModeChange = (newMode: WorkoutMode) => {
    setMode(newMode);
    try {
      localStorage.setItem('apex_workout_mode', newMode);
    } catch {}
  };

  const template = WORKOUT_TEMPLATES.find(t => t.mode === mode) || WORKOUT_TEMPLATES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Routine & Diet Guide Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.7rem 1rem', borderRadius: 'var(--radius-sm)',
        background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
        fontSize: '0.82rem', color: 'var(--accent-success)',
      }}>
        🏋️‍♂️ <strong>Routine & Diet Guide</strong> — Selected workout mode is saved automatically on this device.
      </div>
      {/* Header & Mode Switcher */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Dumbbell size={22} color="var(--accent-primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Fitness Routine & Pre/Post Diet Guide</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Equipment-free Home Routine vs Basic Gym Routine</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-sm)' }}>
          <button
            className={mode === 'home' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleModeChange('home')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Home size={16} /> Home Workout Day
          </button>
          <button
            className={mode === 'gym' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleModeChange('gym')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Dumbbell size={16} /> Gym Workout Day
          </button>
        </div>
      </div>

      {/* Workout Exercises Card */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="var(--accent-warning)" />
          {template.title}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
          {template.exercises.map((ex, idx) => (
            <div key={idx} className="glass-card">
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Step {idx + 1}</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.2rem 0' }}>{ex.name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ex.sets} Sets × {ex.reps}</p>
              {ex.equipment && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                  Equipment: {ex.equipment}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pre & Post Workout Diet Guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Apple size={18} />
            {DIET_GUIDE.pre_workout.title}
          </h3>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
            {DIET_GUIDE.pre_workout.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Apple size={18} />
            {DIET_GUIDE.post_workout.title}
          </h3>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
            {DIET_GUIDE.post_workout.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

