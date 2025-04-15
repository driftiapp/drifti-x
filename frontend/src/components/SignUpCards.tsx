import React from 'react';
import { motion } from 'framer-motion';

const roles = [
  {
    id: 'driver',
    title: 'Driver',
    icon: '🧍‍♂️',
    description: 'Fast onboarding, live maps, weekly payouts',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'customer',
    title: 'Customer',
    icon: '👤',
    description: 'Track orders, real-time support',
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'store',
    title: 'Store Owner',
    icon: '🏬',
    description: 'Upload menu/items, get local customers',
    color: 'from-purple-500 to-purple-600',
  },
];

const SignUpCards = () => {
  return (
    <div className="bg-gray-900 py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-2xl bg-gradient-to-br ${role.color} p-8 text-white`}
            >
              <div className="mb-6 text-4xl">{role.icon}</div>
              <h3 className="mb-4 text-2xl font-bold">{role.title}</h3>
              <p className="mb-6 text-gray-200">{role.description}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
              >
                Start Now
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignUpCards; 