'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { trackAnalytics } from '@/lib/analytics';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  isSent?: boolean;
  error?: string;
  className?: string;
}

const COUNTRY_CODES = [
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading = false,
  isSent = false,
  error,
  className = '',
}) => {
  const { t } = useTranslation();
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/\D/g, '');
    onChange(phone);
  };

  const handleCountrySelect = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setShowCountryCodes(false);
    trackAnalytics('country_code_select', { country: country.code });
  };

  const handleSend = () => {
    if (value.length < 9) {
      return;
    }
    onSend();
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCountryCodes(!showCountryCodes)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span>{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.code}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showCountryCodes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
              >
                {COUNTRY_CODES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span>{country.flag}</span>
                    <span className="text-sm">{country.code}</span>
                    <span className="text-sm text-gray-500">{country.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <input
            type="tel"
            value={value}
            onChange={handlePhoneChange}
            placeholder={t('downloadApp.phonePlaceholder')}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || isSent || value.length < 9}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading || isSent || value.length < 9
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSent ? (
              '✓'
            ) : (
              t('downloadApp.sendLink')
            )}
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}

        {value.length > 0 && value.length < 9 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-yellow-500"
          >
            {t('downloadApp.invalidPhone')}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}; 