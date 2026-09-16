import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { TodayEngine } from './components/TodayEngine';
import { TaskViews } from './components/TaskViews';
import { RoadmapsView } from './components/RoadmapsView';
import { TechLearningView } from './components/TechLearningView';
import { WorkoutView } from './components/WorkoutView';
import { RecipesView } from './components/RecipesView';
import { InvestmentView } from './components/InvestmentView';
import { ErrandsView } from './components/ErrandsView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { AuthModal } from './components/AuthModal';
import { TaskModal } from './components/TaskModal';
import { AuthService, GUEST_PROFILE } from './services/authService';
import { TaskService } from './services/taskService';
import { RoadmapService } from './services/roadmapService';
import type { Task, Roadmap, UserProfile, TaskStatus } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_PROFILE);
  const [activeTab, setActiveTab] = useState<string>('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load user profile, perform uncompleted task auto-rollover, and load data
  useEffect(() => {
    loadUserAndData();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  const loadUserAndData = async () => {
    const user = await AuthService.getCurrentUser();
    setCurrentUser(user);

    // Auto-rollover uncompleted tasks from past days forward to selectedDate ("Move Right")
    await TaskService.rolloverIncompleteTasks(user.id, selectedDate);

    const loadedTasks = await TaskService.getTasks(user.id, selectedDate);
    setTasks(loadedTasks);

    const loadedRoadmaps = await RoadmapService.getRoadmaps(user.id);
    setRoadmaps(loadedRoadmaps);
  };

  // Reload tasks when selected date changes (with auto-rollover)
  useEffect(() => {
    const loadDateTasks = async () => {
      await TaskService.rolloverIncompleteTasks(currentUser.id, selectedDate);
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

    // Refresh roadmaps in case this task was linked to a roadmap milestone!
    const refreshedRoadmaps = await RoadmapService.getRoadmaps(currentUser.id);
    setRoadmaps(refreshedRoadmaps);
  };

  const handleAddTask = async (taskPartial: Partial<Task>) => {
    const created = await TaskService.createTask(currentUser.id, taskPartial);
    setTasks(prev => [created, ...prev]);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const updated = await TaskService.updateTask(currentUser.id, taskId, updates);
    if (updated) {
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await TaskService.deleteTask(currentUser.id, taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleMoveToNextDay = async (taskId: string) => {
    await TaskService.moveTaskToNextDay(currentUser.id, taskId);
    const refreshed = await TaskService.getTasks(currentUser.id, selectedDate);
    setTasks(refreshed);
  };

  const handleResetRoutine = async () => {
    const fresh = await TaskService.resetDailyRoutine(currentUser.id, selectedDate);
    setTasks(fresh);
  };

  const handleCreateRoadmapFromTemplate = async (templateId: string) => {
    const created = await RoadmapService.createRoadmapFromTemplate(currentUser.id, templateId);
    setRoadmaps(prev => [created, ...prev]);

    // Refresh today's tasks to sync the new active milestone
    const refreshed = await TaskService.getTasks(currentUser.id, selectedDate);
    setTasks(refreshed);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('light-theme', isDarkMode);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Header
        user={currentUser}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Body with Responsive Sidebar & Tab Views */}
      <div style={{ flex: 1, display: 'flex', paddingBottom: '70px' }}>
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* View Content Panel */}
        <main style={{ flex: 1, padding: '0 0.8rem 0.8rem 0.8rem', maxWidth: '1400px', width: '100%' }}>
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
              onNavigateTab={setActiveTab}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskViews
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'roadmaps' && (
            <RoadmapsView
              roadmaps={roadmaps}
              onCreateFromTemplate={handleCreateRoadmapFromTemplate}
            />
          )}

          {activeTab === 'learning' && <TechLearningView />}
          {activeTab === 'fitness' && <WorkoutView />}
          {activeTab === 'recipes' && <RecipesView />}
          {activeTab === 'investment' && <InvestmentView />}
          {activeTab === 'errands' && <ErrandsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
      />
    </div>
  );
};

export default App;
