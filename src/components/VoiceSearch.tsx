import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

export function VoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    let recognition: any;

    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        // TODO: Implement search with transcript
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      (window as any).webkitSpeechRecognition.stop();
    } else {
      (window as any).webkitSpeechRecognition.start();
      setIsListening(true);
    }
  };

  return (
    <button
      onClick={toggleListening}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
        isListening
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/90 text-gray-700 hover:bg-white'
      }`}
    >
      {isListening ? (
        <>
          <MicOff size={20} />
          <span>Stop Listening</span>
        </>
      ) : (
        <>
          <Mic size={20} />
          <span>Voice Search</span>
        </>
      )}
    </button>
  );
} 