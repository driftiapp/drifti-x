import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState;
    const status = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      mongo: {
        connected: mongoStatus === 1,
        state: mongoStatus,
        stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoStatus]
      }
    };
    
    res.json(status);
  } catch (error: unknown) {
    res.status(500).json({
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 