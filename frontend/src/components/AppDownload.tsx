'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { PhoneInput } from './PhoneInput';
import { trackAnalytics } from '@/lib/analytics';
import confetti from 'canvas-confetti';
import Typed from 'typed.js';

const QRCode = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), {
  ssr: false,
  loading: () => (
    <div className="w-[200px] h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  ),
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

interface AppDownloadProps {
  theme?: 'clean' | 'luxe' | 'night';
}

const AppDownload = ({ theme = 'clean' }: AppDownloadProps) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const typedRef = useRef<Typed>();

  useEffect(() => {
    const options = {
      strings: [
        'Enter your phone or email...',
        '...we\'ll send the link instantly',
        '...get started in seconds'
      ],
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 2000,
      loop: true,
      showCursor: true,
      cursorChar: '|'
    };

    typedRef.current = new Typed('#contact', options);

    return () => {
      typedRef.current?.destroy();
    };
  }, []);

  const handleSendAppLink = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Track the SMS tap event
      await trackAnalytics('sms_tap', {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        action: 'send_link',
      });

      // Call your backend API to send the SMS
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      setIsSent(true);
    } catch (err) {
      setError(t('downloadApp.error'));
      console.error('Failed to send SMS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeLoad = () => {
    trackAnalytics('qr_view', {
      source: 'homepage',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setIsInvalid(true);
      setTimeout(() => setIsInvalid(false), 1000);
      return;
    }

    // Simulate sending the app link
    console.log('Sending app link to:', input);
    setIsSubmitted(true);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#8b5cf6']
    });

    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setInput('');
    }, 3000);
  };

  const badgeStyles = {
    clean: {
      container: 'bg-white/10 backdrop-blur-sm',
      text: 'text-white',
      border: 'border-white/20'
    },
    luxe: {
      container: 'bg-purple-900/30 backdrop-blur-sm',
      text: 'text-white',
      border: 'border-purple-400/20'
    },
    night: {
      container: 'bg-gray-900/30 backdrop-blur-sm',
      text: 'text-white',
      border: 'border-gray-400/20'
    }
  };

  const currentStyle = badgeStyles[theme];

  return (
    <div className="bg-gray-900 text-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-4 text-center"
      >
        Get the App
      </motion.h2>
      
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <motion.div
              animate={isInvalid ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <label htmlFor="contact" className="block text-sm font-medium mb-2">
                Enter your phone or email
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                id="contact"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                placeholder=""
                required
              />
            </motion.div>
            <motion.button
              whileHover={{ 
                scale: 1.05,
                background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
            >
              Send App Link
            </motion.button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-green-500 text-4xl mb-4"
            >
              ✓
            </motion.div>
            <p className="text-lg">
              App link has been sent to {input}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppDownload; 