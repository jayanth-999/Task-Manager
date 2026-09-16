import React, { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';

interface Errand {
  id: string;
  location: string;
  title: string;
  isDone: boolean;
}

export const ErrandsView: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [errands, setErrands] = useState<Errand[]>([
    { id: 'e1', location: 'Supermarket', title: 'Buy Extra Olive Oil & Almond Milk', isDone: false },
    { id: 'e2', location: 'Pharmacy', title: 'Pick up Multivitamins & First Aid Tape', isDone: false },
    { id: 'e3', location: 'Hardware Store', title: 'Purchase Desk Cable Clips', isDone: false },
    { id: 'e4', location: 'Office', title: 'Collect Desk Charger & Submit Receipts', isDone: false },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('Supermarket');

  const handleAddErrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setErrands(prev => [
      ...prev,
      { id: crypto.randomUUID(), location: newLocation, title: newTitle.trim(), isDone: false },
    ]);
    setNewTitle('');
  };

  const locations = ['All', 'Supermarket', 'Pharmacy', 'Hardware Store', 'Office'];

  const filtered = selectedLocation === 'All'
    ? errands
    : errands.filter(e => e.location.toLowerCase() === selectedLocation.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <MapPin size={22} color="var(--accent-primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Location-Based Non-Urgent Errands List</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>"When I happen to visit" non-urgent reminder checklist</span>
          </div>
        </div>
      </div>

      {/* Location Filter Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {locations.map(loc => (
          <button
            key={loc}
            onClick={() => setSelectedLocation(loc)}
            className={selectedLocation === loc ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            📍 {loc}
          </button>
        ))}
      </div>

      {/* Add New Errand */}
      <form onSubmit={handleAddErrand} className="glass-panel" style={{ padding: '0.8rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <select
          value={newLocation}
          onChange={e => setNewLocation(e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}
        >
          <option value="Supermarket">Supermarket</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Hardware Store">Hardware Store</option>
          <option value="Office">Office</option>
        </select>
        <input
          type="text"
          placeholder="Non-urgent task (e.g., Buy extra batteries when near hardware store)..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          style={{ flex: 1, minWidth: '200px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}
        />
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Add Errand
        </button>
      </form>

      {/* Errands List */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {filtered.map(errand => (
          <div
            key={errand.id}
            className="glass-card"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                📍 {errand.location}
              </span>
              <span className={errand.isDone ? 'task-completed-text' : ''} style={{ fontSize: '0.9rem' }}>
                {errand.title}
              </span>
            </div>
            <button
              onClick={() => setErrands(prev => prev.map(e => e.id === errand.id ? { ...e, isDone: !e.isDone } : e))}
              className={errand.isDone ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            >
              {errand.isDone ? 'Done ✓' : 'Mark Done'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

