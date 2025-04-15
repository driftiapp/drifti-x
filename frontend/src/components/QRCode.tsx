'use client';

import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';

const DynamicQRCode = dynamic(() => Promise.resolve(QRCodeSVG), {
  ssr: false,
});

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
}

export const QRCode = ({ value, size = 200, level = 'H', className }: QRCodeProps) => {
  return (
    <DynamicQRCode
      value={value}
      size={size}
      level={level}
      className={className}
      fgColor="#ffffff"
      bgColor="transparent"
    />
  );
}; 