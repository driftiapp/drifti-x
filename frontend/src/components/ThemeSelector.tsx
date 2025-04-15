import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';

export type ThemeMode = 'clean' | 'luxe' | 'night';

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

const THEME_DATA = {
  clean: {
    icon: '☀️',
    label: 'Clean',
    mapStyle: 'mapbox://styles/mapbox/light-v11',
    description: 'Minimal and focused'
  },
  luxe: {
    icon: '💎',
    label: 'Luxe',
    mapStyle: 'mapbox://styles/mapbox/streets-v12',
    description: 'Premium experience'
  },
  night: {
    icon: '🌙',
    label: 'Night',
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    description: 'Dark mode elegance'
  }
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playSwitch] = useSound('/sfx/switch.mp3', { volume: 0.3 });
  const [playHover] = useSound('/sfx/hover.mp3', { volume: 0.2 });

  const handleThemeChange = (theme: ThemeMode) => {
    playSwitch();
    onThemeChange(theme);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-20 left-4 z-40">
      {/* Theme toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          p-3 rounded-full
          flex items-center gap-2
          text-sm font-medium
          transition-all
          ${currentTheme === 'clean' ? 'bg-white text-gray-900' :
            currentTheme === 'luxe' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
            'bg-gray-900 text-white'}
          shadow-lg
          ${currentTheme === 'luxe' ? 'shadow-purple-500/20' : ''}
        `}
      >
        <span className="text-xl">{THEME_DATA[currentTheme].icon}</span>
        <span className="pr-1">{THEME_DATA[currentTheme].label} Mode</span>
      </motion.button>

      {/* Theme selector panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="
              absolute bottom-full left-0 mb-2
              w-64 bg-white rounded-lg
              shadow-xl border border-gray-100
              overflow-hidden
            "
          >
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500">
              <h3 className="text-lg font-bold text-white">
                Choose Your Style
              </h3>
              <p className="text-sm text-white/80">
                Select a theme that suits you
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {(Object.keys(THEME_DATA) as ThemeMode[]).map(theme => (
                <motion.button
                  key={theme}
                  whileHover={{ x: 4 }}
                  onClick={() => handleThemeChange(theme)}
                  onMouseEnter={() => playHover()}
                  className={`
                    w-full p-4
                    flex items-start gap-3
                    text-left
                    hover:bg-gray-50
                    transition-colors
                    ${theme === currentTheme ? 'bg-gray-50' : ''}
                  `}
                >
                  <span className="text-2xl mt-1">{THEME_DATA[theme].icon}</span>
                  <div>
                    <h4 className="font-medium">{THEME_DATA[theme].label}</h4>
                    <p className="text-sm text-gray-500">
                      {THEME_DATA[theme].description}
                    </p>
                  </div>
                  {theme === currentTheme && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-blue-500"
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 