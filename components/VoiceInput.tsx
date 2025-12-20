
import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { blobToBase64 } from '../services/audioUtils';
import { transcribeAndExtractTask } from '../services/geminiService';
import { AiTaskResponse } from '../types';
import { useLanguage } from '../services/i18n';

interface VoiceInputProps {
  onTaskDetected: (task: AiTaskResponse) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTaskDetected }) => {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Smart MIME Type Detection
      let mimeType = 'audio/webm'; // Default for Chrome/FF
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'; // Safari
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }

      console.log("Recording with MIME:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        // Important: Create blob with specific MIME type
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        try {
          const base64 = await blobToBase64(audioBlob);
          // Pass the actual MIME type to the service
          const result = await transcribeAndExtractTask(base64, mimeType);
          onTaskDetected(result);
        } catch (err) {
          console.error("Transcription failed", err);
          alert(t('voice.error_process'));
        } finally {
          setIsProcessing(false);
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic", err);
      alert(t('voice.error_mic'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`p-3 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center relative ${isRecording
          ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30'
          : isProcessing
            ? 'bg-slate-700 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500'
          }`}
        title={isRecording ? t('voice.stop') : t('voice.add_task')}
      >
        {isProcessing ? (
          <Loader2 className="animate-spin text-white" size={24} />
        ) : isRecording ? (
          <Square className="fill-current text-white" size={24} />
        ) : (
          <Mic className="text-white" size={24} />
        )}
      </button>
      {(isRecording || isProcessing) && (
        <span className="text-[10px] font-bold uppercase tracking-widest mt-1 animate-pulse text-blue-300">
          {isRecording ? t('voice.listening') : t('voice.processing')}
        </span>
      )}
    </div>
  );
};

export default VoiceInput;