'use client';

import { motion } from 'framer-motion';
import { ServiceType } from '@/types/services';

const SERVICES: ServiceType[] = [
  {
    id: 'rides',
    name: 'Rides',
    icon: '🚗',
    description: 'Book a ride anywhere, anytime',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
  },
  {
    id: 'food',
    name: 'Food',
    icon: '🍕',
    description: 'Order from your favorite restaurants',
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
  },
  {
    id: 'smoke',
    name: 'Smoke Shop',
    icon: '💨',
    description: 'Get your smoking essentials delivered',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
  },
  {
    id: 'liquor',
    name: 'Liquor',
    icon: '🍷',
    description: 'Order drinks for your next party',
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
  },
];

const Services = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-lg text-gray-600">
            Everything you need, delivered to your doorstep
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-xl shadow-lg ${service.color} ${service.hoverColor} transition-all duration-300`}
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-white">{service.name}</h3>
              <p className="text-white/90">{service.description}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 bg-white/20 text-white px-4 py-2 rounded-full hover:bg-white/30 transition"
              >
                Learn More
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services; 