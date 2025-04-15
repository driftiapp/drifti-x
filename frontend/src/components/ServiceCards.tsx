'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion/dist/framer-motion';

const services = [
  {
    id: 'ride',
    title: 'Ride Now',
    icon: '🚗',
    description: 'Find a driver near you',
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'from-blue-600 to-blue-700',
  },
  {
    id: 'food',
    title: 'Order Food',
    icon: '🍽',
    description: 'Get your favorite meals delivered',
    color: 'from-green-500 to-green-600',
    hoverColor: 'from-green-600 to-green-700',
  },
  {
    id: 'vape',
    title: 'Vape Delivery',
    icon: '💨',
    description: 'Quick vape shop delivery',
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'from-purple-600 to-purple-700',
  },
  {
    id: 'liquor',
    title: 'Liquor Drop-Off',
    icon: '🍷',
    description: 'Get your drinks delivered',
    color: 'from-red-500 to-red-600',
    hoverColor: 'from-red-600 to-red-700',
  },
];

const ServiceCards = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onHoverStart={() => setHoveredCard(service.id)}
            onHoverEnd={() => setHoveredCard(null)}
            className={`relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br ${service.color} p-8 transition-all duration-300 hover:scale-105`}
          >
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <span className="text-4xl">{service.icon}</span>
                <h3 className="mt-4 text-2xl font-bold text-white">
                  {service.title}
                </h3>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: hoveredCard === service.id ? 1 : 0,
                  y: hoveredCard === service.id ? 0 : 20,
                }}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 to-black/60 p-8"
              >
                <div className="text-center">
                  <p className="mb-4 text-xl font-semibold text-white">
                    {service.description}
                  </p>
                  <button className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100">
                    Get Started
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ServiceCards; 