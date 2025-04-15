import React from 'react';
import { motion } from 'framer-motion';

const AboutSection = () => {
  return (
    <div className="relative overflow-hidden bg-gray-900 py-16">
      {/* Parallax Background */}
      <div
        className="absolute inset-0 bg-cover bg-fixed bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: 'url("/images/city-background.jpg")',
        }}
      />

      <div className="relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="mb-8 text-4xl font-bold text-white">
              We started this to make the city move smarter, safer, and more local.
            </h2>

            <div className="mb-12">
              <blockquote className="text-xl text-gray-300">
                "Our mission is to connect people with the services they need,
                when they need them, in the most efficient way possible."
              </blockquote>
              <p className="mt-4 text-gray-400">- Founder, Driftix</p>
            </div>

            {/* Testimonials */}
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  quote: "Best delivery service in town!",
                  author: "Sarah M.",
                  role: "Customer",
                },
                {
                  quote: "Great platform for drivers.",
                  author: "John D.",
                  role: "Driver",
                },
                {
                  quote: "Perfect for my business.",
                  author: "Lisa K.",
                  role: "Store Owner",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-lg bg-gray-800 p-6"
                >
                  <p className="mb-4 text-gray-300">{testimonial.quote}</p>
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                </motion.div>
              ))}
            </div>

            {/* Press Logos */}
            <div className="mt-16 flex flex-wrap justify-center gap-8">
              {['TechCrunch', 'Forbes', 'Wired'].map((logo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-2xl font-bold text-gray-400"
                >
                  {logo}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection; 