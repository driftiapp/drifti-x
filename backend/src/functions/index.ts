import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import app from '../app';

/**
 * Initialize Firebase Admin with service account credentials
 * @throws {Error} If Firebase configuration is missing
 */
function initializeFirebaseAdmin(): void {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      throw new Error('Missing Firebase configuration');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
      projectId,
    });

    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

// Initialize Firebase Admin
initializeFirebaseAdmin();

/**
 * HTTP API function handler
 * @type {functions.HttpsFunction}
 */
export const api = functions.https.onRequest(async (request, response) => {
  try {
    logger.info('API request received', {
      method: request.method,
      path: request.path,
      query: request.query,
    });

    await app(request, response);

    logger.info('API request completed', {
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
    });
  } catch (error) {
    logger.error('API request failed:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Scheduled function that runs every 24 hours
 * @type {functions.CloudFunction}
 */
export const dailyTask = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      logger.info('Starting daily task', { timestamp: context.timestamp });
      // Add your daily task logic here
      logger.info('Daily task completed successfully');
    } catch (error) {
      logger.error('Daily task failed:', error);
      throw error;
    }
  });

/**
 * Background function triggered by Firestore events
 * @type {functions.CloudFunction}
 */
export const backgroundTask = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    try {
      logger.info('Processing new order', {
        orderId: context.params.orderId,
        data: snapshot.data(),
      });
      // Add your background task logic here
      logger.info('Order processing completed');
    } catch (error) {
      logger.error('Order processing failed:', error);
      throw error;
    }
  }); 