
import React, { useState, useEffect } from 'react';
import { Settings, Download, Trash2, User, Cloud, LogIn, UserPlus, CheckCircle2, AlertCircle, RefreshCw, AlertTriangle, Database, Save, X, Globe } from 'lucide-react';
import { Task, UserProfile, Language } from '../types';
import { cloudSync } from '../services/firestoreService';
import { isFirebaseConfigured, saveConfig, clearConfig, FirebaseConfig } from '../services/firebaseConfig';
import { getAvatarUrl } from '../services/syncService';
import { useLanguage } from '../services/i18n';

interface SettingsViewProps {
    tasks: Task[];
    onClearData: () => void;
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'register';

const SettingsView: React.FC<SettingsViewProps> = ({ tasks, onClearData, user, onUpdateUser }) => {
    const { t, language, setLanguage } = useLanguage();
    const [mode, setMode] = useState<AuthMode>('register');
    const [localName, setLocalName] = useState(user.name);
    const [passphrase, setPassphrase] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Config State
    const [isConfigured, setIsConfigured] = useState(isFirebaseConfigured());
    const [showConfig, setShowConfig] = useState(!isConfigured);
    const [configInput, setConfigInput] = useState('');

    const isConnected = !!user.syncCode && user.syncCode.length >= 4;

    const handleSaveConfig = () => {
        try {
            let cleanInput = configInput.trim();
            cleanInput = cleanInput.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
            cleanInput = cleanInput.replace(/^\s*import\s+[\s\S]*?from\s+['"].*['"];?/gm, '');

            const configVarMatch = cleanInput.match(/firebaseConfig\s*=\s*({[\s\S]*})/);
            if (configVarMatch) {
                // heuristic fallback handled below by brace finding
            }

            const firstBrace = cleanInput.indexOf('{');
            const lastBrace = cleanInput.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
                throw new Error("No se encontró un objeto de configuración válido ({...}).");
            }

            cleanInput = cleanInput.substring(firstBrace, lastBrace + 1);
            cleanInput = cleanInput.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
            cleanInput = cleanInput.replace(/([{,]\s*)'([a-zA-Z0-9_$]+)'\s*:/g, '$1"$2":');
            cleanInput = cleanInput.replace(/:\s*'([^']*)'/g, ': "$1"');
            cleanInput = cleanInput.replace(/,(\s*})/g, '$1');

            const config = JSON.parse(cleanInput) as FirebaseConfig;

            if (!config.apiKey || !config.projectId) {
                throw new Error("Faltan campos obligatorios (apiKey, projectId)");
            }

            saveConfig(config);
            setIsConfigured(true);
            setShowConfig(false);
        } catch (e: any) {
            console.error("Config Parsing Error:", e);
            setErrorMsg("Error al leer la configuración. Copia solo el objeto {...} o asegúrate de que contenga 'apiKey'.");
        }
    };

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
        if (!isConfigured) {
            setErrorMsg("Primero debes configurar la base de datos (Infraestructura).");
            setShowConfig(true);
            return;
        }

        setIsLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const result = await cloudSync.loadTasks(passphrase);

            if (result !== null) {
                console.log("Data loaded:", result.length);
            } else {
                console.log("No data found, creating new session.");
            }

            onUpdateUser({
                name: localName || 'Usuario',
                syncCode: passphrase,
                avatarSeed: localName || 'Usuario'
            });
            setSuccessMsg(result ? "¡Conectado! Datos cargados." : "¡Espacio creado! Listo para sincronizar.");
            setPassphrase('');
        } catch (error: any) {
            console.error("Login Error:", error);
            let msg = "No se pudo conectar.";
            if (error.code === 'permission-denied') msg = "Permiso denegado. Verifica las Reglas de Firestore (allow read, write: if true).";
            if (error.code === 'unavailable') msg = "Sin conexión a internet o servicio caído.";
            if (error.message && error.message.includes("api-key")) msg = "API Key inválida.";

            setErrorMsg(`${msg} (${error.code || error.message})`);
        } finally {
            setIsLoading(false);
        }
    };

    // Register is effectively the same as Login in the new "Key-Value" model 
    const handleRegister = handleLogin;

    return (
        <div className="p-4 md:p-8 h-full flex flex-col bg-slate-900 overflow-y-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Settings className="text-blue-500" size={32} />
                    <h2 className="text-2xl md:text-3xl font-bold text-white">{t('settings.title')}</h2>
                </div>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-xs text-slate-500 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700"
                >
                    <Database size={12} /> {isConfigured ? t('settings.db_configured') : t('settings.configure_db')}
                </button>
            </div>

            <div className="space-y-8 max-w-2xl pb-24 mx-auto w-full">

                {/* LANGUAGE SELECTOR */}
                <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">{t('settings.language')}</h3>
                            <p className="text-slate-400 text-xs">Español, English, Indonesia</p>
                        </div>
                    </div>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="id">Indonesia</option>
                    </select>
                </div>

                {/* Database Config Modal/Section */}
                {showConfig && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-blue-500/50 shadow-2xl overflow-hidden relative">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-4 text-blue-400">
                                <Database size={24} />
                                <h3 className="text-xl font-bold text-white">{t('settings.cloud_infra')}</h3>
                            </div>
                            <p className="text-slate-300 text-sm mb-4" dangerouslySetInnerHTML={{ __html: t('settings.sync_info') }}></p>

                            <ol className="list-decimal list-inside text-xs text-slate-400 mb-6 space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                <li>Ve a <a href="https://console.firebase.google.com" target="_blank" className="text-blue-400 underline hover:text-blue-300">Firebase Console</a> y crea un proyecto.</li>
                                <li>Entra a <strong>Project Settings</strong> (icono engranaje).</li>
                                <li>Abajo, en "Your apps", selecciona Web (&lt;/&gt;) y regístrate.</li>
                                <li>Copia el objeto <code>firebaseConfig</code> (o <code>config</code>) completo.</li>
                                <li>Ve a <strong>Build {'>'} Firestore Database</strong> y crea una base de datos.</li>
                                <li>En "Rules", cambia <code>allow read, write: if false;</code> por <code>if true;</code> (Modo prueba).</li>
                            </ol>

                            <textarea
                                value={configInput}
                                onChange={(e) => setConfigInput(e.target.value)}
                                placeholder={'{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "..."\n}'}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 font-mono text-xs text-green-400 h-32 focus:border-blue-500 outline-none resize-none mb-4"
                            />

                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">{t('settings.gemini_key')}</label>
                                <input
                                    type="password"
                                    defaultValue={localStorage.getItem('tm_gemini_key') || ''}
                                    onBlur={(e) => localStorage.setItem('tm_gemini_key', e.target.value)}
                                    placeholder="Ej. AIzaSy..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:border-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Consigue tu llave gratis en <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-400 underline">Google AI Studio</a></p>
                            </div>

                            {errorMsg && !isConfigured && (
                                <p className="text-red-400 text-xs mb-4 flex items-center gap-2"><AlertCircle size={12} /> {errorMsg}</p>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveConfig}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> {t('settings.save_config')}
                                </button>
                                {isConfigured && (
                                    <button
                                        onClick={() => {
                                            if (confirm("¿Borrar configuración? Se perderá la conexión.")) clearConfig();
                                        }}
                                        className="px-4 bg-slate-800 hover:bg-red-900/30 text-red-400 rounded-xl border border-slate-700"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Auth Section - Only show if Configured */}
                {isConfigured && !showConfig && (
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
                                <h3 className="text-xl font-bold text-white mb-1">{t('settings.hello_user', user.name)}</h3>
                                <p className="text-green-400 font-medium text-sm mb-6 flex items-center gap-2 justify-center">
                                    <CheckCircle2 size={16} /> {t('settings.cloud_connected')}
                                </p>

                                <div className="bg-slate-900/50 rounded-xl p-4 w-full mb-6 border border-slate-700/50 flex flex-col items-center">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{t('settings.access_key')}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-slate-300 text-lg tracking-widest">••••••••</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (confirm("¿Cerrar sesión?")) {
                                            onUpdateUser({ ...user, syncCode: '' });
                                            setSuccessMsg(null);
                                            setErrorMsg(null);
                                        }
                                    }}
                                    className="text-red-400 hover:text-red-300 text-sm font-bold px-6 py-2 rounded-lg hover:bg-red-900/10 transition-colors"
                                >
                                    {t('settings.disconnect')}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <div className="flex border-b border-slate-700">
                                    <button
                                        onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
                                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'register' ? 'bg-slate-700/50 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <UserPlus size={18} /> {t('settings.create_connect')}
                                    </button>
                                </div>

                                <div className="p-6 md:p-8 space-y-5">
                                    <div className="text-center mb-4">
                                        <h3 className="text-lg font-bold text-white">
                                            {t('settings.cloud_sync_title')}
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {t('settings.cloud_sync_desc')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('settings.name_label')}</label>
                                        <input
                                            type="text"
                                            value={localName}
                                            onChange={(e) => setLocalName(e.target.value)}
                                            placeholder={t('settings.name_placeholder')}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                                            {t('settings.key_label')}
                                        </label>
                                        <input
                                            type="password"
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            placeholder={t('settings.key_placeholder')}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:border-blue-500 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-slate-500 px-1">{t('settings.key_help')}</p>
                                    </div>

                                    {errorMsg && (
                                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                            <div className="text-red-200 text-xs">
                                                <p className="font-bold mb-1">Error</p>
                                                <p>{errorMsg}</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleLogin}
                                        disabled={isLoading}
                                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isLoading ? 'bg-slate-600 cursor-not-allowed' :
                                            'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <><RefreshCw className="animate-spin" size={20} /> {t('settings.connecting')}</>
                                        ) : (
                                            <><Cloud size={20} /> {t('settings.connect_button')}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tools Section */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleExport}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-2xl border border-slate-700 transition-all flex flex-col items-center gap-2 text-xs font-bold"
                    >
                        <Download size={20} className="text-green-500" /> {t('settings.export_json')}
                    </button>
                    <button
                        onClick={() => {
                            if (confirm(t('settings.delete_app_confirm'))) onClearData();
                        }}
                        className="bg-slate-800 hover:bg-red-900/20 text-slate-300 p-4 rounded-2xl border border-slate-700 transition-all flex flex-col items-center gap-2 text-xs font-bold"
                    >
                        <Trash2 size={20} className="text-red-500" /> {t('settings.delete_app')}
                    </button>
                </div>

                <div className="text-center text-slate-600 text-[10px] tracking-widest uppercase py-4">
                    TaskMaster AI • Firestore Edition v5.0
                </div>
            </div>
        </div >
    );
};

export default SettingsView;
