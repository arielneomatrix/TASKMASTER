import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import CalendarView from './components/CalendarView';
import AssistantView from './components/AssistantView';
import { Task, ViewState } from './types';
import { playAudioSummary } from './services/geminiService';

const App: React.FC = () => {
  // Simple check for API Key
  const [hasKey, setHasKey] = useState(!!process.env.API_KEY || !!localStorage.getItem('GEMINI_API_KEY'));
  
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.TASKS);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Initialize key check
  useEffect(() => {
    if (!hasKey) {
      const key = prompt("Por favor ingresa tu API Key de Gemini para usar esta demo:");
      if (key) {
        localStorage.setItem('GEMINI_API_KEY', key);
        setHasKey(true);
      }
    }
  }, [hasKey]);

  // Load sample tasks or from local storage
  useEffect(() => {
    const saved = localStorage.getItem('tm_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  // Save tasks on change
  useEffect(() => {
    localStorage.setItem('tm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Alarm / Notification System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Unused variable for display, but could be useful for debugging
      const currentTime = now.toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const currentDate = now.toISOString().split('T')[0];

      tasks.forEach(task => {
        if (task.date === currentDate && !task.completed) {
          // Check for 1 hour before
          const [h, m] = task.time.split(':').map(Number);
          const taskTimeDate = new Date(now);
          taskTimeDate.setHours(h, m, 0);

          const diffMinutes = (taskTimeDate.getTime() - now.getTime()) / 60000;

          // Simple "Voice Notification" logic (approx 60 mins or 30 mins)
          // In a real app, we'd track "notified" state to prevent spamming
          if (diffMinutes > 59 && diffMinutes < 60) {
             playAudioSummary(`Recordatorio: Tienes ${task.title} en una hora.`);
          }
          if (diffMinutes > 29 && diffMinutes < 30) {
             playAudioSummary(`Atención: ${task.title} comienza en 30 minutos.`);
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks]);

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCurrentView(ViewState.TASKS);
  };

  if (!hasKey) return <div className="h-screen flex items-center justify-center text-white">Por favor refresca e ingresa una API Key.</div>;

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
      />
      
      <main className="flex-1 relative bg-slate-900 shadow-2xl overflow-hidden rounded-tl-3xl border-t border-l border-slate-800 ml-[-1px] mt-2">
        {currentView === ViewState.TASKS && (
          <TaskView 
            tasks={tasks.filter(t => t.date === selectedDate)} 
            date={selectedDate}
            onAddTask={addTask}
            onToggleTask={toggleTask}
          />
        )}
        
        {currentView === ViewState.CALENDAR && (
          <CalendarView 
            currentDate={selectedDate}
            onSelectDate={handleDateSelect}
            tasks={tasks}
          />
        )}

        {currentView === ViewState.ASSISTANT && (
          <AssistantView 
            tasks={tasks.filter(t => t.date === selectedDate)} 
            date={selectedDate}
          />
        )}
      </main>
    </div>
  );
};

export default App;