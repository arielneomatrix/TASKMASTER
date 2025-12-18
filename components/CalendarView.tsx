import React from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentDate, onSelectDate, tasks }) => {
  const dateObj = new Date(currentDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const changeMonth = (offset: number) => {
    const newDate = new Date(year, month + offset, 1);
    onSelectDate(newDate.toISOString().split('T')[0]);
  };

  const getTaskCount = (day: number) => {
    const checkDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.date === checkDate).length;
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white capitalize">
          {dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white">
            <ChevronLeft />
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white">
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-4 text-slate-400 font-medium text-center">
        <div>DOM</div><div>LUN</div><div>MAR</div><div>MIE</div><div>JUE</div><div>VIE</div><div>SAB</div>
      </div>

      <div className="grid grid-cols-7 gap-4 flex-1 auto-rows-fr">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="bg-transparent" />;
          
          const count = getTaskCount(day);
          const isSelected = day === dateObj.getDate();
          
          return (
            <button
              key={day}
              onClick={() => {
                const newDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                onSelectDate(newDate);
              }}
              className={`relative p-4 rounded-xl border flex flex-col items-start justify-between transition-all ${
                isSelected 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-105 z-10' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <span className="text-xl font-bold">{day}</span>
              {count > 0 && (
                <div className="flex items-center space-x-1 mt-2">
                   <div className="w-2 h-2 rounded-full bg-green-400"></div>
                   <span className="text-xs opacity-80">{count} Tareas</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;