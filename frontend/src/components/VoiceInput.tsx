'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
  onAutoFill?: (value: string) => void;
  isVoiceOnly?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onError,
  onAutoFill,
  isVoiceOnly = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(false);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Default language

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        // Check for auto-fill patterns
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phonePattern = /\d{3}[-.]?\d{3}[-.]?\d{4}/;
        
        if (emailPattern.test(transcript) || phonePattern.test(transcript)) {
          const match = transcript.match(emailPattern) || transcript.match(phonePattern);
          if (match && onAutoFill) {
            onAutoFill(match[0]);
            trackEvent('voice_auto_fill', { type: emailPattern.test(transcript) ? 'email' : 'phone' });
          }
        }

        onTranscript(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionError) => {
        onError(`Error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (voiceOnlyMode) {
          setIsListening(false);
        }
      };

      setRecognition(recognition);
    }
  }, [onTranscript, onError, onAutoFill, voiceOnlyMode]);

  const toggleListening = () => {
    if (!recognition) {
      onError('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      trackEvent('voice_input_stopped');
    } else {
      recognition.start();
      trackEvent('voice_input_started');
      if (isVoiceOnly) {
        setVoiceOnlyMode(true);
      }
    }
    setIsListening(!isListening);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleListening}
        className={`p-2 rounded-full ${
          isListening ? 'bg-red-600' : 'bg-gray-700'
        } hover:bg-opacity-80 transition-colors`}
        title={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </button>
      {voiceOnlyMode && isListening && (
        <span className="text-sm text-gray-400">
          Say "Send it" to confirm
        </span>
      )}
    </div>
  );
}; 