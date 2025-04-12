import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import app from '../src/app';

// Initialize Firebase Admin with service account credentials
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

// Create and export the API function
export const api = functions.https.onRequest(app);

// Optional: Export other functions as needed
// export const scheduledFunction = functions.pubsub
//   .schedule('every 24 hours')
//   .onRun(async (context) => {
//     // Your scheduled task here
//   }); 