import React from 'react';
import { Flame, Plus, User, Zap, Moon, Sun } from 'lucide-react';
import type { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  onOpenQuickCapture: () => void;
  onOpenAuthModal: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenQuickCapture,
  onOpenAuthModal,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="glass-panel" style={{ padding: '0.8rem 1.5rem', margin: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
          <Zap size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            APEX PRODUCTIVITY
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Goals → Today's Actions</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="streak-badge" title="Daily Completion Streak">
          <Flame size={16} color="#fff" />
          <span>7 Day Streak</span>
        </div>

        <button onClick={onOpenQuickCapture} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <Plus size={16} />
          <span>Quick Task</span>
        </button>

        <button onClick={onToggleTheme} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
          {isDarkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#3b82f6" />}
        </button>

        <button onClick={onOpenAuthModal} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <User size={16} />
          <span>{user.id === 'guest-local-user' ? 'Guest Mode' : user.full_name || 'Account'}</span>
        </button>
      </div>
    </header>
  );
};
