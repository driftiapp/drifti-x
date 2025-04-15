import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Volume2, Bell } from 'lucide-react';

interface BlindModeProps {
  onOrderConfirmed: (order: string) => void;
}

const BlindMode: React.FC<BlindModeProps> = ({ onOrderConfirmed }) => {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentSection, setCurrentSection] = useState('menu');
  const [selectedItem, setSelectedItem] = useState('');

  useEffect(() => {
    // Check if screen reader is active
    const isScreenReaderActive = () => {
      return (
        document.documentElement.getAttribute('aria-hidden') === 'false' ||
        document.documentElement.getAttribute('role') === 'application'
      );
    };

    setIsActive(isScreenReaderActive());
  }, []);

  useEffect(() => {
    if (isActive) {
      // Announce current section
      const speech = new SpeechSynthesisUtterance(
        `You are in the ${currentSection} section. Swipe left or right to navigate.`
      );
      window.speechSynthesis.speak(speech);

      // Provide haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  }, [currentSection, isActive]);

  const menuItems = [
    { id: 'ride', icon: '🚗', label: 'Ride Share' },
    { id: 'food', icon: '🍔', label: 'Food Delivery' },
    { id: 'smoke', icon: '💨', label: 'Smoke Shop' },
    { id: 'drinks', icon: '🍷', label: 'Liquor Delivery' }
  ];

  const handleItemSelect = (item: string) => {
    setSelectedItem(item);
    // Announce selection
    const speech = new SpeechSynthesisUtterance(`Selected: ${item}. Double tap to confirm.`);
    window.speechSynthesis.speak(speech);

    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  const handleConfirm = () => {
    onOrderConfirmed(selectedItem);
    // Provide confirmation feedback
    const speech = new SpeechSynthesisUtterance('Order confirmed. Your driver will arrive in 10 minutes.');
    window.speechSynthesis.speak(speech);

    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  return (
    <div className="relative">
      {/* Mode Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsActive(!isActive)}
        className={`px-6 py-3 rounded-full flex items-center gap-2 ${
          isActive
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}
        aria-label={isActive ? 'Disable blind mode' : 'Enable blind mode'}
      >
        {isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        {isActive ? 'Blind Mode Active' : 'Enable Blind Mode'}
      </motion.button>

      {/* Menu Items */}
      {isActive && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleItemSelect(item.label)}
              className={`p-6 rounded-xl flex flex-col items-center gap-2 ${
                selectedItem === item.label
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
              aria-label={item.label}
            >
              <span className="text-4xl">{item.icon}</span>
              <span className="text-lg font-semibold">{item.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Confirmation Button */}
      {selectedItem && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConfirm}
          className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full flex items-center justify-center gap-2"
          aria-label={`Confirm order: ${selectedItem}`}
        >
          <Bell className="w-5 h-5" />
          Confirm Order
        </motion.button>
      )}

      {/* Status Announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {isActive && `Blind mode is active. Current section: ${currentSection}.`}
        {selectedItem && `Selected item: ${selectedItem}.`}
      </div>
    </div>
  );
};

export default BlindMode; 