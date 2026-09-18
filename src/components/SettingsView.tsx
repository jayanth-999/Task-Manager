// oxlint-disable react/set-state-in-effect
import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, RotateCcw, Cloud, ShieldCheck, User } from 'lucide-react';
import { getPreferences, savePreferences } from '../services/userPreferences';
import { supabase, isCloudConfigured } from '../services/supabaseClient';
import { throwIfSupabaseError } from '../services/supabaseResult';
import type { UserProfile } from '../types';

interface SettingsViewProps {
  currentUser?: UserProfile;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onOpenAuthModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUpdateUser,
  onOpenAuthModal,
}) => {
  const prefs = getPreferences();
  const [name, setName] = useState(currentUser?.full_name || prefs.name || '');
  const [workStart, setWorkStart] = useState(currentUser?.work_start || prefs.workStart || '14:00');
  const [workEnd, setWorkEnd] = useState(currentUser?.work_end || prefs.workEnd || '23:00');
  const [timezone] = useState(currentUser?.timezone || prefs.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.full_name) setName(currentUser.full_name);
    if (currentUser?.work_start) setWorkStart(currentUser.work_start);
    if (currentUser?.work_end) setWorkEnd(currentUser.work_end);
  }, [currentUser]);

  const handleSave = async () => {
    setIsSaving(true);
    setCloudError(null);
    // 1. Update local storage
    savePreferences({ name, workStart, workEnd });

    // 2. If logged in and cloud is configured, update Supabase profiles table
    if (currentUser && currentUser.id !== 'guest-local-user' && isCloudConfigured) {
      try {
        const result = await supabase.from('profiles').update({
          full_name: name,
          work_start: workStart,
          work_end: workEnd,
          updated_at: new Date().toISOString(),
        }).eq('id', currentUser.id);
        throwIfSupabaseError(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not sync profile update to cloud.';
        console.warn('Could not sync profile update to cloud:', err);
        setCloudError(message);
      }
    }

    // 3. Notify parent app state
    onUpdateUser?.({
      full_name: name,
      work_start: workStart,
      work_end: workEnd,
    });

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRerunOnboarding = () => {
    if (window.confirm('This will clear your onboarding status and show the setup wizard again on next refresh. Continue?')) {
      savePreferences({ onboardingComplete: false });
      window.location.reload();
    }
  };

  const isGuest = !currentUser || currentUser.id === 'guest-local-user';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '600px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ background: 'var(--accent-gradient)', padding: '0.6rem', borderRadius: '10px', display: 'flex' }}>
          <Settings size={24} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Settings & Preferences</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Personalise Apex to match your schedule and goals
          </span>
        </div>
      </div>

      {cloudError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.8rem 1rem', color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
          ⚠️ <strong>Cloud Sync Notice:</strong> {cloudError} (Your preferences are safely saved locally in this browser).
        </div>
      )}

      {/* Account Status */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            background: isGuest ? 'rgba(148, 163, 184, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            padding: '0.5rem',
            borderRadius: '8px',
            display: 'flex',
          }}>
            {isGuest ? <User size={20} color="var(--text-secondary)" /> : <ShieldCheck size={20} color="var(--accent-success)" />}
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              {isGuest ? 'Guest Mode (Offline & Local)' : `Cloud Account: ${currentUser?.email}`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isGuest
                ? 'Your data is saved locally in this browser. Create an account to backup to cloud.'
                : 'Tasks, habits, and roadmaps are backed up to your Supabase account.'}
            </div>
          </div>
        </div>
        {isGuest && onOpenAuthModal && (
          <button
            onClick={onOpenAuthModal}
            className="btn-primary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', gap: '0.4rem' }}
          >
            <Cloud size={14} /> Sign In / Backup
          </button>
        )}
      </div>

      {/* Profile */}
      <div className="glass-panel" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>👤 Profile</h3>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.7rem 1rem',
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Work Schedule */}
      <div className="glass-panel" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>⏰ Work Schedule</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
          Apex uses these times to contextualise your day. They don't lock your tasks.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

        <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.8rem', background: 'rgba(148, 163, 184, 0.08)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🌐 Active Timezone: <strong style={{ color: 'var(--text-secondary)' }}>{timezone}</strong> (Apex calculates all daily schedules and streaks in your local time)
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="btn-primary"
        style={{ padding: '0.8rem', justifyContent: 'center', fontSize: '0.95rem', gap: '0.4rem', opacity: isSaving ? 0.7 : 1 }}
      >
        {saved ? <CheckCircle2 size={17} /> : <Save size={17} />}
        {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Preferences'}
      </button>

      {/* Danger Zone */}
      <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid var(--accent-danger)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--accent-danger)' }}>
          ⚠️ Reset & Advanced
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
          Re-run the first-time setup wizard to update your name, work hours, and starting goals.
        </p>
        <button
          onClick={handleRerunOnboarding}
          className="btn-secondary"
          style={{ gap: '0.4rem', fontSize: '0.85rem', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
        >
          <RotateCcw size={15} /> Re-run Setup Wizard
        </button>
      </div>
    </div>
  );
};

