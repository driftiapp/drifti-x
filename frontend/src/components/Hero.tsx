'use client';

import { motion } from 'framer-motion';
import VoiceConcierge from './VoiceConcierge';
import { serviceIcons } from '@/types/serviceIcons';
import { MapPin, Navigation, Clock, Car } from 'lucide-react';
import AppStoreBadges from './AppStoreBadges';

const Hero = () => {
  const services = Object.entries(serviceIcons).map(([type, icon]) => ({
    type,
    ...icon
  }));

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-700/90" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/hero-poster.svg"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.h1 
            className="text-6xl font-bold mb-6 text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to DriftiX 🌍
          </motion.h1>
          <motion.p 
            className="text-xl mb-10 text-white/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your All-in-One Delivery Platform — Rides, Food, Smoke, Liquor & More.
          </motion.p>

          {/* Service Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {services.map((service) => (
              <motion.div
                key={service.type}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative overflow-hidden rounded-xl p-6 cursor-pointer bg-${service.color}-500/20 backdrop-blur-sm border border-${service.color}-500/30`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-${service.color}-500 flex items-center justify-center text-2xl`}>
                    {service.emoji}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {service.type}
                    </h3>
                    <p className="text-sm text-white/70">
                      {service.type === 'ride' ? 'Book a ride' :
                       service.type === 'food' ? 'Order food' :
                       service.type === 'vape' ? 'Shop vape' :
                       'Shop liquor'}
                    </p>
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br from-${service.color}-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity`} />
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-white" />
                <div>
                  <h4 className="text-lg font-semibold text-white">Live Tracking</h4>
                  <p className="text-sm text-white/70">Real-time location updates</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-white" />
                <div>
                  <h4 className="text-lg font-semibold text-white">Fast Delivery</h4>
                  <p className="text-sm text-white/70">30 minutes or less</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-3">
                <Car className="w-6 h-6 text-white" />
                <div>
                  <h4 className="text-lg font-semibold text-white">Multiple Options</h4>
                  <p className="text-sm text-white/70">Choose your preferred service</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Voice Assistant */}
          <motion.div 
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <VoiceConcierge
              onLocationSelect={(location) => {
                console.log('Selected location:', location);
              }}
              onFilterChange={(filters) => {
                console.log('Updated filters:', filters);
              }}
            />
          </motion.div>

          {/* App Store Badges */}
          <AppStoreBadges />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero; 