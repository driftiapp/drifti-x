import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import { config } from '../src/config/config';
import { logger } from '../src/utils/logger';
import { HealthCheckService } from '../src/services/healthCheck.service';
import WebSocket from 'ws';
import Redis from 'ioredis';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const healthCheck = new HealthCheckService();
const cache = new Redis();

class MaintenanceScript {
  private isRunning = false;
  private checkInterval = 30000; // 30 seconds

  async start() {
    if (this.isRunning) {
      logger.info('Maintenance script is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting maintenance script...');

    // Initial checks
    await this.verifyEnvironment();
    await this.verifyDependencies();

    while (this.isRunning) {
      try {
        await this.runChecks();
        await new Promise(resolve => setTimeout(resolve, this.checkInterval));
      } catch (error) {
        logger.error('Error in maintenance script:', error);
        // Don't stop on error, just log and continue
      }
    }
  }

  private async verifyEnvironment() {
    try {
      // Check if required environment variables are set
      const requiredVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_USER',
        'EMAIL_PASS',
        'IPINFO_TOKEN'
      ];

      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        logger.error('Missing required environment variables:', missingVars);
        throw new Error('Missing required environment variables');
      }

      logger.info('Environment verification passed');
    } catch (error) {
      logger.error('Environment verification failed:', error);
      throw error;
    }
  }

  private async verifyDependencies() {
    try {
      // Check if required dependencies are installed
      const { stdout } = await execAsync('npm list --depth=0');
      const installedPackages = stdout.split('\n').map(line => line.split('@')[0].trim());

      const requiredPackages = [
        '@prisma/client',
        'axios',
        'winston',
        'zod'
      ];

      const missingPackages = requiredPackages.filter(pkg => !installedPackages.includes(pkg));
      if (missingPackages.length > 0) {
        logger.error('Missing required packages:', missingPackages);
        throw new Error('Missing required packages');
      }

      logger.info('Dependencies verification passed');
    } catch (error) {
      logger.error('Dependencies verification failed:', error);
      throw error;
    }
  }

  private async runChecks() {
    logger.info('Running maintenance checks...');
    
    // 1. Check TypeScript and linting
    await this.checkTypeScript();
    await this.checkLinting();

    // 2. Check database connection
    await this.checkDatabase();

    // 3. Check service connections
    await this.checkServices();

    // 4. Check API endpoints
    await this.checkEndpoints();

    logger.info('Maintenance checks completed');
  }

  private async checkTypeScript() {
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit');
      if (stderr) {
        logger.warn('TypeScript errors found:', stderr);
        await this.fixTypeScriptIssues(stderr);
      } else {
        logger.info('TypeScript check passed');
      }
    } catch (error) {
      logger.error('TypeScript check failed:', error);
    }
  }

  private async checkLinting() {
    try {
      const { stdout, stderr } = await execAsync('npx eslint . --fix');
      if (stderr) {
        logger.warn('Linting issues found and fixed:', stderr);
      } else {
        logger.info('Linting check passed');
      }
    } catch (error) {
      logger.error('Linting check failed:', error);
    }
  }

  private async checkDatabase() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection is healthy');
    } catch (error) {
      logger.error('Database connection failed:', error);
      await this.fixDatabaseIssues();
    }
  }

  private async checkServices() {
    try {
      const servicesStatus = await healthCheck.checkAllServices();
      let allHealthy = true;

      Object.entries(servicesStatus).forEach(([service, status]) => {
        if (!status.healthy) {
          allHealthy = false;
          logger.warn(`${service} service is not healthy:`, status.error);
          this.fixServiceIssues(service);
        }
      });

      if (allHealthy) {
        logger.info('All services are healthy');
      }
    } catch (error) {
      logger.error('Service health check failed:', error);
    }
  }

  private async checkEndpoints() {
    try {
      const endpoints = await healthCheck.checkAllEndpoints();
      let allHealthy = true;

      endpoints.forEach(endpoint => {
        if (!endpoint.healthy) {
          allHealthy = false;
          logger.warn(`Endpoint ${endpoint.path} is not responding correctly:`, endpoint.error);
          this.fixEndpointIssues(endpoint);
        }
      });

      if (allHealthy) {
        logger.info('All endpoints are healthy');
      }
    } catch (error) {
      logger.error('Endpoint health check failed:', error);
    }
  }

  private async fixTypeScriptIssues(error: string) {
    logger.info('Attempting to fix TypeScript issues...');
    // Add specific fixes based on error patterns
  }

  private async fixDatabaseIssues() {
    logger.info('Attempting to fix database issues...');
    // Add database recovery logic
  }

  private async fixServiceIssues(service: string) {
    logger.info(`Attempting to fix ${service} service issues...`);
    // Add service-specific recovery logic
  }

  private async fixEndpointIssues(endpoint: any) {
    logger.info(`Attempting to fix endpoint ${endpoint.path} issues...`);
    // Add endpoint-specific recovery logic
  }

  stop() {
    this.isRunning = false;
    logger.info('Maintenance script stopped');
  }
}

// Start the maintenance script
const maintenance = new MaintenanceScript();
maintenance.start();

// Handle process termination
process.on('SIGINT', () => {
  maintenance.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  maintenance.stop();
  process.exit(0);
});

class LocationService {
  private ws: WebSocket;
  private prisma: PrismaClient;
  
  constructor() {
    this.ws = new WebSocket('ws://localhost:8080/location');
    this.prisma = new PrismaClient();
    this.setupWebSocket();
  }
  
  private setupWebSocket() {
    this.ws.on('message', (data: string) => {
      const location = JSON.parse(data);
      this.updateLocation(location);
    });
  }
  
  async updateLocation(location: Location) {
    // Update location in database
    await this.prisma.location.update({
      where: { id: location.id },
      data: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        accuracy: location.accuracy
      }
    });

    // Notify services
    this.ws.send(JSON.stringify(location));
  }
}

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

class LocationProcessor {
  async processLocation(location: Location) {
    // Clean the data
    const cleanedLocation = this.cleanLocationData(location);

    // Validate the data
    if (!this.validateLocation(cleanedLocation)) {
      throw new Error('Invalid location data');
    }

    return cleanedLocation;
  }

  private cleanLocationData(location: Location): Location {
    return {
      id: location.id,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      timestamp: new Date(location.timestamp),
      accuracy: location.accuracy ? Number(location.accuracy) : undefined
    };
  }

  private validateLocation(location: Location): boolean {
    // Validate latitude (-90 to 90)
    if (location.latitude < -90 || location.latitude > 90) {
      return false;
    }

    // Validate longitude (-180 to 180)
    if (location.longitude < -180 || location.longitude > 180) {
      return false;
    }

    // Validate timestamp (not in future)
    if (location.timestamp > new Date()) {
      return false;
    }

    // Validate accuracy if present (must be positive)
    if (location.accuracy !== undefined && location.accuracy < 0) {
      return false;
    }

    return true;
  }
}

enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

interface OrderQuery {
  userId?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

class OrderService {
  private prisma: PrismaClient;
  private cache: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    this.cache = new Redis();
  }

  async getOrder(orderId: string): Promise<Order | null> {
    // Try cache first
    const cached = await this.cache.get(`order:${orderId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (order) {
      await this.cache.set(`order:${orderId}`, JSON.stringify(order), 'EX', 3600);
    }

    return order;
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    // Validate status transition
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!this.isValidStatusTransition(order.status, newStatus)) {
      throw new Error('Invalid status transition');
    }

    // Update in database
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    // Log status change
    await this.logStatusChange(orderId, order.status, newStatus);

    // Send notification
    await this.sendNotification(orderId, newStatus);

    // Invalidate cache
    await this.cache.del(`order:${orderId}`);
  }

  private isValidStatusTransition(current: OrderStatus, next: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      [OrderStatus.PICKED_UP]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: []
    };

    return validTransitions[current]?.includes(next) || false;
  }

  private async logStatusChange(orderId: string, oldStatus: OrderStatus, newStatus: OrderStatus) {
    await this.prisma.orderStatusLog.create({
      data: {
        orderId,
        oldStatus,
        newStatus,
        timestamp: new Date()
      }
    });
  }

  private async sendNotification(orderId: string, status: OrderStatus) {
    const order = await this.getOrder(orderId);
    if (!order) return;

    // Send notification to user
    await this.prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER_STATUS_CHANGE',
        message: `Your order #${orderId} status has been updated to ${status}`,
        read: false
      }
    });
  }
}

class OrderQueryService {
  private prisma: PrismaClient;
  private cache: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    this.cache = new Redis();
  }

  async getOrders(query: OrderQuery): Promise<Order[]> {
    const cacheKey = this.getCacheKey(query);
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Query from database
    const orders = await this.queryFromDB(query);

    // Update cache
    await this.updateCache(cacheKey, orders);

    return orders;
  }

  private getCacheKey(query: OrderQuery): string {
    return `orders:${JSON.stringify(query)}`;
  }

  private async getFromCache(key: string): Promise<Order[] | null> {
    const cached = await this.cache.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  private async updateCache(key: string, orders: Order[]) {
    await this.cache.set(key, JSON.stringify(orders), 'EX', 3600);
  }

  private async queryFromDB(query: OrderQuery): Promise<Order[]> {
    const { userId, status, startDate, endDate, page = 1, limit = 10 } = query;

    return await this.prisma.order.findMany({
      where: {
        ...(userId && { userId }),
        ...(status && { status }),
        ...(startDate && endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        })
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

interface User {
  _id: ObjectId;
  username: string;
  password: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'DELIVERY_PERSON' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

interface Order {
  _id: ObjectId;
  userId: ObjectId;
  deliveryPersonId?: ObjectId;
  status: OrderStatus;
  pickupLocation: Location;
  deliveryLocation: Location;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DeliveryPerson {
  _id: ObjectId;
  userId: ObjectId;
  currentLocation: Location;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  currentOrders: ObjectId[];
  totalDeliveries: number;
  rating: number;
  vehicle: {
    type: 'BIKE' | 'MOTORCYCLE' | 'CAR';
    plateNumber: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 用户集合索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ role: 1, status: 1 });

// 订单集合索引
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ deliveryPersonId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ 
  pickupLocation: '2dsphere',
  deliveryLocation: '2dsphere'
});

// 配送员集合索引
db.deliveryPersons.createIndex({ userId: 1 }, { unique: true });
db.deliveryPersons.createIndex({ status: 1 });
db.deliveryPersons.createIndex({ currentLocation: '2dsphere' });

// 创建复合索引
db.orders.createIndex({
  userId: 1,
  status: 1,
  createdAt: -1
});

// 创建地理空间索引
db.orders.createIndex({
  pickupLocation: '2dsphere',
  deliveryLocation: '2dsphere'
});

// 创建文本索引
db.orders.createIndex({
  'items.name': 'text',
  'items.description': 'text'
});

describe('Scheduler', () => {
  let scheduler: Scheduler;
  
  beforeEach(() => {
    scheduler = new Scheduler();
  });
  
  it('should assign order to nearest delivery person', async () => {
    const order: DeliveryOrder = {
      id: '1',
      pickupLocation: { latitude: 39.9, longitude: 116.4 },
      deliveryLocation: { latitude: 39.9, longitude: 116.5 },
      priority: 1,
      createTime: new Date()
    };
    
    const deliveryPerson = await scheduler.assignOrder(order);
    
    expect(deliveryPerson).toBeDefined();
    expect(deliveryPerson.currentOrders.length).toBeLessThan(
      deliveryPerson.capacity
    );
  });
  
  it('should consider priority when assigning orders', async () => {
    const highPriorityOrder: DeliveryOrder = {
      id: '1',
      pickupLocation: { latitude: 39.9, longitude: 116.4 },
      deliveryLocation: { latitude: 39.9, longitude: 116.5 },
      priority: 3,
      createTime: new Date()
    };
    
    const lowPriorityOrder: DeliveryOrder = {
      id: '2',
      pickupLocation: { latitude: 39.9, longitude: 116.4 },
      deliveryLocation: { latitude: 39.9, longitude: 116.5 },
      priority: 1,
      createTime: new Date()
    };
    
    const deliveryPerson1 = await scheduler.assignOrder(highPriorityOrder);
    const deliveryPerson2 = await scheduler.assignOrder(lowPriorityOrder);
    
    expect(deliveryPerson1.id).not.toBe(deliveryPerson2.id);
  });
});

describe('OrderService', () => {
  let orderService: OrderService;
  let mockDB: MockDB;
  
  beforeEach(() => {
    mockDB = new MockDB();
    orderService = new OrderService(mockDB);
  });
  
  it('should update order status correctly', async () => {
    const orderId = '1';
    const newStatus = OrderStatus.ACCEPTED;
    
    await orderService.updateOrderStatus(orderId, newStatus);
    
    const order = await mockDB.getOrder(orderId);
    expect(order.status).toBe(newStatus);
  });
  
  it('should reject invalid status transition', async () => {
    const orderId = '1';
    const invalidStatus = OrderStatus.DELIVERED;
    
    await expect(
      orderService.updateOrderStatus(orderId, invalidStatus)
    ).rejects.toThrow('Invalid status transition');
  });
});

describe('Order API', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = await createApp();
  });
  
  it('should create order successfully', async () => {
    const orderData = {
      userId: '1',
      pickupLocation: {
        latitude: 39.9,
        longitude: 116.4,
        address: '北京市朝阳区'
      },
      deliveryLocation: {
        latitude: 39.9,
        longitude: 116.5,
        address: '北京市海淀区'
      },
      items: [
        {
          name: '测试商品',
          quantity: 1,
          price: 100
        }
      ]
    };
    
    const response = await request(app)
      .post('/api/v1/orders')
      .send(orderData);
    
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe(OrderStatus.PENDING);
  });
  
  it('should validate order data', async () => {
    const invalidOrderData = {
      userId: '1',
      // 缺少必要字段
    };
    
    const response = await request(app)
      .post('/api/v1/orders')
      .send(invalidOrderData);
    
    expect(response.status).toBe(400);
  });
});

describe('Database Operations', () => {
  let db: Database;
  
  beforeAll(async () => {
    db = await connectToTestDB();
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  it('should maintain data consistency', async () => {
    // 开始事务
    const session = await db.startSession();
    session.startTransaction();
    
    try {
      // 创建订单
      const order = await db.orders.insertOne({
        userId: '1',
        status: OrderStatus.PENDING,
        // ... 其他字段
      }, { session });
      
      // 更新用户订单数
      await db.users.updateOne(
        { _id: '1' },
        { $inc: { orderCount: 1 } },
        { session }
      );
      
      // 提交事务
      await session.commitTransaction();
      
      // 验证数据
      const updatedUser = await db.users.findOne({ _id: '1' });
      expect(updatedUser.orderCount).toBe(1);
    } catch (error) {
      // 回滚事务
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });
});

class OrderRepository {
  async getOrdersByUser(userId: string, page: number, limit: number) {
    return this.db.orders
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .project({
        _id: 1,
        status: 1,
        createdAt: 1,
        totalAmount: 1
      })
      .toArray();
  }
  
  async getOrderDetails(orderId: string) {
    return this.db.orders.aggregate([
      { $match: { _id: orderId } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          'user.password': 0,
          'user.salt': 0
        }
      }
    ]).toArray();
  }
}

class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT!)
    });
  }
  
  async getOrder(orderId: string): Promise<Order | null> {
    const cached = await this.redis.get(`order:${orderId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const order = await this.db.orders.findOne({ _id: orderId });
    if (order) {
      await this.redis.set(
        `order:${orderId}`,
        JSON.stringify(order),
        'EX',
        3600 // 1小时过期
      );
    }
    
    return order;
  }
  
  async invalidateOrder(orderId: string) {
    await this.redis.del(`order:${orderId}`);
  }
}

class MemoryCache {
  private cache: Map<string, CacheItem>;
  private ttl: number;
  
  constructor(ttl: number = 3600) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key: string, value: any) {
    this.cache.set(key, {
      value,
      expireAt: Date.now() + this.ttl * 1000
    });
  }
  
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  delete(key: string) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

class AuthService {
  private jwtSecret: string;
  
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
  }
  
  generateToken(user: User): string {
    return jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      this.jwtSecret,
      {
        expiresIn: '24h'
      }
    );
  }
  
  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }
  
  async authenticate(token: string): Promise<User> {
    try {
      const payload = this.verifyToken(token);
      const user = await this.userService.getUserById(payload.id);
      
      if (!user || user.role !== payload.role) {
        throw new Error('Invalid token');
      }
      
      return user;
    } catch (error) {
      throw new Error('Authentication failed');
    }
  }
}

enum Role {
  CUSTOMER = 'CUSTOMER',
  DELIVERY_PERSON = 'DELIVERY_PERSON',
  ADMIN = 'ADMIN'
}

enum Permission {
  VIEW_ORDERS = 'VIEW_ORDERS',
  CREATE_ORDER = 'CREATE_ORDER',
  UPDATE_ORDER = 'UPDATE_ORDER',
  VIEW_USERS = 'VIEW_USERS',
  MANAGE_USERS = 'MANAGE_USERS'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.CUSTOMER]: [
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDER
  ],
  [Role.DELIVERY_PERSON]: [
    Permission.VIEW_ORDERS,
    Permission.UPDATE_ORDER
  ],
  [Role.ADMIN]: [
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDER,
    Permission.UPDATE_ORDER,
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS
  ]
};

class AuthorizationService {
  hasPermission(user: User, permission: Permission): boolean {
    return rolePermissions[user.role].includes(permission);
  }
  
  async authorize(user: User, permission: Permission): Promise<void> {
    if (!this.hasPermission(user, permission)) {
      throw new Error('Unauthorized');
    }
  }
}

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor() {
    this.key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY!,
      'salt',
      32
    );
  }
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.key,
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    });
  }
  
  decrypt(encryptedData: string): string {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

class ValidationService {
  private schemas: Record<string, z.ZodSchema>;
  
  constructor() {
    this.schemas = {
      order: z.object({
        userId: z.string().min(1),
        pickupLocation: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          address: z.string().min(1)
        }),
        deliveryLocation: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          address: z.string().min(1)
        }),
        items: z.array(
          z.object({
            name: z.string().min(1),
            quantity: z.number().min(1),
            price: z.number().min(0)
          })
        ).min(1)
      }),
      user: z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(['CUSTOMER', 'DELIVERY_PERSON', 'ADMIN'])
      })
    };
  }
  
  validate<T>(schemaName: string, data: unknown): T {
    const schema = this.schemas[schemaName];
    if (!schema) {
      throw new Error(`Schema ${schemaName} not found`);
    }
    
    return schema.parse(data) as T;
  }
}

class PerformanceMonitor {
  private metrics: Map<string, Metric>;
  
  constructor() {
    this.metrics = new Map();
  }
  
  recordMetric(name: string, value: number) {
    const metric = this.metrics.get(name) || {
      sum: 0,
      count: 0,
      min: Infinity,
      max: -Infinity
    };
    
    metric.sum += value;
    metric.count++;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    
    this.metrics.set(name, metric);
  }
  
  getMetrics(): Record<string, MetricStats> {
    const stats: Record<string, MetricStats> = {};
    
    for (const [name, metric] of this.metrics.entries()) {
      stats[name] = {
        average: metric.sum / metric.count,
        min: metric.min,
        max: metric.max,
        count: metric.count
      };
    }
    
    return stats;
  }
}

class ErrorMonitor {
  private errors: ErrorLog[];
  
  constructor() {
    this.errors = [];
  }
  
  logError(error: Error, context: Record<string, any>) {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      context
    };
    
    this.errors.push(errorLog);
    
    // 发送到错误追踪服务
    this.sendToErrorTracking(errorLog);
    
    // 检查是否需要告警
    this.checkAlertConditions();
  }
  
  private checkAlertConditions() {
    const recentErrors = this.errors.filter(
      error => Date.now() - error.timestamp.getTime() < 3600000 // 1小时内
    );
    
    if (recentErrors.length > 10) {
      this.sendAlert('High error rate detected');
    }
  }
  
  private sendToErrorTracking(errorLog: ErrorLog) {
    // 实现错误追踪服务集成
  }
  
  private sendAlert(message: string) {
    // 实现告警发送逻辑
  }
}

class OrderMonitor {
  private stats: OrderStats;
  
  constructor() {
    this.stats = {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      averageDeliveryTime: 0,
      revenue: 0
    };
  }
  
  updateStats(order: Order) {
    this.stats.totalOrders++;
    
    if (order.status === OrderStatus.DELIVERED) {
      this.stats.completedOrders++;
      this.stats.revenue += order.totalAmount;
      
      const deliveryTime = order.actualDeliveryTime!.getTime() -
        order.createdAt.getTime();
      this.stats.averageDeliveryTime =
        (this.stats.averageDeliveryTime * (this.stats.completedOrders - 1) +
          deliveryTime) /
        this.stats.completedOrders;
    } else if (order.status === OrderStatus.CANCELLED) {
      this.stats.cancelledOrders++;
    }
    
    this.checkMetrics();
  }
  
  private checkMetrics() {
    const cancellationRate =
      this.stats.cancelledOrders / this.stats.totalOrders;
    
    if (cancellationRate > 0.1) {
      this.sendAlert('High order cancellation rate detected');
    }
    
    if (this.stats.averageDeliveryTime > 3600000) {
      this.sendAlert('Average delivery time exceeds 1 hour');
    }
  }
  
  private sendAlert(message: string) {
    // 实现告警发送逻辑
  }
}

class DeliveryMonitor {
  private stats: DeliveryStats;
  
  constructor() {
    this.stats = {
      activeDeliveryPersons: 0,
      totalDeliveries: 0,
      averageRating: 0,
      onTimeDeliveries: 0
    };
  }
  
  updateStats(delivery: Delivery) {
    this.stats.totalDeliveries++;
    
    if (delivery.actualDeliveryTime <= delivery.estimatedDeliveryTime) {
      this.stats.onTimeDeliveries++;
    }
    
    this.stats.averageRating =
      (this.stats.averageRating * (this.stats.totalDeliveries - 1) +
        delivery.rating) /
      this.stats.totalDeliveries;
    
    this.checkMetrics();
  }
  
  private checkMetrics() {
    const onTimeRate =
      this.stats.onTimeDeliveries / this.stats.totalDeliveries;
    
    if (onTimeRate < 0.9) {
      this.sendAlert('Low on-time delivery rate detected');
    }
    
    if (this.stats.averageRating < 4.0) {
      this.sendAlert('Average delivery rating below 4.0');
    }
  }
  
  private sendAlert(message: string) {
    // 实现告警发送逻辑
  }
}

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '外卖配送系统 API',
      version: '1.0.0',
      description: '外卖配送系统 API 文档'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.example.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: 创建新订单
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - pickupLocation
 *               - deliveryLocation
 *               - items
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               pickupLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               deliveryLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *     responses:
 *       201:
 *         description: 订单创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 estimatedDeliveryTime:
 *                   type: string
 *                 deliveryFee:
 *                   type: number
 *                 totalAmount:
 *                   type: number
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */ 