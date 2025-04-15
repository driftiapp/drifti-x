import { useState, useEffect } from 'react';

interface ContactInfo {
  value: string;
  type: 'email' | 'phone';
  lastUsed: number;
}

export const useContactStorage = () => {
  const [savedContact, setSavedContact] = useState<ContactInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('lastContact');
    if (stored) {
      try {
        setSavedContact(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored contact:', e);
      }
    }
  }, []);

  const saveContact = (value: string) => {
    const contact: ContactInfo = {
      value,
      type: value.includes('@') ? 'email' : 'phone',
      lastUsed: Date.now(),
    };
    localStorage.setItem('lastContact', JSON.stringify(contact));
    setSavedContact(contact);
  };

  const clearContact = () => {
    localStorage.removeItem('lastContact');
    setSavedContact(null);
  };

  return {
    savedContact,
    saveContact,
    clearContact,
  };
}; 