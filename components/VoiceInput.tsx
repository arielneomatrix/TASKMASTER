import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { blobToBase64 } from '../services/audioUtils';
import { transcribeAndExtractTask } from '../services/geminiService';
import { AiTaskResponse } from '../types';

interface VoiceInputProps {
  onTaskDetected: (task: AiTaskResponse) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTaskDetected }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' }); // or audio/webm
        
        try {
          const base64 = await blobToBase64(audioBlob);
          const result = await transcribeAndExtractTask(base64);
          onTaskDetected(result);
        } catch (err) {
          console.error("Transcription failed", err);
          alert("No se pudo procesar el audio. Verifica tu API Key o la consola.");
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
      alert("Acceso al micrófono denegado.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={`p-3 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center ${
        isRecording 
          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
          : isProcessing
            ? 'bg-slate-700 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500'
      }`}
      title={isRecording ? "Detener Grabación" : "Agregar Tarea por Voz"}
    >
      {isProcessing ? (
        <Loader2 className="animate-spin text-white" size={24} />
      ) : isRecording ? (
        <Square className="fill-current text-white" size={24} />
      ) : (
        <Mic className="text-white" size={24} />
      )}
    </button>
  );
};

export default VoiceInput;