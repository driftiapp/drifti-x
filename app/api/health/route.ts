import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import connectDB from '@/lib/mongodb';

interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    mongodb: {
      connected: boolean;
      state: number;
      stateText: string;
    };
    redis: {
      connected: boolean;
      error: string | null;
    };
  };
}

export async function GET() {
  const status: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: {
        connected: false,
        state: 0,
        stateText: 'unknown'
      },
      redis: {
        connected: false,
        error: null
      }
    }
  };

  try {
    // Check MongoDB
    await connectDB();
    const mongoStatus = mongoose.connection.readyState;
    status.services.mongodb = {
      connected: mongoStatus === 1,
      state: mongoStatus,
      stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoStatus] || 'unknown'
    };

    // Check Redis
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined');
    }

    const redis = new Redis(redisUrl);
    await redis.ping();
    await redis.quit();
    status.services.redis = {
      connected: true,
      error: null
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Health check failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('REDIS_URL')) {
        status.services.redis.error = 'Redis URL not configured';
      } else if (error.message.includes('ECONNREFUSED')) {
        status.services.redis.error = 'Connection refused';
      } else {
        status.services.redis.error = error.message;
      }
    } else {
      status.services.redis.error = 'Unknown error';
    }

    status.status = 'error';
    return NextResponse.json(status, { status: 500 });
  }
} 