import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onStateChange?: (isRecording: boolean) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, onStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setBrowserSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript.trim() !== '') {
        onTranscription(finalTranscript.trim());
      }
    };

    rec.onerror = (err: any) => {
      console.error('Speech recognition error:', err);
      setIsRecording(false);
      if (onStateChange) onStateChange(false);
    };

    rec.onend = () => {
      setIsRecording(false);
      if (onStateChange) onStateChange(false);
    };

    recognitionRef.current = rec;
  }, [onTranscription, onStateChange]);

  const toggleRecording = () => {
    if (!browserSupported || !recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (onStateChange) onStateChange(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        if (onStateChange) onStateChange(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  if (!browserSupported) {
    return (
      <div className="flex items-center space-x-2 text-yellow-500/80 bg-yellow-500/5 px-4 py-2.5 rounded-xl border border-yellow-500/10 text-xs">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>Voice input requires Chrome/Edge (Web Speech API is not supported in this browser).</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={toggleRecording}
        className={`relative p-5 rounded-full flex items-center justify-center transition-all duration-300 border ${
          isRecording
            ? 'bg-red-500/10 border-red-500 text-red-500 shadow-neon-pink scale-110'
            : 'bg-cyber-light/10 border-cyber-light/30 text-cyber-light hover:bg-cyber-light/20 hover:scale-105 shadow-neon-cyan'
        }`}
      >
        {isRecording ? (
          <>
            <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-red-400 opacity-20"></span>
            <MicOff className="w-6 h-6 z-10" />
          </>
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
      <span className={`text-xs ${isRecording ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
        {isRecording ? 'Listening... Speak now.' : 'Click to answer with voice'}
      </span>
    </div>
  );
};
export default VoiceRecorder;
