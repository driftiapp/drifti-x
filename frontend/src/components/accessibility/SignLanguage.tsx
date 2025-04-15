import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Hand, Check, X, Repeat } from 'lucide-react';

interface SignLanguageProps {
  onOrderConfirmed: (order: string) => void;
}

const SignLanguage: React.FC<SignLanguageProps> = ({ onOrderConfirmed }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSign, setDetectedSign] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    // Initialize MediaPipe Hands
    const initializeHandTracking = async () => {
      if (videoRef.current && canvasRef.current) {
        // Here we would initialize MediaPipe Hands
        // This is a placeholder for the actual implementation
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      }
    };

    initializeHandTracking();
  }, []);

  const startDetection = () => {
    setIsDetecting(true);
    // Start hand tracking and sign detection
    // This would be implemented using MediaPipe Hands and TensorFlow.js
  };

  const stopDetection = () => {
    setIsDetecting(false);
    // Stop hand tracking
  };

  const handleConfirm = () => {
    onOrderConfirmed(detectedSign);
    setIsConfirming(false);
    setDetectedSign('');
  };

  const handleChange = () => {
    setIsConfirming(false);
    setDetectedSign('');
  };

  const handleRepeat = () => {
    // Restart detection
    startDetection();
  };

  return (
    <div className="relative">
      {/* Camera View */}
      <div className="relative w-full max-w-md mx-auto">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-auto rounded-xl"
          style={{ display: isDetecting ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: isDetecting ? 'block' : 'none' }}
        />
        {!isDetecting && (
          <div className="w-full aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
            <Hand className="w-16 h-16 text-gray-600" />
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="mt-4 flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isDetecting ? stopDetection : startDetection}
          className={`px-6 py-3 rounded-full flex items-center gap-2 ${
            isDetecting
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          <Hand className="w-5 h-5" />
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </motion.button>
      </div>

      {/* Detected Sign Display */}
      <AnimatePresence>
        {detectedSign && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 bg-gray-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Detected Sign</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">{detectedSign}</div>
              <div className="text-gray-300">(Translation)</div>
            </div>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Confirm
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleChange}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Change
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRepeat}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Repeat className="w-5 h-5" />
                Try Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignLanguage; 