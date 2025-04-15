import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from '@/providers/PostHogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Driftix - On-Demand Delivery Services',
  description: 'Get anything delivered to your doorstep - rides, food, vape, and liquor delivery services.',
  keywords: ['delivery', 'rides', 'food', 'vape', 'liquor', 'on-demand'],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
} 