
import React from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalISODate, parseLocalDate } from '../services/dateUtils';
import { useLanguage } from '../services/i18n';

interface CalendarViewProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentDate, onSelectDate, tasks }) => {
  const { t } = useLanguage();
  // Usamos el parser seguro que construye la fecha numéricamente
  const dateObj = parseLocalDate(currentDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const changeMonth = (offset: number) => {
    let newMonth = month + offset;
    let newYear = year;

    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }

    const newDateStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-01`;
    onSelectDate(newDateStr);
  };

  const getTaskCount = (day: number) => {
    const checkDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.date === checkDate).length;
  };

  const todayStr = getLocalISODate();
  const weekdays = t('calendar.weekdays').split('_');

  return (
    <div className="p-4 md:p-8 h-full flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white capitalize">
          {dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white active:scale-95">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white active:scale-95">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-4 mb-4 text-slate-500 font-bold text-center text-[10px] md:text-sm tracking-widest">
        {weekdays.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-4 auto-rows-fr">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="bg-transparent h-16 md:h-auto" />;

          const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = day === dateObj.getDate();
          const isToday = currentDayStr === todayStr;

          const count = getTaskCount(day);

          return (
            <button
              key={day}
              onClick={() => {
                onSelectDate(currentDayStr);
              }}
              className={`relative p-2 md:p-4 rounded-xl border flex flex-col items-center md:items-start justify-center md:justify-between transition-all aspect-square md:aspect-auto ${isSelected
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-105 z-10'
                  : isToday
                    ? 'bg-slate-800 border-blue-400 text-blue-100'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
            >
              <span className={`text-lg md:text-xl font-bold ${isToday && !isSelected ? 'text-blue-400' : ''}`}>{day}</span>

              {isToday && !isSelected && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}

              {count > 0 && (
                <div className="flex items-center space-x-1 mt-1 md:mt-2">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`}></div>
                  <span className="hidden md:inline text-xs opacity-80">{t('calendar.tasks_count', count)}</span>
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
