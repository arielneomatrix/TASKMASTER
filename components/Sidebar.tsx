import React from 'react';
import { LayoutDashboard, Calendar, Mic, Settings, ListTodo } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full p-4">
      <div className="mb-8 flex items-center space-x-2 px-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <ListTodo className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          TaskMaster
        </h1>
      </div>

      <nav className="space-y-2 flex-1">
        <NavItem view={ViewState.TASKS} icon={LayoutDashboard} label="Tareas Diarias" />
        <NavItem view={ViewState.CALENDAR} icon={Calendar} label="Calendario" />
        <NavItem view={ViewState.ASSISTANT} icon={Mic} label="Asistente" />
      </nav>

      <div className="pt-4 border-t border-slate-800">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-slate-300 transition-colors">
          <Settings size={20} />
          <span>Configuración</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;