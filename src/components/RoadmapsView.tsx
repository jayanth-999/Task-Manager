import React, { useRef, useState } from 'react';
import {
  Compass,
  Play,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Roadmap, RoadmapMilestone } from '../types';
import { BUILTIN_TEMPLATES, RoadmapService, type RoadmapImport } from '../services/roadmapService';

interface RoadmapsViewProps {
  roadmaps: Roadmap[];
  userId: string;
  onCreateFromTemplate: (templateId: string) => void;
  onImportRoadmap: (data: RoadmapImport) => Promise<void>;
  onDeleteRoadmap: (roadmapId: string) => void;
  onMilestoneCompleted?: () => void;
  onAddMilestoneToToday?: (milestone: RoadmapMilestone) => void;
  onNavigateTab?: (tab: string) => void;
}

export const RoadmapsView: React.FC<RoadmapsViewProps> = ({
  roadmaps,
  userId,
  onCreateFromTemplate,
  onImportRoadmap,
  onDeleteRoadmap,
  onMilestoneCompleted,
  onAddMilestoneToToday,
  onNavigateTab,
}) => {
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(
    roadmaps.length > 0 ? roadmaps[0].id : null
  );
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Career');
  const [newDuration, setNewDuration] = useState(4);
  const [newPhaseTitle, setNewPhaseTitle] = useState('Phase 1 — Core Foundations');
  const [milestoneInputs, setMilestoneInputs] = useState([
    'Master Core Skills & Architecture',
    'Build & Deploy Production Project',
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template: RoadmapImport = { title: 'My 12-week roadmap', description: 'Replace this example with your goal and outcomes.', category: 'Career / personal', duration_months: 3, phases: [{ title: 'Foundation', description: 'The first skills or setup steps.', milestones: [{ title: 'Define the outcome and set up the workspace', target_day: 7 }, { title: 'Complete the first focused project', target_day: 21 }] }] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'task-manager-roadmap-template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const roadmap = RoadmapService.parseRoadmapImport(await file.text());
      await onImportRoadmap(roadmap);
      setImportMessage(`Added “${roadmap.title}”. Its active milestone is now available in your daily plan.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Could not import this roadmap.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentStatus: string) => {
    if (currentStatus !== 'completed') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      await RoadmapService.completeMilestone(userId, milestoneId);
      onMilestoneCompleted?.();
    }
  };

  const handleLaunchTemplate = async (templateId: string, title: string) => {
    await onCreateFromTemplate(templateId);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    setImportMessage(`🎉 Launched “${title}”! The first milestone has been automatically added to your daily tasks.`);
  };

  const handleCreateCustomRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const validMilestones = milestoneInputs.filter(m => m.trim().length > 0);
    if (validMilestones.length === 0) {
      validMilestones.push('Complete Phase 1 Goals');
    }

    const roadmapData: RoadmapImport = {
      title: newTitle.trim(),
      description: `Target duration: ${newDuration} months`,
      category: newCategory,
      duration_months: Number(newDuration),
      phases: [
        {
          title: newPhaseTitle.trim() || 'Phase 1 — Core Foundations',
          milestones: validMilestones.map((m, idx) => ({
            title: m.trim(),
            target_day: (idx + 1) * 30,
          })),
        },
      ],
    };

    try {
      await onImportRoadmap(roadmapData);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      setImportMessage(`🎉 Created “${newTitle}”! The first milestone has been added to your daily tasks.`);
      setIsCreateModalOpen(false);
      setNewTitle('');
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Failed to create roadmap');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.6rem', borderRadius: '10px', display: 'flex' }}>
            <Compass size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Dynamic Roadmap Engine</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Convert 1-12 month career and skill goals into structured milestones & daily execution
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', gap: '0.35rem' }}
          >
            <Plus size={15} /> Create New Roadmap
          </button>
          <span className="streak-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)' }}>
            {roadmaps.length} Active {roadmaps.length === 1 ? 'Roadmap' : 'Roadmaps'}
          </span>
        </div>
      </div>

      {/* Active Message Banner with link to Today */}
      {importMessage && (
        <div
          className="glass-card"
          style={{
            borderLeft: '4px solid var(--accent-success)',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.8rem',
          }}
        >
          <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            {importMessage}
          </span>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('today')}
              className="btn-primary"
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', gap: '0.3rem' }}
            >
              View in Today's Engine <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.35rem' }}>Bring your own roadmap</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
          Download the JSON template, replace its example phases and milestones, then upload it. The next unfinished milestone is added to your daily learning plan.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" onClick={downloadTemplate} style={{ fontSize: '0.8rem', gap: '0.35rem' }}><Download size={14} /> Download template</button>
          <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.8rem', gap: '0.35rem' }}><Upload size={14} /> Upload roadmap</button>
          <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(true)} style={{ fontSize: '0.8rem', gap: '0.35rem' }}><Plus size={14} /> + Define Custom Roadmap</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={e => importFile(e.target.files?.[0])} style={{ display: 'none' }} />
        </div>
        {importMessage && <p role="status" style={{ fontSize: '0.8rem', marginTop: '0.7rem', color: importMessage.startsWith('Added') ? 'var(--accent-success)' : 'var(--accent-warning)' }}>{importMessage}</p>}
      </div>

      {/* Active Roadmaps Section */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="var(--accent-primary)" />
          <span>Active & Historical Roadmaps</span>
        </h3>

        {roadmaps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Compass size={36} style={{ marginBottom: '0.6rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No active roadmaps found.</p>
            <span style={{ fontSize: '0.8rem' }}>Select a template below to launch your career roadmap!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {roadmaps.map(r => {
              const progress = RoadmapService.calculateRoadmapProgress(r);
              const isExpanded = expandedRoadmapId === r.id;

              return (
                <div
                  key={r.id}
                  className="glass-card"
                  style={{
                    borderLeft: `4px solid ${progress.percentage === 100 ? 'var(--accent-success)' : 'var(--accent-primary)'}`,
                    padding: '1.2rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Roadmap Summary Row */}
                  <div
                    onClick={() => setExpandedRoadmapId(isExpanded ? null : r.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', flexWrap: 'wrap', gap: '0.8rem' }}
                  >
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          {r.category || 'Career Roadmap'}
                        </span>
                        {r.is_primary && (
                          <span className="streak-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            Primary Focus
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          • {r.duration_months} Months
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {r.title}
                      </h4>
                      {r.description && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {r.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: progress.percentage === 100 ? 'var(--accent-success)' : 'var(--accent-primary)' }}>
                          {progress.percentage}%
                        </span>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {progress.completedMilestones}/{progress.totalMilestones} Milestones
                        </span>
                      </div>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${r.title}`}
                        title="Remove roadmap"
                        onClick={event => {
                          event.stopPropagation();
                          if (window.confirm(`Remove “${r.title}”? Your existing daily tasks will stay.`)) onDeleteRoadmap(r.id);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: '0.8rem', background: 'var(--bg-secondary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${progress.percentage}%`,
                        height: '100%',
                        background: progress.percentage === 100 ? 'var(--accent-gradient-success)' : 'var(--accent-gradient)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  {/* Expanded Phases & Milestones Accordion */}
                  {isExpanded && r.phases && (
                    <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                      {r.phases.map(phase => (
                        <div key={phase.id} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '0.9rem', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                              {phase.title}
                            </h5>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Phase {phase.phase_order}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {phase.milestones?.map(m => {
                              const isCompleted = m.status === 'completed';

                              return (
                                <div
                                  key={m.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.5rem 0.7rem',
                                    background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                                    borderRadius: '4px',
                                    borderLeft: `3px solid ${isCompleted ? 'var(--accent-success)' : 'var(--border-glass)'}`,
                                    gap: '0.6rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                                    <button
                                      onClick={() => handleToggleMilestone(m.id, m.status)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                      title={isCompleted ? 'Completed milestone' : 'Mark milestone complete'}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 size={18} color="var(--accent-success)" />
                                      ) : (
                                        <Circle size={18} color="var(--text-muted)" />
                                      )}
                                    </button>
                                    <div>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                                        {m.title}
                                      </span>
                                      {m.description && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                          {m.description}
                                        </p>
                                      )}
                                      {m.target_date && (
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                          Target: {m.target_date}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {onAddMilestoneToToday && !isCompleted && (
                                      <button
                                        onClick={() => onAddMilestoneToToday(m)}
                                        className="btn-secondary"
                                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                                        title="Add this milestone as an action in Today's Engine"
                                      >
                                        + Today
                                      </button>
                                    )}
                                    <span
                                      style={{
                                        fontSize: '0.65rem',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '3px',
                                        background: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                        color: isCompleted ? 'var(--accent-success)' : 'var(--accent-primary)',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      {m.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Built-in Template Library */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-secondary)" />
          <span>Roadmap Template Library</span>
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Select a structured curriculum to instantiate a personalized roadmap with verified milestones.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {BUILTIN_TEMPLATES.map(tpl => {
            const isPreviewing = selectedTemplatePreview === tpl.id;

            return (
              <div
                key={tpl.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '3px solid var(--accent-secondary)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {tpl.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={12} /> {tpl.duration_months} Months
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.3rem 0' }}>{tpl.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>{tpl.description}</p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                    <strong>{tpl.structure.phases.length} Phases</strong> • {tpl.structure.phases.reduce((acc, p) => acc + p.milestones.length, 0)} Total Milestones
                  </div>

                  {isPreviewing && (
                    <div style={{ marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
                      {tpl.structure.phases.map(p => (
                        <div key={p.title} style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{p.title}:</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>
                            {p.milestones.map(m => m.title).join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplatePreview(isPreviewing ? null : tpl.id)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                  >
                    {isPreviewing ? 'Hide Details' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchTemplate(tpl.id, tpl.title)}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', gap: '0.3rem' }}
                  >
                    <Play size={14} /> Launch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Custom Roadmap Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Compass size={22} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Create New Roadmap</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRoadmap} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Roadmap Name / Goal Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Senior DevOps + AI Engineer Roadmap"
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.7rem 0.9rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Duration (Months)
                  </label>
                  <select
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.7rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value={1}>1 Month (Sprint)</option>
                    <option value={2}>2 Months</option>
                    <option value={3}>3 Months (Quarter)</option>
                    <option value={4}>4 Months (Comprehensive)</option>
                    <option value={6}>6 Months (Deep Mastery)</option>
                    <option value={12}>12 Months (Full Year)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="e.g. DevOps & AI, Cloud, Career"
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.7rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Initial Phase Title
                </label>
                <input
                  type="text"
                  value={newPhaseTitle}
                  onChange={e => setNewPhaseTitle(e.target.value)}
                  placeholder="Phase 1 — Core Foundations"
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.7rem 0.9rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Key Milestones (First one automatically adds to Today's tasks!)
                  </label>
                  <button
                    type="button"
                    onClick={() => setMilestoneInputs(prev => [...prev, ''])}
                    className="btn-secondary"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', gap: '0.2rem' }}
                  >
                    <Plus size={12} /> Add Milestone
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {milestoneInputs.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 700, width: '20px' }}>
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={m}
                        onChange={e => {
                          const val = e.target.value;
                          setMilestoneInputs(prev => prev.map((item, i) => (i === idx ? val : item)));
                        }}
                        placeholder={`Milestone ${idx + 1} title`}
                        style={{
                          flex: 1,
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem 0.8rem',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '0.85rem',
                        }}
                      />
                      {milestoneInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMilestoneInputs(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Sparkles size={16} /> Launch Roadmap & Add to Today
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
