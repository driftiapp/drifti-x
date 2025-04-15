'use client';

import React, { useState } from 'react';
import { ServiceOnboardingModal } from '@/components/ServiceOnboardingModal';
import { ServiceId } from '@/types/services';

const RidePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <ServiceOnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceType="ride"
      />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Ride Service</h1>
        <p className="text-gray-300 mb-6">
          Book your ride here. Click the button below to open the booking modal.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Book a Ride
        </button>
      </div>
    </div>
  );
};

export default RidePage; 