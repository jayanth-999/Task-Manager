import React from 'react';
import { Compass, Play } from 'lucide-react';
import type { Roadmap } from '../types';
import { BUILTIN_TEMPLATES } from '../services/roadmapService';

interface RoadmapsViewProps {
  roadmaps: Roadmap[];
  onCreateFromTemplate: (templateId: string) => void;
}

export const RoadmapsView: React.FC<RoadmapsViewProps> = ({ roadmaps, onCreateFromTemplate }) => {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Compass size={22} color="var(--accent-primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dynamic Multi-Roadmap Engine</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Long-term career & skill goal tracking</span>
          </div>
        </div>
      </div>

      {/* Active Roadmaps Section */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Active & Historical Roadmaps</h3>
        {roadmaps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.9rem' }}>No active roadmaps found. Select a template below to start your first roadmap!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {roadmaps.map(r => (
              <div key={r.id} className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{r.title}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {r.duration_months} Months • {r.start_date} → {r.end_date}
                    </span>
                  </div>
                  <span className="streak-badge" style={{ background: 'var(--accent-gradient)' }}>
                    {r.is_primary ? 'Primary' : 'Active'}
                  </span>
                </div>
                <div style={{ marginTop: '0.8rem', background: 'var(--bg-secondary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', background: 'var(--accent-gradient)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Progress Rollup: 45% Complete</span>
                  <span>Phase 2 of 4</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Built-in Template Library */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Roadmap Template Library</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {BUILTIN_TEMPLATES.map(tpl => (
            <div key={tpl.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{tpl.category}</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.3rem 0' }}>{tpl.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>{tpl.description}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                  {tpl.structure.phases.length} Dynamic Phases • {tpl.duration_months} Months Duration
                </div>
              </div>

              <button onClick={() => onCreateFromTemplate(tpl.id)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Play size={16} /> Launch Roadmap
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

