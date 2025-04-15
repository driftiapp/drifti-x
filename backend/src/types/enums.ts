/**
 * Enum representing the possible notification types
 */
export enum NotificationType {
  /** Notification for order updates */
  ORDER_UPDATE = 'ORDER_UPDATE',
  /** Notification for delivery updates */
  DELIVERY_UPDATE = 'DELIVERY_UPDATE',
  /** Notification for payment updates */
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  /** Notification for system updates */
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  /** Notification for promotional offers */
  PROMOTION = 'PROMOTION',
  /** Notification for account updates */
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
  /** Notification for security alerts */
  SECURITY_ALERT = 'SECURITY_ALERT'
}

/**
 * Enum representing the possible notification channels
 */
export enum NotificationChannel {
  /** Email notifications */
  EMAIL = 'EMAIL',
  /** SMS notifications */
  SMS = 'SMS',
  /** Push notifications */
  PUSH = 'PUSH',
  /** In-app notifications */
  IN_APP = 'IN_APP',
  /** Webhook notifications */
  WEBHOOK = 'WEBHOOK'
}

/**
 * Enum representing the possible user roles
 */
export enum UserRole {
  /** Super administrator */
  SUPER_ADMIN = 'SUPER_ADMIN',
  /** Administrator */
  ADMIN = 'ADMIN',
  /** Store owner */
  STORE_OWNER = 'STORE_OWNER',
  /** Driver */
  DRIVER = 'DRIVER',
  /** Customer */
  CUSTOMER = 'CUSTOMER',
  /** Support agent */
  SUPPORT = 'SUPPORT'
}

/**
 * Enum representing the possible order statuses
 */
export enum OrderStatus {
  /** Order is pending */
  PENDING = 'PENDING',
  /** Order is confirmed */
  CONFIRMED = 'CONFIRMED',
  /** Order is being prepared */
  PREPARING = 'PREPARING',
  /** Order is ready for pickup */
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  /** Order is out for delivery */
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  /** Order is delivered */
  DELIVERED = 'DELIVERED',
  /** Order is cancelled */
  CANCELLED = 'CANCELLED',
  /** Order is refunded */
  REFUNDED = 'REFUNDED',
  /** Order is failed */
  FAILED = 'FAILED'
} 