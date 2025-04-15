'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceId, SERVICE_DEFINITIONS } from '@/types/services';
import { X } from 'lucide-react';
import { FollowUpOptions } from './FollowUpOptions';
import { VoiceInput } from './VoiceInput';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useContactStorage } from '@/hooks/useContactStorage';

interface ServiceOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: ServiceId;
}

export const ServiceOnboardingModal: React.FC<ServiceOnboardingModalProps> = ({
  isOpen,
  onClose,
  serviceType,
}) => {
  const [input, setInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isVoiceOnly, setIsVoiceOnly] = useState(false);
  const [showSavedContact, setShowSavedContact] = useState(false);
  const { trackEvent } = useAnalytics();
  const { savedContact, saveContact, clearContact } = useContactStorage();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      if (savedContact) {
        setShowSavedContact(true);
      }
    }
  }, [isOpen, savedContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    trackEvent('service_onboarding_submit', {
      service_type: serviceType,
      input_type: input.includes('@') ? 'email' : 'phone',
      mode: isVoiceOnly ? 'voice' : 'text',
      used_saved_contact: showSavedContact,
    });

    if (!input) {
      setError('Please enter your phone number or email');
      return;
    }

    const isEmail = input.includes('@');
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const isValidPhone = /^\+?[\d\s-]{10,}$/.test(input);

    if ((isEmail && !isValidEmail) || (!isEmail && !isValidPhone)) {
      setError(isEmail ? 'Please enter a valid email' : 'Please enter a valid phone number');
      return;
    }

    saveContact(input);
    trackEvent('service_onboarding_success', {
      service_type: serviceType,
      input_type: isEmail ? 'email' : 'phone',
      mode: isVoiceOnly ? 'voice' : 'text',
      used_saved_contact: showSavedContact,
    });

    setIsSubmitted(true);
  };

  const handleRemindLater = () => {
    trackEvent('remind_later_selected', {
      service_type: serviceType,
      input_type: input.includes('@') ? 'email' : 'phone',
      mode: isVoiceOnly ? 'voice' : 'text',
      used_saved_contact: showSavedContact,
    });
    onClose();
  };

  const handleBookNow = () => {
    trackEvent('book_now_selected', {
      service_type: serviceType,
      input_type: input.includes('@') ? 'email' : 'phone',
      mode: isVoiceOnly ? 'voice' : 'text',
      used_saved_contact: showSavedContact,
    });
    // TODO: Implement booking flow
    onClose();
  };

  const handleVoiceTranscript = (text: string) => {
    if (text.toLowerCase().includes('send it')) {
      handleSubmit(new Event('submit') as any);
    }
    setInput(text);
  };

  const handleVoiceError = (error: string) => {
    setError(error);
  };

  const handleAutoFill = (value: string) => {
    setInput(value);
    trackEvent('voice_auto_fill_success', {
      service_type: serviceType,
      input_type: value.includes('@') ? 'email' : 'phone',
    });
  };

  const handleUseSavedContact = () => {
    if (savedContact) {
      setInput(savedContact.value);
      setShowSavedContact(false);
      trackEvent('saved_contact_used', {
        service_type: serviceType,
        input_type: savedContact.type,
      });
    }
  };

  const handleClearSavedContact = () => {
    clearContact();
    setShowSavedContact(false);
    trackEvent('saved_contact_cleared', {
      service_type: serviceType,
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      trackEvent('service_onboarding_open', {
        service_type: serviceType,
        has_saved_contact: !!savedContact,
      });
    }
  }, [isOpen, serviceType, savedContact]);

  const service = SERVICE_DEFINITIONS[serviceType];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{service.name}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-300">{service.description}</p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit}>
                {showSavedContact && savedContact && (
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <p className="text-gray-300 mb-2">
                      Use your saved {savedContact.type}?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUseSavedContact}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Yes, use {savedContact.value}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSavedContact}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        No, clear saved contact
                      </button>
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter your phone number or email"
                      className="flex-1 p-3 rounded bg-gray-700 text-white placeholder-gray-400"
                    />
                    <VoiceInput
                      onTranscript={handleVoiceTranscript}
                      onError={handleVoiceError}
                      onAutoFill={handleAutoFill}
                      isVoiceOnly={isVoiceOnly}
                    />
                  </div>
                  {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('service_onboarding_cancel', {
                        service_type: serviceType,
                      });
                      onClose();
                    }}
                    className="px-4 py-2 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-green-400 mb-4">App link sent successfully!</p>
                <p className="text-gray-300 mb-6">Check your {input.includes('@') ? 'email' : 'phone'} for the download link.</p>
                <FollowUpOptions
                  serviceType={serviceType}
                  onClose={onClose}
                  onRemindLater={handleRemindLater}
                  onBookNow={handleBookNow}
                />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 