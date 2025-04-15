import { useState } from 'react';
import { Smartphone, MessageSquare, QrCode } from 'lucide-react';
import QRCode from 'qrcode.react';

export function AppDownload() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showQR, setShowQR] = useState(false);

  const handleSMS = async () => {
    if (!phoneNumber) return;
    
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      alert('Download link sent to your phone!');
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Download Our App</h2>
        <p className="text-gray-600">Get the best delivery experience on your phone</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* App Store Badges */}
        <div className="flex flex-col items-center space-y-4">
          <a
            href="https://apps.apple.com/app/driftix"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src="/app-store-badge.svg"
              alt="Download on the App Store"
              className="h-12"
            />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.driftix"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src="/play-store-badge.svg"
              alt="Get it on Google Play"
              className="h-12"
            />
          </a>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <QrCode size={20} />
            <span>{showQR ? 'Hide QR Code' : 'Show QR Code'}</span>
          </button>
          
          {showQR && (
            <div className="p-4 bg-white rounded-lg shadow-lg">
              <QRCode
                value="https://driftix.com/download"
                size={200}
                level="H"
                includeMargin
              />
            </div>
          )}
        </div>

        {/* SMS Download */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-full max-w-xs">
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSMS}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            We'll send you a download link via SMS
          </p>
        </div>
      </div>
    </div>
  );
} 