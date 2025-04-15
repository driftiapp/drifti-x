import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';

export default function RidesPage() {
  const [isBooking, setIsBooking] = useState(false);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleBookRide = () => {
    console.log('Booking ride with:', { pickup, destination, date, time });
    // TODO: Implement actual booking logic
    alert('Ride booked successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">🚘 Ride Share</h1>
          <p className="text-xl text-gray-300 mb-8">
            Get anywhere, anytime with real-time tracking and premium service.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 p-6 rounded-2xl border border-gray-700"
            >
              <h2 className="text-2xl font-bold mb-4">Book a Ride</h2>
              <p className="text-gray-300 mb-4">Enter your destination and we'll find the perfect ride for you.</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pickup Location"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleBookRide}
                  className="w-full bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  Book Now
                </button>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 p-6 rounded-2xl border border-gray-700"
            >
              <h2 className="text-2xl font-bold mb-4">Become a Driver</h2>
              <p className="text-gray-300 mb-4">Join our network of professional drivers and earn on your schedule.</p>
              <button
                onClick={() => alert('Driver application coming soon!')}
                className="w-full bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Apply Now
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 