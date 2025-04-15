import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ServerError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold mb-4">500</h1>
        <h2 className="text-2xl mb-6">Server Error</h2>
        <p className="text-gray-400 mb-8">Something went wrong on our end. Please try again later.</p>
        <Link 
          href="/"
          className="bg-green-500 text-black px-6 py-3 rounded-full font-bold hover:bg-green-600 transition"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
} 