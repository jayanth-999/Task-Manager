// oxlint-disable react/immutability, react-hooks/exhaustive-deps
import React, { useState, useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { TodayEngine } from './components/TodayEngine';
import { TaskViews } from './components/TaskViews';
import { RoadmapsView } from './components/RoadmapsView';
import { HabitsView } from './components/HabitsView';
import { FocusView } from './components/FocusView';
import { TechLearningView } from './components/TechLearningView';
import { WorkoutView } from './components/WorkoutView';
import { RecipesView } from './components/RecipesView';
import { InvestmentView } from './components/InvestmentView';
import { ErrandsView } from './components/ErrandsView';
import { SettingsView } from './components/SettingsView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { AuthModal } from './components/AuthModal';
import { TaskModal } from './components/TaskModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthService, GUEST_PROFILE } from './services/authService';
import { TaskService } from './services/taskService';
import { RoadmapService } from './services/roadmapService';
import { SyncEngine, type SyncStatus } from './services/syncEngine';
import { getLocalDateString, dateKey } from './services/dateUtils';
import { isOnboardingComplete, savePreferences } from './services/userPreferences';
import type { RoadmapImport } from './services/roadmapService';
import type { Task, Roadmap, UserProfile, TaskStatus, RoadmapMilestone } from './types';

const VALID_TABS = [
  'today', 'tasks', 'roadmaps', 'habits', 'focus',
  'learning', 'fitness', 'recipes', 'investment', 'errands', 'settings',
] as const;

export const App: React.FC = () => {
  const getInitialTab = (): string => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if ((VALID_TABS as readonly string[]).includes(hash)) return hash;
    }
    return 'today';
  };

  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_PROFILE);
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString()
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!isOnboardingComplete());

  // Undo notification state
  const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState<boolean>(false);

  // Sync activeTab with URL hash for persistent browser history & back/forward support
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.location.hash.replace(/^#\/?/, '') !== tab) {
      window.location.hash = `#/${tab}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if ((VALID_TABS as readonly string[]).includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    const unsubscribeSync = SyncEngine.onSyncStatusChange(status => {
      setSyncStatus(status);
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsubscribeSync();
    };
  }, []);

  // Load user profile, perform uncompleted task auto-rollover, and load data
  useEffect(() => {
    loadUserAndData();

    // Register Service Worker for PWA in production only.
    // In development, unregister any existing service worker and clear caches to prevent stale HMR port conflicts.
    if ('serviceWorker' in navigator) {
      if (import.meta.env.PROD) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
      } else {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then(keys => {
            for (const key of keys) {
              caches.delete(key);
            }
          });
        }
      }
    }
  }, []);

  const loadUserAndData = async () => {
    const user = await AuthService.getCurrentUser();
    setCurrentUser(user);

    // Auto-rollover uncompleted tasks strictly from past days forward to today
    const today = getLocalDateString();
    await TaskService.rolloverIncompleteTasks(user.id, today);

    const loadedTasks = await TaskService.getTasks(user.id, selectedDate);
    setTasks(loadedTasks);

    const loadedRoadmaps = await RoadmapService.getRoadmaps(user.id);
    setRoadmaps(loadedRoadmaps);

    // Calculate real completion streak
    const calculatedStreak = await TaskService.calculateCompletionStreak(user.id);
    setStreak(calculatedStreak);
  };

  // Reload tasks when selected date changes (rollover strictly checks past days into today)
  useEffect(() => {
    const loadDateTasks = async () => {
      const today = getLocalDateString();
      if (selectedDate === today) {
        await TaskService.rolloverIncompleteTasks(currentUser.id, today);
      }
      const loaded = await TaskService.getTasks(currentUser.id, selectedDate);
      setTasks(loaded);
    };
    loadDateTasks();
  }, [selectedDate, currentUser.id]);

  const handleToggleTask = async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus = await TaskService.toggleTaskCompletion(currentUser.id, taskId, currentStatus);
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Refresh roadmaps in case this task was linked to a roadmap milestone
    const refreshedRoadmaps = await RoadmapService.getRoadmaps(currentUser.id);
    setRoadmaps(refreshedRoadmaps);

    // Update real completion streak
    const updatedStreak = await TaskService.calculateCompletionStreak(currentUser.id);
    setStreak(updatedStreak);
  };

  const handleSetTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    await TaskService.setTaskStatus(currentUser.id, taskId, newStatus);
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    const refreshedRoadmaps = await RoadmapService.getRoadmaps(currentUser.id);
    setRoadmaps(refreshedRoadmaps);
    const updatedStreak = await TaskService.calculateCompletionStreak(currentUser.id);
    setStreak(updatedStreak);
  };

  const handleAddTask = async (taskPartial: Partial<Task>) => {
    const created = await TaskService.createTask(currentUser.id, taskPartial);
    setTasks(prev => [created, ...prev]);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>, updateSeries: boolean = false) => {
    const updated = await TaskService.updateTask(currentUser.id, taskId, updates, updateSeries);
    if (updated) {
      if (updateSeries) {
        const refreshed = await TaskService.getTasks(currentUser.id, selectedDate);
        setTasks(refreshed);
      } else {
        setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      }
    }
  };

  const handleSkipOccurrence = async (taskId: string) => {
    await TaskService.skipOccurrence(currentUser.id, taskId);
    const refreshed = await TaskService.getTasks(currentUser.id, selectedDate);
    setTasks(refreshed);
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      setLastDeletedTask(taskToDelete);
      setUndoToastVisible(true);
    }
    await TaskService.deleteTask(currentUser.id, taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));

    // Auto dismiss undo toast after 6 seconds
    setTimeout(() => {
      setUndoToastVisible(false);
    }, 6000);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedTask) return;
    const restored = await TaskService.restoreTask(currentUser.id, lastDeletedTask.id);
    if (restored) {
      setTasks(prev => [restored, ...prev]);
    }
    setUndoToastVisible(false);
    setLastDeletedTask(null);
  };

  const handleMoveToNextDay = async (taskId: string) => {
    await TaskService.moveTaskToNextDay(currentUser.id, taskId);
    const refreshed = await TaskService.getTasks(currentUser.id, selectedDate);
    setTasks(refreshed);
  };

  const handleRolloverOverdue = async () => {
    await TaskService.rolloverIncompleteTasks(currentUser.id, dateKey());
    const refreshed = await TaskService.getTasks(currentUser.id, selectedDate);
    setTasks(refreshed);
  };

  const handleResetRoutine = async () => {
    const fresh = await TaskService.addStarterRoutine(currentUser.id, selectedDate);
    setTasks(fresh);
  };

  const handleCreateRoadmapFromTemplate = async (templateId: string) => {
    const created = await RoadmapService.createRoadmapFromTemplate(currentUser.id, templateId);
    setRoadmaps(prev => [created, ...prev]);

    // Automatically link the first active milestone into the daily tasks!
    const firstMilestone = created.phases?.[0]?.milestones?.[0];
    if (firstMilestone) {
      await RoadmapService.linkMilestoneToDailyTask(currentUser.id, firstMilestone.id, selectedDate);
    }

    // Refresh today's tasks to sync the new active milestone
    const refreshed = await TaskService.getTasks(currentUser.id, selectedDate);
    setTasks(refreshed);
  };

  const handleImportRoadmap = async (data: RoadmapImport) => {
    const created = await RoadmapService.createRoadmapFromData(currentUser.id, data);
    setRoadmaps(prev => [created, ...prev]);
    const firstMilestone = created.phases?.[0]?.milestones?.[0];
    if (firstMilestone) {
      await RoadmapService.linkMilestoneToDailyTask(currentUser.id, firstMilestone.id, selectedDate);
    }
    setTasks(await TaskService.getTasks(currentUser.id, selectedDate));
  };

  const handleDeleteRoadmap = async (roadmapId: string) => {
    await RoadmapService.deleteRoadmap(currentUser.id, roadmapId);
    setRoadmaps(await RoadmapService.getRoadmaps(currentUser.id));
    setTasks(await TaskService.getTasks(currentUser.id, selectedDate));
  };

  const handleAddMilestoneToToday = async (milestone: RoadmapMilestone) => {
    await RoadmapService.linkMilestoneToDailyTask(currentUser.id, milestone.id, selectedDate);
    const refreshed = await TaskService.getTasks(currentUser.id, selectedDate);
    setTasks(refreshed);
    handleTabChange('today');
  };

  const handleOnboardingComplete = async (prefs: {
    name: string;
    workStart: string;
    workEnd: string;
    selectedGoals: Array<'career' | 'health' | 'errands' | 'learning'>;
    startEmpty: boolean;
  }) => {
    savePreferences({ name: prefs.name, workStart: prefs.workStart, workEnd: prefs.workEnd, selectedGoals: prefs.selectedGoals });
    setCurrentUser(prev => ({
      ...prev,
      full_name: prefs.name || prev.full_name,
      work_start: prefs.workStart,
      work_end: prefs.workEnd,
      selected_goals: prefs.selectedGoals,
      onboarding_completed: true,
    }));
    setShowOnboarding(false);

    if (!prefs.startEmpty && prefs.selectedGoals.length > 0) {
      // Generate 3–5 contextual starter tasks based on selected goals
      const today = dateKey();
      const starterMap: Record<string, Array<Partial<Task>>> = {
        career: [
          { title: '🚀 Define your top career goal for this week', category: 'work', priority: 'high', due_date: today },
          { title: '📚 30 min focused learning session', category: 'learning', priority: 'high', due_date: today },
        ],
        health: [
          { title: '🏋️ Morning workout (30 min)', category: 'fitness', priority: 'high', due_date: today, scheduled_start: '07:30', scheduled_end: '08:00' },
          { title: '💧 Drink 8 glasses of water today', category: 'routine', priority: 'medium', due_date: today },
        ],
        errands: [
          { title: '📋 Write today\'s errand & shopping list', category: 'errands', priority: 'medium', due_date: today },
        ],
        learning: [
          { title: '🧠 Read or study for 30 min', category: 'learning', priority: 'high', due_date: today },
          { title: '✍️ Take notes on what you learned', category: 'learning', priority: 'low', due_date: today },
        ],
      };

      const starterTasks: Partial<Task>[] = [];
      for (const goal of prefs.selectedGoals) {
        const goalTasks = starterMap[goal] ?? [];
        starterTasks.push(...goalTasks);
        if (starterTasks.length >= 5) break;
      }

      const created: Task[] = [];
      for (const t of starterTasks.slice(0, 5)) {
        const newTask = await TaskService.createTask(currentUser.id, t);
        created.push(newTask);
      }
      setTasks(created);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('light-theme', isDarkMode);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Onboarding Modal — shown once for new users */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* Top Header */}
      <Header
        user={currentUser}
        streak={streak}
        syncStatus={syncStatus}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />


      {/* Main Body with Responsive Sidebar & Tab Views */}
      <div className="app-main-layout" style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* View Content Panel */}
        <main className="main-content-container" style={{ flex: 1, padding: '0 0.8rem 0.8rem 0.8rem', maxWidth: '1400px', width: '100%', minWidth: 0 }}>
          {activeTab === 'today' && (
            <TodayEngine
              tasks={tasks}
              userId={currentUser.id}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onEditTask={setEditingTask}
              onDeleteTask={handleDeleteTask}
              onMoveToNextDay={handleMoveToNextDay}
              onResetRoutine={handleResetRoutine}
              onRolloverOverdue={handleRolloverOverdue}
              onNavigateTab={handleTabChange}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskViews
              tasks={tasks}
              userId={currentUser.id}
              onToggleTask={handleToggleTask}
              onSetTaskStatus={handleSetTaskStatus}
              onDeleteTask={handleDeleteTask}
              onEditTask={setEditingTask}
              onSelectDate={(date) => {
                setSelectedDate(date);
                handleTabChange('today');
              }}
            />
          )}

          {activeTab === 'roadmaps' && (
            <RoadmapsView
              roadmaps={roadmaps}
              userId={currentUser.id}
              onCreateFromTemplate={handleCreateRoadmapFromTemplate}
              onImportRoadmap={handleImportRoadmap}
              onDeleteRoadmap={handleDeleteRoadmap}
              onMilestoneCompleted={async () => {
                const refreshed = await RoadmapService.getRoadmaps(currentUser.id);
                setRoadmaps(refreshed);
              }}
              onAddMilestoneToToday={handleAddMilestoneToToday}
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === 'habits' && (
            <HabitsView userId={currentUser.id} />
          )}

          {activeTab === 'focus' && (
            <FocusView userId={currentUser.id} tasks={tasks} />
          )}

          {/* Reference Guides (Accessible via Sidebar) */}
          {activeTab === 'learning' && <TechLearningView />}
          {activeTab === 'fitness' && <WorkoutView />}
          {activeTab === 'recipes' && <RecipesView />}
          {activeTab === 'investment' && <InvestmentView />}
          {activeTab === 'errands' && (
            <ErrandsView
              userId={currentUser.id}
              onAddTaskToToday={(errand) => handleAddTask({
                title: errand.title,
                category: 'errands',
                location: errand.location,
                due_date: selectedDate,
                priority: 'medium',
              })}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onUpdateUser={(updated) => setCurrentUser(prev => ({ ...prev, ...updated }))}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Undo Delete Notification Toast */}
      {undoToastVisible && lastDeletedTask && (
        <div
          className="glass-card"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0.8rem 1.2rem',
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            borderRadius: 'var(--radius-sm)',
            maxWidth: '380px',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            Deleted <strong>"{lastDeletedTask.title}"</strong>
          </span>
          <button
            onClick={handleUndoDelete}
            className="btn-primary"
            style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', gap: '0.3rem' }}
          >
            <RotateCcw size={13} /> Undo
          </button>
          <button
            onClick={() => setUndoToastVisible(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Quick Capture Natural Language Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onAddTask={parsed => handleAddTask(parsed)}
      />

      {/* Auth & Guest Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={loadUserAndData}
      />

      {/* Task Edit / Custom Time Modal */}
      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
        onSkipOccurrence={handleSkipOccurrence}
      />
    </div>
  );
};

export default App;
