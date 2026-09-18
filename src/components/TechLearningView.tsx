import React, { useState } from 'react';
import { BookOpen, Code, Terminal, CheckCircle2 } from 'lucide-react';
import { getLocalDateString } from '../services/dateUtils';

export const TechLearningView: React.FC = () => {
  const [learningLog, setLearningLog] = useState<Array<{ id: string; date: string; aiTopic: string; devopsTopic: string; duration: number; isCompleted: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('apex_learning_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse learning logs from localStorage:', e);
    }
    return [];
  });

  const [aiInput, setAiInput] = useState('');
  const [devopsInput, setDevopsInput] = useState('');

  const handleLogLearning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() && !devopsInput.trim()) return;
    const newEntry = {
      id: crypto.randomUUID(),
      date: getLocalDateString(),
      aiTopic: aiInput || 'AI Agent / RAG Study',
      devopsTopic: devopsInput || 'DevOps & Pure Python Practice',
      duration: 60,
      isCompleted: true,
    };
    const next = [newEntry, ...learningLog];
    setLearningLog(next);
    try {
      localStorage.setItem('apex_learning_logs', JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save learning log:', e);
    }
    setAiInput('');
    setDevopsInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Learning Status Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.7rem 1rem', borderRadius: 'var(--radius-sm)',
        background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)',
        fontSize: '0.82rem', color: 'var(--accent-primary)',
      }}>
        🚀 <strong>1-Hour Daily Study Plan</strong> — Log your daily AI and DevOps progress here. Persisted and tracked for your 4-month goal.
      </div>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <BookOpen size={22} color="var(--accent-primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>1-Hour Work Shift Tech Learning & Career Strategy</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Daily 60-min skill building for job readiness in 4 months</span>
          </div>
        </div>
      </div>

      {/* 1-Hour Learning Split Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid var(--accent-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <Code size={20} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>30 Mins — AI & Agentic Engineering</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Learn & implement from basics to advanced: <strong>AI Agents, RAG System Design, Vector Embeddings, and Model Context Protocol (MCPs)</strong>.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <Terminal size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>30 Mins — DevOps & Pure Python</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Core DevOps mastery (Linux, Docker, K8s, Terraform, CI/CD) + <strong>Native Python exercises without Copilot</strong> to rebuild core muscle memory for interviews!
          </p>
        </div>
      </div>

      {/* Log Today's 1-Hour Learning Session */}
      <form onSubmit={handleLogLearning} className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Log Today's 1-Hour Learning Progress</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem' }}>
          <input
            type="text"
            placeholder="AI Topic (e.g., RAG Chunking, MCP Server)..."
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}
          />
          <input
            type="text"
            placeholder="DevOps / Python Topic (e.g., K8s Ingress, Pure Python Generators)..."
            value={devopsInput}
            onChange={e => setDevopsInput(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.2rem' }}>
          <CheckCircle2 size={16} /> Save 1-Hour Study Log
        </button>
      </form>

      {/* Learning Logs History */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem' }}>Recent Learning Log History</h3>
        {learningLog.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No learning sessions logged yet. Add the first one above.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {learningLog.map(log => (
            <div key={log.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{log.date} • 60 Mins</span>
                <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  🤖 <strong>AI:</strong> {log.aiTopic}<br />
                  ⚙️ <strong>DevOps/Python:</strong> {log.devopsTopic}
                </div>
              </div>
              <span className="streak-badge" style={{ background: 'var(--accent-gradient-success)' }}>
                ✓ Completed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
