
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import CalendarView from './components/CalendarView';
import AssistantView from './components/AssistantView';
import SettingsView from './components/SettingsView';
import StatisticsView from './components/StatisticsView';
import { Task, ViewState, UserProfile, SyncStatus } from './types';
import { cloudSync } from './services/firestoreService';
import { getLocalISODate, parseLocalDate } from './services/dateUtils';
import { Menu, Cloud, CloudSync as SyncIcon, Check } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.TASKS);
  // FIX: Usar getLocalISODate para evitar errores de zona horaria
  const [selectedDate, setSelectedDate] = useState<string>(getLocalISODate());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<UserProfile>({ name: '', syncCode: '', avatarSeed: 'Jarvis' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Load local settings and tasks initially
  useEffect(() => {
    const savedUser = localStorage.getItem('tm_user');
    const savedTasks = localStorage.getItem('tm_tasks');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    // Resetear siempre a "Hoy" al abrir la app, aunque permita navegación después
    setSelectedDate(getLocalISODate());
  }, []);

  // Sync with Cloud when tasks change (Debounced) - DEPRECATED for critical actions
  // Removed debounce logic to prevent data loss on casual close
  useEffect(() => {
    localStorage.setItem('tm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Periodic Cloud Pull (Check for updates from other devices)
  useEffect(() => {
    if (!user.syncCode || user.syncCode.length < 3) return;

    // Carga inicial inmediata al detectar código
    const initialLoad = async () => {
      const cloudTasks = await cloudSync.loadTasks(user.syncCode);
      if (cloudTasks) setTasks(cloudTasks);
    };
    initialLoad();

    const interval = setInterval(async () => {
      // Only pull if we are not currently saving to avoid race conditions
      if (syncStatus === 'syncing') return;

      const cloudTasks = await cloudSync.loadTasks(user.syncCode);
      if (cloudTasks) {
        // Estrategia simple: la nube manda. 
        // En una app más compleja haríamos merge por timestamp, 
        // pero para asegurar consistencia ahora, actualizamos si hay diferencias en longitud.
        setTasks(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(cloudTasks)) {
            return cloudTasks;
          }
          return prev;
        });
      }
    }, 10000); // 10s polling for Firestore

    return () => clearInterval(interval);
  }, [user.syncCode]);

  // Helper to save immediately
  const saveToCloudImmediate = async (newTasks: Task[]) => {
    if (user.syncCode && user.syncCode.length > 3) {
      setSyncStatus('syncing');
      // Small delay just to show spinner/feedback, but execution is immediate
      try {
        const success = await cloudSync.saveTasks(user.syncCode, newTasks);
        setSyncStatus(success ? 'synced' : 'error');
      } catch (e) {
        setSyncStatus('error');
      }
    }
  };

  const addTask = (task: Task) => {
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    saveToCloudImmediate(newTasks);
  };

  const toggleTask = (id: string) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    saveToCloudImmediate(newTasks);
  };

  const editTask = (updatedTask: Task) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTasks);
    saveToCloudImmediate(newTasks);
  };

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    saveToCloudImmediate(newTasks);
  };

  const handleUpdateUser = async (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('tm_user', JSON.stringify(newUser));

    if (newUser.syncCode) {
      setSyncStatus('syncing');
      const cloudTasks = await cloudSync.loadTasks(newUser.syncCode);
      if (cloudTasks) {
        setTasks(cloudTasks);
        setSyncStatus('synced');
      } else {
        // Si no hay datos, pero tenemos tareas locales, sincronizamos lo local
        if (tasks.length > 0) {
          await cloudSync.saveTasks(newUser.syncCode, tasks);
          setSyncStatus('synced');
        } else {
          // Si no hay ni local ni remoto, está "sincronizado" en vacío
          setSyncStatus('synced');
        }
      }
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCurrentView(ViewState.TASKS);
    setIsSidebarOpen(false);
  };

  const handleClearData = () => {
    setTasks([]);
    localStorage.removeItem('tm_tasks');
  };

  const changeDay = (offset: number) => {
    const dateObj = parseLocalDate(selectedDate);
    dateObj.setDate(dateObj.getDate() + offset);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    setSelectedDate(`${year}-${month}-${day}`);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className={`fixed md:relative z-50 h-full transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar
          currentView={currentView}
          onChangeView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }}
          syncStatus={syncStatus}
          user={user}
        />
      </div>

      <main className="flex-1 relative bg-slate-900 shadow-2xl overflow-hidden md:rounded-tl-3xl border-t border-l border-slate-800 ml-0 md:ml-[-1px] md:mt-2 flex flex-col">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
            <span className="ml-4 font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">TaskMaster AI</span>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus === 'syncing' && <SyncIcon size={18} className="text-blue-400 animate-spin" />}
            {syncStatus === 'synced' && <Cloud size={18} className="text-green-500" />}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {currentView === ViewState.TASKS && (
            <TaskView
              tasks={tasks.filter(t => t.date === selectedDate)}
              date={selectedDate}
              onAddTask={addTask}
              onToggleTask={toggleTask}
              onEditTask={editTask}
              onDeleteTask={deleteTask}
              onNextDay={() => changeDay(1)}
              onPrevDay={() => changeDay(-1)}
            />
          )}
          {currentView === ViewState.CALENDAR && (
            <CalendarView currentDate={selectedDate} onSelectDate={handleDateSelect} tasks={tasks} />
          )}
          {currentView === ViewState.ASSISTANT && (
            <AssistantView tasks={tasks.filter(t => t.date === selectedDate)} date={selectedDate} />
          )}
          {currentView === ViewState.STATISTICS && (
            <StatisticsView tasks={tasks} />
          )}
          {currentView === ViewState.SETTINGS && (
            <SettingsView tasks={tasks} onClearData={handleClearData} user={user} onUpdateUser={handleUpdateUser} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
