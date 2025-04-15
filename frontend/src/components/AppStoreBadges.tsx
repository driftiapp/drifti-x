import Image from 'next/image';
import { motion } from 'framer-motion';

export default function AppStoreBadges() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex gap-4">
        <a
          href="https://apps.apple.com/app/drifti"
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-32 h-10"
        >
          <Image
            src="/images/app-store-badge.svg"
            alt="Download on the App Store"
            fill
            className="object-contain"
            priority
          />
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.drifti.app"
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-32 h-10"
        >
          <Image
            src="/images/google-play-badge.png"
            alt="Get it on Google Play"
            fill
            sizes="(max-width: 768px) 100vw, 128px"
            className="object-contain"
            priority
          />
        </a>
      </div>
      <div className="relative w-32 h-32">
        <Image
          src="/images/qr-code.svg"
          alt="Scan QR code to download"
          fill
          sizes="(max-width: 768px) 100vw, 128px"
          className="object-contain"
          priority
        />
      </div>
    </motion.div>
  );
} 