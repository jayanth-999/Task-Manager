import React, { useState } from 'react';
import { TrendingUp, ExternalLink, CheckSquare } from 'lucide-react';
import { INVESTMENT_RESOURCES, DAILY_INVESTMENT_CHECKLIST } from '../services/investmentService';

export const InvestmentView: React.FC = () => {
  const [checklistState, setChecklistState] = useState<boolean[]>(
    new Array(DAILY_INVESTMENT_CHECKLIST.length).fill(false)
  );

  const toggleCheck = (idx: number) => {
    const next = [...checklistState];
    next[idx] = !next[idx];
    setChecklistState(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <TrendingUp size={22} color="var(--accent-success)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>10-15 Min Morning Investment & Market Study</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Daily morning market trends, financial news & wealth building</span>
          </div>
        </div>
      </div>

      {/* Daily 10-15 min checklist */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare size={18} color="var(--accent-success)" />
          <span>Daily Morning Finance Checklist</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DAILY_INVESTMENT_CHECKLIST.map((item, idx) => (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              className="glass-card"
              style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', padding: '0.7rem 1rem' }}
            >
              <input type="checkbox" checked={checklistState[idx]} onChange={() => {}} style={{ cursor: 'pointer' }} />
              <span className={checklistState[idx] ? 'task-completed-text' : ''} style={{ fontSize: '0.9rem' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Market News Resources */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Market News & Study Links</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {INVESTMENT_RESOURCES.map(res => (
            <div key={res.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{res.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>{res.description}</p>
              </div>
              <a
                href={res.link}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', justifyContent: 'center' }}
              >
                Open News Source <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

