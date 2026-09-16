import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { TaskService } from '../services/taskService';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (parsed: { title: string; due_date?: string; due_time?: string; priority?: any }) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
}) => {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const parsed = input ? TaskService.parseNaturalLanguageInput(input) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const result = TaskService.parseNaturalLanguageInput(input.trim());
    onAddTask(result);
    setInput('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--accent-primary)" /> Natural Language Quick Capture
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            autoFocus
            placeholder="Type naturally: Buy groceries tomorrow at 6 PM critical..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.8rem 1rem',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
            }}
          />

          {parsed && parsed.title && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              <strong>Parsed Preview:</strong>
              <div style={{ marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
                • <strong>Task:</strong> {parsed.title}<br />
                • <strong>Due Date:</strong> {parsed.due_date || 'Today'}<br />
                • <strong>Time:</strong> {parsed.due_time || 'None'}<br />
                • <strong>Priority:</strong> {parsed.priority}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

