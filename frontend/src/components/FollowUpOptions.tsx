'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceId } from '@/types/services';
import { useAnalytics } from '@/hooks/useAnalytics';

interface FollowUpOptionsProps {
  serviceType: ServiceId;
  onClose: () => void;
  onRemindLater: () => void;
  onBookNow: () => void;
}

const serviceSuggestions: Record<ServiceId, string[]> = {
  ride: ['Book your first ride now', 'Schedule a ride for later', 'View nearby drivers'],
  food: ['Order food now', 'Browse nearby restaurants', 'Save favorite spots'],
  vape: ['Find vape shops near you', 'Browse products', 'Get delivery options'],
  liquor: ['Discover liquor stores', 'Browse products', 'Get delivery options'],
};

export const FollowUpOptions: React.FC<FollowUpOptionsProps> = ({
  serviceType,
  onClose,
  onRemindLater,
  onBookNow,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    trackEvent('follow_up_option_selected', {
      service_type: serviceType,
      option,
    });

    if (option.includes('now')) {
      onBookNow();
    } else if (option.includes('later')) {
      onRemindLater();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mt-6"
    >
      <h3 className="text-lg font-semibold mb-4">What would you like to do next?</h3>
      <div className="space-y-3">
        {serviceSuggestions[serviceType].map((option) => (
          <motion.button
            key={option}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOptionClick(option)}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              selectedOption === option
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {option}
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full p-3 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
        >
          Maybe later
        </motion.button>
      </div>
    </motion.div>
  );
}; 