
import React, { useState } from 'react';
import { Task, AiTaskResponse } from '../types';
import { generateTitleFromDescription } from '../services/geminiService';
import { playSuccessSound } from '../services/audioUtils';
import { formatDateFriendly } from '../services/dateUtils';
import { Plus, Clock, CheckCircle2, Circle, Wand2, Check } from 'lucide-react';
import VoiceInput from './VoiceInput';

interface TaskViewProps {
  tasks: Task[];
  date: string;
  onAddTask: (task: Task) => void;
  onToggleTask: (id: string) => void;
}

const TaskView: React.FC<TaskViewProps> = ({ tasks, date, onAddTask, onToggleTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [toast, setToast] = useState<{message: string, visible: boolean} | null>(null);

  const handleDescBlur = async () => {
    if (newTaskDesc.trim().length > 10 && !newTaskTitle) {
      setIsGeneratingTitle(true);
      const title = await generateTitleFromDescription(newTaskDesc);
      setNewTaskTitle(title);
      setIsGeneratingTitle(false);
    }
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDesc,
      time: newTaskTime || '09:00',
      date: date,
      completed: false
    };

    onAddTask(task);
    playSuccessSound();
    showToast("¡Tarea creada exitosamente!");

    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskTime('');
  };

  const handleVoiceData = (data: AiTaskResponse) => {
    setNewTaskTitle(data.title);
    setNewTaskDesc(data.description);
    if (data.time) setNewTaskTime(data.time);
  };

  const handleTaskToggle = (id: string, currentlyCompleted: boolean) => {
    onToggleTask(id);
    if (!currentlyCompleted) {
      playSuccessSound();
      showToast("¡Tarea completada!");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="flex flex-col h-full bg-slate-900/50 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 md:top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <Check size={18} />
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 md:p-8 pb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Mi Día</h2>
        <p className="text-slate-400 capitalize text-sm md:text-base">
          {formatDateFriendly(date)}
        </p>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-48">
        <div className="space-y-3">
          {sortedTasks.length === 0 && (
            <div className="text-center py-20 text-slate-600">
              <p>No hay tareas para hoy.</p>
              <p className="text-sm mt-2">¡Escribe algo abajo o usa tu voz!</p>
            </div>
          )}
          
          {sortedTasks.map(task => (
            <div 
              key={task.id} 
              className={`group flex items-start gap-3 md:gap-4 p-4 rounded-xl border transition-all ${
                task.completed 
                  ? 'bg-slate-900/30 border-slate-800 opacity-60' 
                  : 'bg-slate-800 border-slate-700 hover:border-blue-500/50'
              }`}
            >
              <button 
                onClick={() => handleTaskToggle(task.id, task.completed)}
                className="mt-1 text-slate-400 hover:text-blue-500 transition-colors p-1"
              >
                {task.completed ? <CheckCircle2 className="text-green-500" size={24} /> : <Circle size={24} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-base md:text-lg truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-slate-400 text-xs md:text-sm mt-1 line-clamp-2 md:line-clamp-none">{task.description}</p>
                )}
              </div>

              <div className="flex items-center text-slate-500 text-xs bg-slate-900 px-2 py-1 rounded-md shrink-0">
                <Clock size={12} className="mr-1" />
                {task.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <div className="max-w-4xl mx-auto bg-slate-800 rounded-2xl p-3 md:p-4 shadow-2xl border border-slate-700 flex flex-col gap-3">
           {/* Primary Inputs Row */}
           <div className="flex flex-col md:flex-row gap-2">
             <div className="relative flex-1">
               <input
                 type="text"
                 placeholder="Título de la tarea..."
                 value={newTaskTitle}
                 onChange={(e) => setNewTaskTitle(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 md:py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
               />
               {isGeneratingTitle && (
                 <Wand2 size={16} className="absolute right-3 top-4 md:top-3 text-purple-400 animate-pulse" />
               )}
             </div>
             <input
               type="time"
               value={newTaskTime}
               onChange={(e) => setNewTaskTime(e.target.value)}
               className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 md:py-2 text-white focus:outline-none focus:border-blue-500 w-full md:w-32"
             />
           </div>

           {/* Description and Actions Row */}
           <div className="flex gap-2 items-center">
             <input
               type="text"
               placeholder="Descripción detallada..."
               value={newTaskDesc}
               onChange={(e) => setNewTaskDesc(e.target.value)}
               onBlur={handleDescBlur}
               className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 md:py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
             />
             
             <div className="flex gap-2">
               <VoiceInput onTaskDetected={handleVoiceData} />
               <button
                 onClick={() => handleSubmit()}
                 className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full transition-colors shadow-lg active:scale-95"
               >
                 <Plus size={24} />
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TaskView;
