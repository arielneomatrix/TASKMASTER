
import React, { useState } from 'react';
import { Settings, Download, Trash2, User, Cloud, LogIn, UserPlus, CheckCircle2, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Task, UserProfile } from '../types';
import { getAvatarUrl, cloudSync } from '../services/syncService';

interface SettingsViewProps {
  tasks: Task[];
  onClearData: () => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'register';

const SettingsView: React.FC<SettingsViewProps> = ({ tasks, onClearData, user, onUpdateUser }) => {
  const [mode, setMode] = useState<AuthMode>('register');
  const [localName, setLocalName] = useState(user.name);
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isConnected = !!user.syncCode && user.syncCode.length > 10;

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tareas_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLogin = async () => {
    if (passphrase.length < 4) {
        setErrorMsg("La clave debe tener al menos 4 caracteres.");
        return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await cloudSync.login(passphrase);
    
    if (result) {
        onUpdateUser({
            name: localName || 'Usuario', 
            syncCode: result.id,
            avatarSeed: localName || 'Usuario'
        });
        setSuccessMsg("¡Sesión iniciada! Tus tareas se están descargando...");
        setPassphrase('');
    } else {
        setErrorMsg("No encontramos una cuenta con esa clave. Verifica que sea correcta.");
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
    if (passphrase.length < 4) {
        setErrorMsg("La clave es muy corta.");
        return;
    }
    if (!localName) {
        setErrorMsg("Necesitamos tu nombre para el perfil.");
        return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await cloudSync.register(passphrase, tasks);

    if (result === "EXISTS") {
        setErrorMsg("Esa clave ya existe. Prueba otra o Inicia Sesión.");
    } else if (result) {
        onUpdateUser({
            name: localName,
            syncCode: result,
            avatarSeed: localName
        });
        setSuccessMsg("¡Cuenta creada! Tu espacio en la nube está listo.");
        setPassphrase('');
    } else {
        setErrorMsg("Error de conexión con la nube. Por favor, intenta de nuevo en unos segundos.");
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col bg-slate-900 overflow-y-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-blue-500" size={32} />
        <h2 className="text-2xl md:text-3xl font-bold text-white">Cuenta y Nube</h2>
      </div>

      <div className="space-y-8 max-w-2xl pb-24 mx-auto w-full">
        
        {/* Auth Section */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
          
          {isConnected ? (
             <div className="p-8 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border-2 border-green-500/50 relative">
                    <img 
                        src={getAvatarUrl(user.avatarSeed)} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full opacity-80"
                    />
                    <div className="absolute bottom-0 right-0 bg-green-500 text-slate-900 rounded-full p-1 border-2 border-slate-800">
                        <Cloud size={16} />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">¡Hola, {user.name}!</h3>
                <p className="text-green-400 font-medium text-sm mb-6 flex items-center gap-2 justify-center">
                    <CheckCircle2 size={16} /> Sincronización Automática Activa
                </p>
                
                <div className="bg-slate-900/50 rounded-xl p-4 w-full mb-6 border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Tu ID Seguro</p>
                    <p className="font-mono text-slate-300 text-xs truncate opacity-70">{user.syncCode}</p>
                </div>

                <button 
                    onClick={() => {
                        if(confirm("¿Cerrar sesión?")) {
                            onUpdateUser({...user, syncCode: ''});
                            setSuccessMsg(null);
                            setErrorMsg(null);
                        }
                    }}
                    className="text-red-400 hover:text-red-300 text-sm font-bold px-6 py-2 rounded-lg hover:bg-red-900/10 transition-colors"
                >
                    Cerrar Sesión
                </button>
             </div>
          ) : (
             <div className="flex flex-col">
                <div className="flex border-b border-slate-700">
                    <button 
                        onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'register' ? 'bg-slate-700/50 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <UserPlus size={18} /> CREAR CUENTA
                    </button>
                    <button 
                        onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'login' ? 'bg-slate-700/50 text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <LogIn size={18} /> INICIAR SESIÓN
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-5">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-white">
                            {mode === 'register' ? 'Empieza a sincronizar' : 'Bienvenido de nuevo'}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            {mode === 'register' 
                                ? 'Crea una clave única para guardar tus tareas en la nube.' 
                                : 'Introduce tu clave para recuperar tus tareas.'}
                        </p>
                    </div>

                    {mode === 'register' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tu Nombre</label>
                            <input 
                                type="text" 
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                placeholder="Ej. Ariel"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                            {mode === 'register' ? 'Crea tu Clave Secreta' : 'Tu Clave Secreta'}
                        </label>
                        <input 
                            type="text"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)} 
                            placeholder={mode === 'register' ? "ej. ariel-master-2024" : "Tu clave secreta..."}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:border-blue-500 outline-none transition-all"
                        />
                        {mode === 'register' && (
                             <p className="text-[10px] text-slate-500 px-1">Usa esta misma clave en tu celular y PC.</p>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="text-red-200 text-xs">
                                <p className="font-bold mb-1">¡Ups! Algo falló.</p>
                                <p>{errorMsg}</p>
                            </div>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 size={18} className="text-green-400 shrink-0 mt-0.5" />
                            <div className="text-green-200 text-xs">
                                <p className="font-bold mb-1">¡Éxito!</p>
                                <p>{successMsg}</p>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={mode === 'register' ? handleRegister : handleLogin}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                            isLoading ? 'bg-slate-600 cursor-not-allowed' :
                            mode === 'register' 
                                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' 
                                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'
                        }`}
                    >
                        {isLoading ? (
                            <><RefreshCw className="animate-spin" size={20} /> Conectando...</>
                        ) : mode === 'register' ? (
                            <><Cloud size={20} /> Crear Cuenta y Sincronizar</>
                        ) : (
                            <><LogIn size={20} /> Entrar y Sincronizar</>
                        )}
                    </button>
                </div>
             </div>
          )}
        </div>

        {/* Tools Section */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-2xl border border-slate-700 transition-all flex flex-col items-center gap-2 text-xs font-bold"
          >
            <Download size={20} className="text-green-500" /> GUARDAR COPIA
          </button>
          <button
            onClick={() => {
              if(confirm("¿Borrar todas las tareas de este dispositivo? Esta acción es irreversible.")) onClearData();
            }}
            className="bg-slate-800 hover:bg-red-900/20 text-slate-300 p-4 rounded-2xl border border-slate-700 transition-all flex flex-col items-center gap-2 text-xs font-bold"
          >
            <Trash2 size={20} className="text-red-500" /> BORRAR APP
          </button>
        </div>
        
        <div className="text-center text-slate-600 text-[10px] tracking-widest uppercase py-4">
          TaskMaster AI • Cloud Sync v4.1 (Stable)
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
