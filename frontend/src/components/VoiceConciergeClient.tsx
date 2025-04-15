'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

// Development logging utility
const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[VoiceConcierge]', ...args);
  }
};

// Analytics tracking utility
const trackEvent = (eventName: string, metadata?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: 'voice_concierge',
      ...metadata
    });
  }
};

// Performance monitoring utility
const trackPerformance = (metric: string, value: number) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'voice_performance', {
      event_category: 'voice_concierge',
      metric,
      value,
      timestamp: Date.now()
    });
  }
};

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
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

export interface VoiceConciergeProps {
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void;
  onFilterChange?: (filters: string[]) => void;
}

export default function VoiceConciergeClient({ onLocationSelect, onFilterChange }: VoiceConciergeProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSoundReady, setIsSoundReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const micStartClickedAt = useRef<number>(0);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const stopSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize sound effects
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      startSoundRef.current = new Audio('/sounds/start.mp3');
      stopSoundRef.current = new Audio('/sounds/stop.mp3');
      startSoundRef.current.volume = 0.5;
      stopSoundRef.current.volume = 0.5;
      setIsSoundReady(true);
    } catch (err) {
      console.error('Failed to load sounds:', err);
      setError('Failed to load sound effects. Some features may be limited.');
    }

    return () => {
      if (startSoundRef.current) {
        startSoundRef.current.pause();
        startSoundRef.current = null;
      }
      if (stopSoundRef.current) {
        stopSoundRef.current.pause();
        stopSoundRef.current = null;
      }
    };
  }, []);

  // Check browser support
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkSupport = () => {
      const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(supported);
      if (!supported) {
        setError('Voice Concierge is not supported in this browser.');
      }
    };

    checkSupport();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined' || !isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      setTranscript(transcript);

      if (transcript.toLowerCase().includes('location')) {
        const locationMatch = transcript.match(/location\s+(.+)/i);
        if (locationMatch && onLocationSelect) {
          onLocationSelect({
            lat: 0,
            lng: 0,
            name: locationMatch[1]
          });
        }
      }

      if (transcript.toLowerCase().includes('filter')) {
        const filterMatch = transcript.match(/filter\s+(.+)/i);
        if (filterMatch && onFilterChange) {
          onFilterChange([filterMatch[1]]);
        }
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Error: ${event.error}`);
      setListening(false);
      localStorage.setItem('voice_active', 'false');
    };

    recognition.onend = () => {
      setListening(false);
      localStorage.setItem('voice_active', 'false');
    };

    recognitionRef.current = recognition;
    setIsInitialized(true);

    const wasListening = localStorage.getItem('voice_active') === 'true';
    if (wasListening) {
      toggleListening();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onLocationSelect, onFilterChange, isSupported]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    const nextState = !listening;
    if (nextState) {
      micStartClickedAt.current = Date.now();
      recognitionRef.current.start();
      if (startSoundRef.current) {
        startSoundRef.current.currentTime = 0;
        startSoundRef.current.play();
      }
    } else {
      recognitionRef.current.stop();
      if (stopSoundRef.current) {
        stopSoundRef.current.currentTime = 0;
        stopSoundRef.current.play();
      }
    }
    setListening(nextState);
    localStorage.setItem('voice_active', String(nextState));
  };

  if (isSupported === false) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <MicOff className="w-8 h-8 text-red-500" />
        <p className="text-red-600 font-medium">Voice Concierge is not supported in this browser.</p>
        <p className="text-gray-600 text-sm">Please try using Chrome, Edge, or another supported browser.</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleListening}
        className={cn(
          'relative transition-all duration-200',
          listening && 'text-red-500'
        )}
        disabled={!isSoundReady}
        aria-label={listening ? 'Stop listening' : 'Start listening'}
        title={listening ? 'Stop voice recognition' : 'Start voice recognition'}
      >
        {listening ? (
          <MicOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Mic className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
      
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-gray-600">You said:</p>
          <p className="font-medium">{transcript}</p>
        </motion.div>
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-center"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
} 