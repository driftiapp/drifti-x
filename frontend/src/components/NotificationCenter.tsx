import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Service } from '../types/services';
import useSound from 'use-sound';

interface Notification {
  id: string;
  service: Service;
  type: 'new' | 'update' | 'alert';
  message: string;
  timestamp: Date;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationClick: (service: Service) => void;
  onDismiss: (id: string) => void;
}

const NOTIFICATION_COLORS = {
  new: 'bg-green-500',
  update: 'bg-blue-500',
  alert: 'bg-yellow-500'
};

const NOTIFICATION_ICONS = {
  new: '✨',
  update: '🔄',
  alert: '🔔'
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onNotificationClick,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playSound] = useSound('/sfx/notification.mp3', { volume: 0.3 });

  // Play sound when new notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      playSound();
    }
  }, [notifications.length, playSound]);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-12 h-12 rounded-full
          bg-white shadow-lg
          flex items-center justify-center
          text-xl
          relative
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        🔔
        {notifications.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1
              w-5 h-5 rounded-full
              bg-red-500 text-white
              text-xs flex items-center justify-center
              border-2 border-white"
          >
            {notifications.length}
          </motion.div>
        )}
      </motion.button>

      {/* Notifications panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 w-80 max-h-[70vh] overflow-y-auto
              bg-white rounded-lg shadow-xl
              border border-gray-100"
          >
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onNotificationClick(notification.service)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-8 h-8 rounded-full
                        ${NOTIFICATION_COLORS[notification.type]}
                        text-white
                        flex items-center justify-center
                      `}>
                        {NOTIFICATION_ICONS[notification.type]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 