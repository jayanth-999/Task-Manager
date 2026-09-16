import React from 'react';
import { Calendar, CheckSquare, Compass, Dumbbell, Utensils, TrendingUp, MapPin, BookOpen } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'today', label: "Today's Engine", icon: Calendar },
    { id: 'tasks', label: 'Tasks & Views', icon: CheckSquare },
    { id: 'roadmaps', label: 'Dynamic Roadmaps', icon: Compass },
    { id: 'learning', label: '1-Hr Tech Learning', icon: BookOpen },
    { id: 'fitness', label: 'Fitness & Diet', icon: Dumbbell },
    { id: 'recipes', label: 'Recipes & Groceries', icon: Utensils },
    { id: 'investment', label: 'Morning Investment', icon: TrendingUp },
    { id: 'errands', label: 'Location Errands', icon: MapPin },
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        width: '240px',
        margin: '0 0 0.8rem 0.8rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      {navItems.map(item => {
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
              padding: '0.7rem 1rem',
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
    </aside>
  );
};

