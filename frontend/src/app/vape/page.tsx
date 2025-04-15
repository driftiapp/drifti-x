'use client';

import React, { useState } from 'react';
import { ServiceOnboardingModal } from '@/components/ServiceOnboardingModal';
import { ServiceId } from '@/types/services';

const VapePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <ServiceOnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceType="vape"
      />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Vape Service</h1>
        <p className="text-gray-300 mb-6">
          Find vape shops and products here. Click the button below to open the search modal.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          Find Vape Shops
        </button>
      </div>
    </div>
  );
};

export default VapePage; 