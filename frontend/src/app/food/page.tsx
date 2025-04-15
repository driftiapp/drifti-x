'use client';

import React, { useState } from 'react';
import { ServiceOnboardingModal } from '@/components/ServiceOnboardingModal';
import { ServiceId } from '@/types/services';

const FoodPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <ServiceOnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceType="food"
      />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Food Service</h1>
        <p className="text-gray-300 mb-6">
          Order food delivery here. Click the button below to open the ordering modal.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Order Food
        </button>
      </div>
    </div>
  );
};

export default FoodPage; 