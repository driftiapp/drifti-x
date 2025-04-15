import { useEffect, useState } from 'react';
import { ServiceType, isValidServiceType } from '@/types/services';

/**
 * Props for the VoiceSearchFeedback component
 * @interface VoiceSearchFeedbackProps
 * @property {boolean} isListening - Whether the voice search is currently listening
 * @property {string} query - The current search query
 * @property {ServiceType[]} activeFilters - The currently active service type filters
 * @property {() => void} onClose - Callback to close the feedback
 */
interface VoiceSearchFeedbackProps {
  isListening: boolean;
  query: string;
  activeFilters: ServiceType[];
  onClose: () => void;
}

/**
 * Emoji icons for each service type
 * @constant {Record<ServiceType, string>}
 */
const SERVICE_EMOJIS: Record<ServiceType, string> = {
  food: '🍔',
  vape: '🚬',
  liquor: '🍷',
  ride: '🚘',
  default: '📍'
};

/**
 * Labels for each service type
 * @constant {Record<ServiceType, string>}
 */
const SERVICE_LABELS: Record<ServiceType, string> = {
  food: 'food',
  vape: 'vape',
  liquor: 'liquor',
  ride: 'rides',
  default: 'services'
};

/**
 * Auto-hide delay for feedback with filters (in milliseconds)
 * @constant {number}
 */
const FILTERS_FEEDBACK_DELAY = 3000;

/**
 * Auto-hide delay for feedback without filters (in milliseconds)
 * @constant {number}
 */
const QUERY_FEEDBACK_DELAY = 2000;

/**
 * Animation delays for the listening indicator bars (in milliseconds)
 * @constant {number[]}
 */
const ANIMATION_DELAYS = [0, 150, 300];

/**
 * VoiceSearchFeedback component displays feedback for voice search interactions
 * @component
 * @param {VoiceSearchFeedbackProps} props - Component props
 * @returns {JSX.Element} Voice search feedback component
 */
export const VoiceSearchFeedback: React.FC<VoiceSearchFeedbackProps> = ({
  isListening,
  query,
  activeFilters,
  onClose
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isListening) {
      setShowFeedback(true);
      setFeedbackText('Listening...');
    } else if (query && activeFilters.length > 0) {
      // Filter out invalid service types
      const validFilters = activeFilters.filter(isValidServiceType);
      
      if (validFilters.length > 0) {
        const services = validFilters
          .map(type => `${SERVICE_EMOJIS[type]} ${SERVICE_LABELS[type]}`)
          .join(', ');
        setFeedbackText(`Showing ${services} in ${query}`);
        
        // Auto-hide after delay
        timer = setTimeout(() => {
          setShowFeedback(false);
          onClose();
        }, FILTERS_FEEDBACK_DELAY);
      }
    } else if (query) {
      setFeedbackText(`Searching for "${query}"`);
      
      // Auto-hide after delay
      timer = setTimeout(() => {
        setShowFeedback(false);
        onClose();
      }, QUERY_FEEDBACK_DELAY);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isListening, query, activeFilters, onClose]);

  if (!showFeedback) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50"
      role="status"
      aria-live="polite"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isListening ? (
              <>
                <div 
                  className="w-3 h-3 bg-red-500 rounded-full animate-pulse"
                  aria-label="Listening indicator"
                />
                <span className="text-sm font-medium">Listening...</span>
              </>
            ) : (
              <span className="text-sm font-medium">{feedbackText}</span>
            )}
          </div>
          <button
            onClick={() => {
              setShowFeedback(false);
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close feedback"
          >
            ×
          </button>
        </div>
        {isListening && (
          <div 
            className="flex space-x-1"
            aria-hidden="true"
          >
            {ANIMATION_DELAYS.map((delay, index) => (
              <div
                key={index}
                className="w-1 h-4 bg-gray-300 rounded animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 