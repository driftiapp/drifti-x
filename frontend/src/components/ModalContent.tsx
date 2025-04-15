import React, { useState } from 'react';
import { ModalContentProps } from '../types/modal';

const ModalContent: React.FC<ModalContentProps> = ({ onClose, onSubmit }) => {
  const [input, setInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!input) {
      setError('Please enter your phone number or email');
      return;
    }

    // Check if input is email or phone
    const isEmail = input.includes('@');
    const isPhone = /^\d+$/.test(input.replace(/\D/g, ''));

    if (!isEmail && !isPhone) {
      setError('Please enter a valid phone number or email');
      return;
    }

    // Clear any previous errors
    setError('');
    
    // Simulate sending the link
    onSubmit(input);
    setIsSubmitted(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setInput('');
      onClose();
    }, 3000);
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Get the App</h2>
      <p className="text-gray-300 mb-6">
        Enter your phone number or email to receive a download link
      </p>
      
      {isSubmitted ? (
        <div className="text-center py-4">
          <p className="text-green-400">App link sent successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Phone number or email"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Send Link
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ModalContent; 