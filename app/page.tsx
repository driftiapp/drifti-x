import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DriftiX - AI-Powered Local Services Search',
  description: 'Find local services with AI-powered suggestions and real-time filtering',
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-center mb-4">
        🚀 DriftiX is alive!
      </h1>
      <p className="text-xl text-gray-600 text-center">
        AI-Powered Local Services Search
      </p>
    </main>
  );
} 