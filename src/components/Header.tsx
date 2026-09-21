import React from 'react';
import { Flame, Plus, User, Zap, Moon, Sun, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import type { UserProfile } from '../types';
import type { SyncStatus } from '../services/syncEngine';

interface HeaderProps {
  user: UserProfile;
  streak?: number;
  syncStatus?: SyncStatus;
  onRetrySync?: () => void;
  onOpenQuickCapture: () => void;
  onOpenAuthModal: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  streak = 0,
  syncStatus,
  onRetrySync,
  onOpenQuickCapture,
  onOpenAuthModal,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="glass-panel mobile-compact-header" style={{ padding: '0.8rem 1.5rem', margin: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
        <div style={{ background: 'var(--accent-gradient)', padding: '0.45rem', borderRadius: '10px', display: 'flex', flexShrink: 0 }}>
          <Zap size={20} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            APEX PRODUCTIVITY
          </h1>
          <span className="hide-on-mobile" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Goals → Today's Actions</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <div className="streak-badge" title="Daily Completion Streak" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
          <Flame size={14} color="#fff" />
          <span>{streak}<span className="hide-on-mobile"> Day Streak</span></span>
        </div>

        <button onClick={onOpenQuickCapture} className="btn-primary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }} title="Quick Task">
          <Plus size={15} />
          <span className="hide-on-mobile">Quick Task</span>
        </button>

        <button onClick={onToggleTheme} className="btn-secondary" style={{ padding: '0.45rem', borderRadius: '50%' }} title="Toggle Theme" aria-label="Toggle Theme">
          {isDarkMode ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#3b82f6" />}
        </button>

        {syncStatus === 'error' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.3rem 0.6rem',
              fontSize: '0.75rem',
              color: '#f87171',
            }}
          >
            <span className="hide-on-mobile">Sync failed (Saved locally)</span>
            <span className="hide-on-desktop">Sync issue</span>
            {onRetrySync && (
              <button
                onClick={onRetrySync}
                style={{
                  background: 'rgba(239, 68, 68, 0.35)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        <button
          onClick={onOpenAuthModal}
          className="btn-secondary"
          style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title={
            syncStatus === 'synced'
              ? 'Account & Cloud: Synced'
              : syncStatus === 'syncing'
              ? 'Account & Cloud: Syncing...'
              : syncStatus === 'saved-locally'
              ? 'Saved locally (Sync pending)'
              : syncStatus === 'offline'
              ? 'Account & Cloud: Offline'
              : syncStatus === 'error'
              ? 'Account & Cloud: Sync issue'
              : 'Account & Local Storage'
          }
        >
          {syncStatus === 'synced' ? (
            <Cloud size={14} color="var(--accent-success)" />
          ) : syncStatus === 'syncing' ? (
            <RefreshCw size={14} color="var(--accent-primary)" style={{ animation: 'spin 1.2s linear infinite' }} />
          ) : syncStatus === 'saved-locally' ? (
            <Cloud size={14} color="var(--accent-info, #06b6d4)" />
          ) : syncStatus === 'offline' ? (
            <CloudOff size={14} color="var(--accent-warning)" />
          ) : syncStatus === 'error' ? (
            <CloudOff size={14} color="var(--accent-danger)" />
          ) : (
            <User size={15} />
          )}
          <span className="hide-on-mobile">{user.id === 'guest-local-user' ? 'Guest' : user.full_name || 'Account'}</span>
        </button>
      </div>
    </header>
  );
};
