'use client';

import { motion } from 'framer-motion';
import { AppBadge } from './AppBadge';
import Image from 'next/image';

const DownloadSection = () => (
  <section className="bg-white text-black py-16 px-6 text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-6">📱 Download DriftiX Now</h2>
      <p className="mb-6 text-gray-600">
        Start booking rides, ordering food, and more in seconds.
      </p>

      {/* App Badges */}
      <div className="flex justify-center gap-4 mb-8">
        <AppBadge type="appstore" theme="clean" />
        <AppBadge type="playstore" theme="clean" />
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <Image
          src="/images/qr-code.svg"
          alt="QR Code"
          width={128}
          height={128}
          className="rounded-lg shadow-lg"
          priority
          unoptimized
        />
      </div>
    </motion.div>
  </section>
);

export default DownloadSection; 