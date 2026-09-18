import React, { useState } from 'react';
import { Calendar, CheckSquare, Compass, Activity, Clock, BookOpen, Dumbbell, Utensils, TrendingUp, MapPin, MoreHorizontal, X, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

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
              return <button key={item.id} type="button" onClick={() => { onTabChange(item.id); setIsMoreOpen(false); }} className={isActive ? 'btn-primary' : 'btn-secondary'} style={{ minHeight: '64px', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem', fontSize: '0.72rem' }}><Icon size={18} />{item.label}</button>;
            })}
          </div>
        </div>
      )}
      <nav className="mobile-bottom-nav">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
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
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              gap: '2px',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            <Icon size={20} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
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
