import React from 'react';
import { Calendar, CheckSquare, Compass, Dumbbell, Utensils } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const items = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'roadmaps', label: 'Roadmap', icon: Compass },
    { id: 'fitness', label: 'Workout', icon: Dumbbell },
    { id: 'recipes', label: 'Meals', icon: Utensils },
  ];

  return (
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
    </nav>
  );
};

