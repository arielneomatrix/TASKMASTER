import React, { useState } from 'react';
import { Task } from '../types';
import { generateDailySummary, playAudioSummary } from '../services/geminiService';
import { Play, Sparkles, Loader2, Volume2 } from 'lucide-react';

interface AssistantViewProps {
  tasks: Task[];
  date: string;
}

const AssistantView: React.FC<AssistantViewProps> = ({ tasks, date }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleWhatsNew = async () => {
    setIsLoading(true);
    try {
      // 1. Generate Text Summary
      const text = await generateDailySummary(tasks, date);
      setSummary(text);
      
      // 2. Play Audio
      setIsPlaying(true);
      await playAudioSummary(text);
      setIsPlaying(false);
    } catch (e) {
      console.error(e);
      setSummary("Lo siento, encontré un error al revisar tu agenda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 bg-gradient-to-b from-slate-900 to-slate-800">
      
      <div className="relative">
        <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full"></div>
        <div className="w-24 h-24 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center shadow-2xl relative z-10">
          <Sparkles className="text-blue-400" size={40} />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-3xl font-bold text-white">Hola, Buenos Días</h2>
        <p className="text-slate-400">
          ¿Listo para escuchar tu agenda del {new Date(date).toLocaleDateString('es-ES')}?
        </p>
      </div>

      <button
        onClick={handleWhatsNew}
        disabled={isLoading}
        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin mr-2" /> Pensando...
          </>
        ) : isPlaying ? (
          <>
             <Volume2 className="animate-pulse mr-2" /> Hablando...
          </>
        ) : (
          <>
            <Play className="mr-2 fill-current" /> Reproducir Resumen Diario
          </>
        )}
      </button>

      {summary && (
        <div className="mt-8 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl max-w-lg text-left shadow-inner">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Transcripción</h3>
          <p className="text-slate-300 leading-relaxed font-light">
            "{summary}"
          </p>
        </div>
      )}
    </div>
  );
};

export default AssistantView;