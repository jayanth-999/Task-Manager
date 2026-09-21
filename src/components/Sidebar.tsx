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

const TAB_AREA_COLORS: Record<string, { color: string; bg: string }> = {
  today: { color: 'var(--area-today, #3b82f6)', bg: 'rgba(59, 130, 246, 0.15)' },
  tasks: { color: 'var(--area-tasks, #94a3b8)', bg: 'rgba(148, 163, 184, 0.15)' },
  roadmaps: { color: 'var(--area-roadmaps, #8b5cf6)', bg: 'rgba(139, 92, 246, 0.15)' },
  habits: { color: 'var(--area-habits, #14b8a6)', bg: 'rgba(20, 184, 166, 0.15)' },
  focus: { color: 'var(--area-focus, #f97316)', bg: 'rgba(249, 115, 22, 0.15)' },
  learning: { color: 'var(--area-learning, #06b6d4)', bg: 'rgba(6, 182, 212, 0.15)' },
  fitness: { color: 'var(--area-fitness, #10b981)', bg: 'rgba(16, 185, 129, 0.15)' },
  recipes: { color: 'var(--area-recipes, #f43f5e)', bg: 'rgba(244, 63, 94, 0.15)' },
  investment: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  errands: { color: 'var(--area-errands, #eab308)', bg: 'rgba(234, 179, 8, 0.15)' },
  settings: { color: 'var(--area-settings, #94a3b8)', bg: 'rgba(148, 163, 184, 0.15)' },
};

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
        const theme = TAB_AREA_COLORS[item.id] || { color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.15)' };
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
              borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent',
              background: isActive ? theme.bg : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <Icon size={18} color={isActive ? theme.color : 'var(--text-secondary)'} />
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
            const theme = TAB_AREA_COLORS[item.id] || { color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.15)' };
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
                  borderLeft: isActive ? `3px solid ${theme.color}` : '3px solid transparent',
                  background: isActive ? theme.bg : 'transparent',
                  color: isActive ? theme.color : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Icon size={16} color={isActive ? theme.color : 'var(--text-muted)'} />
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
          borderLeft: activeTab === 'settings' ? '3px solid var(--area-settings, #94a3b8)' : '3px solid transparent',
          background: activeTab === 'settings' ? 'rgba(148,163,184,0.15)' : 'transparent',
          color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: activeTab === 'settings' ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <Settings size={17} color={activeTab === 'settings' ? 'var(--area-settings, #94a3b8)' : 'var(--text-muted)'} />
        <span style={{ fontSize: '0.9rem' }}>Settings</span>
      </button>
    </aside>
  );
};

