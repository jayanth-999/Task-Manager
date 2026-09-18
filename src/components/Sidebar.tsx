import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Compass,
  Activity,
  Clock,
  Dumbbell,
  Utensils,
  TrendingUp,
  MapPin,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [guidesOpen, setGuidesOpen] = useState(false);

  const coreItems = [
    { id: 'today', label: "Today's Engine", icon: Calendar },
    { id: 'tasks', label: 'Tasks & Calendar', icon: CheckSquare },
    { id: 'roadmaps', label: 'Dynamic Roadmaps', icon: Compass },
    { id: 'habits', label: 'Habits & Streaks', icon: Activity },
    { id: 'focus', label: 'Focus & Pomodoro', icon: Clock },
  ];

  const guideItems = [
    { id: 'learning', label: '1-Hr Tech Learning', icon: BookOpen },
    { id: 'fitness', label: 'Fitness & Diet', icon: Dumbbell },
    { id: 'recipes', label: 'Recipes & Groceries', icon: Utensils },
    { id: 'investment', label: 'Morning Investment', icon: TrendingUp },
    { id: 'errands', label: 'Location Errands', icon: MapPin },
  ];

  return (
    <aside
      className="desktop-sidebar glass-panel"
      style={{
        width: '240px',
        margin: '0 0 0.8rem 0.8rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        overflowY: 'auto',
      }}
    >
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, padding: '0.4rem 0.6rem' }}>
        Core Execution
      </span>

      {coreItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: isActive ? 'var(--accent-gradient)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <Icon size={18} color={isActive ? '#fff' : 'var(--text-secondary)'} />
            <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
          </button>
        );
      })}

      <div style={{ margin: '0.6rem 0', borderTop: '1px solid var(--border-glass)' }} />

      {/* Collapsible Guides Section */}
      <button
        type="button"
        onClick={() => setGuidesOpen(!guidesOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          fontWeight: 700,
          padding: '0.4rem 0.6rem',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <span>Reference Guides</span>
        {guidesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {guidesOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
          {guideItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Settings at the very bottom */}
      <div style={{ flex: 1 }} />
      <div style={{ margin: '0.4rem 0', borderTop: '1px solid var(--border-glass)' }} />
      <button
        onClick={() => onTabChange('settings')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          padding: '0.65rem 0.9rem',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: activeTab === 'settings' ? 'rgba(148,163,184,0.15)' : 'transparent',
          color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: activeTab === 'settings' ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <Settings size={17} color={activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-muted)'} />
        <span style={{ fontSize: '0.9rem' }}>Settings</span>
      </button>
    </aside>
  );
};

