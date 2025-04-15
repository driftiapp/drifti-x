import { useState, useCallback } from 'react';

export const useVoiceRecognition = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(async () => {
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      await recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening
  };
}; 