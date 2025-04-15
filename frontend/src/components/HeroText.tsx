import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';

const HeroText: React.FC = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.95
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10 text-center px-4 max-w-4xl mx-auto"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 mb-4"
      >
        <Sparkles className="w-6 h-6 text-purple-500" />
        <span className="text-purple-500 font-semibold">AI-Powered Delivery</span>
      </motion.div>

      <motion.h1
        variants={itemVariants}
        className="text-6xl md:text-7xl font-extrabold mb-6 text-gradient"
      >
        🌍 DriftiX
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-3xl md:text-4xl mb-4"
      >
        One App. Everything Delivered.
      </motion.p>

      <motion.p
        variants={itemVariants}
        className="text-xl text-gray-400 mb-12"
      >
        🚗 Rides • 🍔 Food • 💨 Smoke • 🍷 Liquor • 🛒 Groceries
      </motion.p>

      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full text-lg font-semibold flex items-center justify-center gap-2"
        >
          {t('hero.download')}
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full text-lg font-semibold flex items-center justify-center gap-2 backdrop-blur-sm"
        >
          <MapPin className="w-5 h-5" />
          {t('hero.enterCity')}
        </motion.button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-8 text-sm text-gray-400"
      >
        <p>Available in 250+ cities worldwide</p>
      </motion.div>
    </motion.div>
  );
};

export default HeroText; 