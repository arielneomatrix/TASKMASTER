
import React, { useState } from 'react';
import { Task } from '../types';
import { generateDailySummary, playAudioSummary } from '../services/geminiService';
import { Play, Sparkles, Loader2, Volume2 } from 'lucide-react';
import { useLanguage } from '../services/i18n';

interface AssistantViewProps {
  tasks: Task[];
  date: string;
}

const AssistantView: React.FC<AssistantViewProps> = ({ tasks, date }) => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleWhatsNew = async () => {
    setIsLoading(true);
    try {
      const text = await generateDailySummary(tasks, date);
      setSummary(text);
      setIsPlaying(true);
      await playAudioSummary(text);
      setIsPlaying(false);
    } catch (e) {
      console.error(e);
      setSummary(t('assistant.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 md:p-8 text-center space-y-6 md:space-y-8 bg-gradient-to-b from-slate-900 to-slate-800 overflow-y-auto">

      <div className="relative">
        <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
        <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center shadow-2xl relative z-10">
          <Sparkles className="text-blue-400" size={32} md:size={40} />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white">{t('assistant.greeting')}</h2>
        <p className="text-slate-400 text-sm md:text-base">
          {t('assistant.intro', new Date(date).toLocaleDateString())}
        </p>
      </div>

      <button
        onClick={handleWhatsNew}
        disabled={isLoading}
        className="w-full md:w-auto group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-full focus:outline-none hover:bg-blue-500 disabled:opacity-50 active:scale-95"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin mr-2" /> {t('assistant.thinking')}
          </>
        ) : isPlaying ? (
          <>
            <Volume2 className="animate-pulse mr-2" /> {t('assistant.speaking')}
          </>
        ) : (
          <>
            <Play className="mr-2 fill-current" /> {t('assistant.play')}
          </>
        )}
      </button>

      {summary && (
        <div className="mt-4 md:mt-8 bg-slate-800/50 border border-slate-700 p-5 md:p-6 rounded-2xl max-w-lg text-left shadow-inner">
          <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">{t('assistant.transcript')}</h3>
          <p className="text-slate-300 leading-relaxed font-light text-sm md:text-base">
            "{summary}"
          </p>
        </div>
      )}
    </div>
  );
};

export default AssistantView;
