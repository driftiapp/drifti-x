import { Router } from 'express';

declare const authRoutes: Router;
declare const userRoutes: Router;
declare const chatRoutes: Router;
declare const notificationRoutes: Router;
declare const uploadRoutes: Router;
declare const analyticsRoutes: Router;
declare const performanceRoutes: Router;
declare const securityRoutes: Router;
declare const healthRoutes: Router;

export {
  authRoutes,
  userRoutes,
  chatRoutes,
  notificationRoutes,
  uploadRoutes,
  analyticsRoutes,
  performanceRoutes,
  securityRoutes,
  healthRoutes,
}; 