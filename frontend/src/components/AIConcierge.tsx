'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AIConcierge = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTyping(true);
    // Simulate AI processing
    setTimeout(() => setIsTyping(false), 2000);
  };

  return (
    <div className="bg-gray-900 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="mb-8 text-4xl font-bold text-white">
            🧠 Tell us what you need. We'll handle the rest.
          </h2>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I want sushi in 20 minutes..."
                className="w-full rounded-full bg-gray-800 px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
          </form>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg bg-gray-800 p-6 text-left"
            >
              <div className="flex items-center gap-2 text-gray-400">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span className="ml-2">AI is thinking...</span>
              </div>
            </motion.div>
          )}

          {!isTyping && input && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 grid gap-4 text-left md:grid-cols-3"
            >
              <div className="rounded-lg bg-gray-800 p-6">
                <h3 className="mb-2 font-semibold text-white">
                  Nearby Restaurants
                </h3>
                <p className="text-gray-400">Sushi Express - 0.5 miles</p>
                <p className="text-gray-400">Tokyo Sushi - 1.2 miles</p>
              </div>
              <div className="rounded-lg bg-gray-800 p-6">
                <h3 className="mb-2 font-semibold text-white">Quick Ride</h3>
                <p className="text-gray-400">Estimated arrival: 5 minutes</p>
                <p className="text-gray-400">Price: $8-12</p>
              </div>
              <div className="rounded-lg bg-gray-800 p-6">
                <h3 className="mb-2 font-semibold text-white">Reservations</h3>
                <p className="text-gray-400">Available at 7:30 PM</p>
                <p className="text-gray-400">Party of 2-4</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AIConcierge; 