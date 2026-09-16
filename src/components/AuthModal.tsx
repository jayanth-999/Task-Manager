import React, { useState } from 'react';
import { X, UserCheck, CloudUpload } from 'lucide-react';
import { AuthService } from '../services/authService';
import type { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isGuest = currentUser.id === 'guest-local-user';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        await AuthService.signUp(email, password, fullName || 'Apex User');
      } else {
        await AuthService.signIn(email, password);
      }
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    onAuthSuccess();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={18} color="var(--accent-primary)" />
            {isGuest ? 'Account Sync & Sign In' : 'User Account Settings'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!isGuest ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Signed in as {currentUser.email}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', margin: '0.4rem 0 1.2rem 0' }}>
              Your tasks, habits, and roadmaps are synced to the cloud ($0 Free Tier).
            </span>
            <button onClick={handleSignOut} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {isGuest && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-success)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CloudUpload size={20} color="var(--accent-success)" />
                <span>Create an account to sync your current guest data to the cloud at $0 cost!</span>
              </div>
            )}

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                {errorMsg}
              </div>
            )}

            {isSignUp && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.7rem', borderRadius: 'var(--radius-sm)' }}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.7rem', borderRadius: 'var(--radius-sm)' }}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.7rem', borderRadius: 'var(--radius-sm)' }}
              required
            />

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.4rem' }}>
              {loading ? 'Processing...' : isSignUp ? 'Create Account & Sync Data' : 'Sign In & Sync Data'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

