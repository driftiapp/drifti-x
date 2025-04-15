import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Check, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Web Speech API Type Definitions
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface VoiceOrderProps {
  onOrderComplete: (order: string) => void;
  onCancel: () => void;
}

const VoiceOrder: React.FC<VoiceOrderProps> = ({ onOrderComplete, onCancel }) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = () => {
    setIsProcessing(true);
    // Simulate processing delay
    setTimeout(() => {
      onOrderComplete(transcript);
      setIsProcessing(false);
    }, 1000);
  };

  const handleRetry = () => {
    setTranscript('');
    setError(null);
    startListening();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-effect p-6 rounded-2xl max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 gradient-text">
          {t('voiceOrder.title')}
        </h2>
        <p className="text-gray-300">
          {t('voiceOrder.description')}
        </p>
      </div>

      <div className="relative mb-6">
        <motion.div
          animate={isListening ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: isListening 
              ? 'radial-gradient(circle, rgba(147,51,234,0.2) 0%, rgba(147,51,234,0.1) 100%)'
              : 'transparent'
          }}
        >
          {isListening ? (
            <Mic className="w-12 h-12 text-purple-500 animate-pulse" />
          ) : (
            <MicOff className="w-12 h-12 text-gray-400" />
          )}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 text-sm mb-4"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-24 p-4 rounded-lg bg-gray-800/50 border border-white/10">
          <p className="text-gray-300">
            {transcript || t('voiceOrder.speakNow')}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? stopListening : startListening}
          className="btn-primary bg-purple-600 hover:bg-purple-700"
          disabled={isProcessing}
        >
          {isListening ? t('voiceOrder.stop') : t('voiceOrder.start')}
        </motion.button>

        {transcript && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="btn-primary bg-green-600 hover:bg-green-700"
              disabled={isProcessing}
            >
              <Check className="w-5 h-5 mr-2" />
              {t('voiceOrder.submit')}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              className="btn-secondary"
              disabled={isProcessing}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {t('voiceOrder.retry')}
            </motion.button>
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="btn-secondary"
          disabled={isProcessing}
        >
          <X className="w-5 h-5 mr-2" />
          {t('voiceOrder.cancel')}
        </motion.button>
      </div>

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <div className="spinner mx-auto" />
          <p className="text-gray-400 mt-2">{t('voiceOrder.processing')}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VoiceOrder; 