
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Calendar, Mic, Settings, ListTodo, Download, Cloud, CloudSync as SyncIcon, CloudOff, AlertCircle, BarChart3 } from 'lucide-react';
import { ViewState, SyncStatus, UserProfile } from '../types';
import { getAvatarUrl } from '../services/syncService';
import { useLanguage } from '../services/i18n';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  syncStatus: SyncStatus;
  user: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, syncStatus, user }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      onChangeView(ViewState.SETTINGS);
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === view
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="w-72 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full p-4 shrink-0">
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onChangeView(ViewState.TASKS)}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <ListTodo className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            TaskMaster
          </h1>
        </div>
      </div>

      {/* User Mini Profile */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <img
            src={getAvatarUrl(user.avatarSeed || user.name)}
            alt="Avatar"
            className="w-10 h-10 rounded-full bg-slate-700"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user.name || t('sidebar.guest')}</p>
            <div className="flex items-center gap-1.5">
              {syncStatus === 'synced' && (
                <>
                  <Cloud size={12} className="text-green-500" />
                  <span className="text-[10px] text-green-500 font-medium">{t('sidebar.synced')}</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <SyncIcon size={12} className="text-blue-400 animate-spin" />
                  <span className="text-[10px] text-blue-400 font-medium">{t('sidebar.uploading')}</span>
                </>
              )}
              {!user.syncCode && (
                <>
                  <CloudOff size={12} className="text-slate-500" />
                  <span className="text-[10px] text-slate-500 font-medium">{t('sidebar.local_only')}</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <AlertCircle size={12} className="text-red-400" />
                  <span className="text-[10px] text-red-400 font-medium">{t('sidebar.sync_error')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <NavItem view={ViewState.TASKS} icon={LayoutDashboard} label={t('sidebar.tasks')} />
        <NavItem view={ViewState.CALENDAR} icon={Calendar} label={t('sidebar.calendar')} />
        <NavItem view={ViewState.STATISTICS} icon={BarChart3} label={t('sidebar.statistics')} />
        <NavItem view={ViewState.ASSISTANT} icon={Mic} label={t('sidebar.assistant')} />
      </nav>

      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center space-x-3 px-4 py-3 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-xl transition-colors font-medium border border-blue-900/30"
        >
          <Download size={20} />
          <span>{t('sidebar.install')}</span>
        </button>

        <button
          onClick={() => onChangeView(ViewState.SETTINGS)}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === ViewState.SETTINGS
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
        >
          <Settings size={20} />
          <span>{t('sidebar.settings')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
