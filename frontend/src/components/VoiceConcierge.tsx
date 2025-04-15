'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { VoiceLocation, SearchResult } from '../types/location';

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Create a no-op component for SSR
const NoopComponent = () => null;

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

interface VoiceConciergeProps {
  onLocationSelect: (location: VoiceLocation | SearchResult) => void;
  onFilterChange: (filters: string[]) => void;
}

export const VoiceConcierge: React.FC<VoiceConciergeProps> = ({
  onLocationSelect,
  onFilterChange
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(async () => {
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(transcript);

        // Process the transcript for location or filters
        if (transcript.toLowerCase().includes('location')) {
          // Extract location from transcript
          const locationMatch = transcript.match(/location\s+(.+)/i);
          if (locationMatch) {
            const locationName = locationMatch[1];
            onLocationSelect({
              name: locationName,
              lat: 0, // These would be populated by a geocoding service
              lng: 0,
              type: 'voice'
            });
          }
        } else {
          // Extract filters from transcript
          const filters = transcript.split(/\s+/).filter(word => word.length > 2);
          onFilterChange(filters);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
    }
  }, [onLocationSelect, onFilterChange]);

  const stopListening = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
      const recognition = new Recognition();
      recognition.stop();
    }
    setIsListening(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        variant={isListening ? "destructive" : "default"}
        size="icon"
        onClick={isListening ? stopListening : startListening}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>
      {transcript && (
        <p className="text-sm text-gray-600 text-center">
          {transcript}
        </p>
      )}
    </div>
  );
};

// Export the component with dynamic imports
const VoiceConciergeClient = dynamic(() => import('./VoiceConciergeClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
});

export default function VoiceConciergeWrapper({ onLocationSelect, onFilterChange }: VoiceConciergeProps) {
  return (
    <div className="p-4">
      <VoiceConcierge
        onLocationSelect={onLocationSelect}
        onFilterChange={onFilterChange}
      />
    </div>
  );
} 