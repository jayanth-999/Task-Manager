import React, { useState } from 'react';
import { Calendar, CheckSquare, Compass, Activity, Clock, BookOpen, Dumbbell, Utensils, TrendingUp, MapPin, MoreHorizontal, X, Settings } from 'lucide-react';

interface BottomNavProps {
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

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const items = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'roadmaps', label: 'Roadmap', icon: Compass },
    { id: 'habits', label: 'Habits', icon: Activity },
    { id: 'focus', label: 'Focus', icon: Clock },
  ];
  const guideItems = [
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'recipes', label: 'Recipes', icon: Utensils },
    { id: 'investment', label: 'Investment', icon: TrendingUp },
    { id: 'errands', label: 'Errands', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {isMoreOpen && (
        <div className="mobile-more-menu" role="dialog" aria-label="More sections">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <strong style={{ fontSize: '0.9rem' }}>More sections</strong>
            <button type="button" onClick={() => setIsMoreOpen(false)} aria-label="Close more sections" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0.2rem' }}><X size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {guideItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const theme = TAB_AREA_COLORS[item.id] || { color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.15)' };
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onTabChange(item.id); setIsMoreOpen(false); }}
                  className={isActive ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    minHeight: '64px',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    borderColor: isActive ? theme.color : undefined,
                  }}
                >
                  <Icon size={18} color={isActive ? '#fff' : theme.color} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <nav className="mobile-bottom-nav">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const theme = TAB_AREA_COLORS[item.id] || { color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.15)' };
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? theme.color : 'var(--text-muted)',
              fontSize: '0.75rem',
              gap: '2px',
              cursor: 'pointer',
              flex: 1,
              position: 'relative',
              paddingBottom: '4px',
            }}
          >
            <Icon size={20} color={isActive ? theme.color : 'var(--text-muted)'} />
            <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '1px',
                  width: '16px',
                  height: '2.5px',
                  borderRadius: '2px',
                  background: theme.color,
                }}
              />
            )}
          </button>
        );
      })}
      <button type="button" onClick={() => setIsMoreOpen(open => !open)} aria-expanded={isMoreOpen} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isMoreOpen ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: '0.75rem', gap: '2px', cursor: 'pointer', flex: 1 }}>
        <MoreHorizontal size={20} />
        <span>More</span>
      </button>
      </nav>
    </>
  );
};
