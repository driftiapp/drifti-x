import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  MapPin, 
  Clock, 
  TrendingUp,
  Sparkles,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { getTimeOfDay, getCurrentLocation } from '@/utils/getAISuggestions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    type?: 'suggestion' | 'action' | 'alert';
    actions?: Array<{
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
    }>;
  };
}

const SUGGESTED_PROMPTS = [
  "Where can I get a cheap vape near me?",
  "Find a 24/7 pharmacy",
  "Best pizza place open now",
  "Book a ride to the airport",
  "Order food delivery under $20"
];

const AIConcierge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; city?: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentLocation().then(loc => {
      if (loc) setLocation(loc);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: {
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            location,
            timeOfDay: getTimeOfDay(),
            previousSearches: messages
              .filter(m => m.role === 'user')
              .map(m => m.content)
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        metadata: {
          type: data.type,
          actions: data.actions?.map((action: any) => ({
            ...action,
            icon: getIconForAction(action.icon)
          }))
        }
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        timestamp: Date.now(),
        metadata: {
          type: 'alert'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForAction = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'map':
        return <MapPin size={16} />;
      case 'clock':
        return <Clock size={16} />;
      case 'trending':
        return <TrendingUp size={16} />;
      case 'sparkles':
        return <Sparkles size={16} />;
      default:
        return null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Concierge"
      >
        <Bot size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-purple-500 text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-medium">Drifti AI Concierge</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-purple-600 rounded-full"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    Hi! I'm your AI concierge. How can I help you today?
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500">Suggested prompts:</div>
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInput(prompt);
                          inputRef.current?.focus();
                        }}
                        className="w-full text-left p-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-500 text-white'
                          : message.metadata?.type === 'alert'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      {message.metadata?.actions && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.metadata.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={action.onClick}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-white/20 hover:bg-white/30"
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Loader2 size={20} className="animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-full ${
                    isListening ? 'text-red-500' : 'text-gray-400'
                  } hover:text-gray-600`}
                  disabled={isLoading}
                  aria-label="Voice input"
                >
                  <Mic size={20} />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="p-2 text-purple-500 hover:text-purple-600"
                  disabled={isLoading}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIConcierge; 