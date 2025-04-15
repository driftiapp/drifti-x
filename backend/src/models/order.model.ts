import { Schema, model, Model, Document, Types } from 'mongoose';
import { ILiquorOrder, ILiquorOrderItem } from '../types/liquorDelivery';
import { OrderStatus, PaymentStatus } from '../types/order';
import { logger } from '../utils/logger';
import { AppError, ErrorCode } from '../utils/AppError';
import { z } from 'zod';

/**
 * Zod schema for order item validation
 */
const orderItemSchema = z.object({
  product: z.instanceof(Types.ObjectId),
  quantity: z.number().min(1),
  price: z.number().min(0),
  name: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  volume: z.number().min(0).optional(),
  alcoholContent: z.number().min(0).max(100).optional()
});

/**
 * Zod schema for delivery address validation
 */
const deliveryAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  apartment: z.string().optional(),
  floor: z.string().optional(),
  instructions: z.string().optional()
});

/**
 * Order schema definition
 * @typedef {Object} OrderSchema
 * @property {ObjectId} customer - The customer who placed the order
 * @property {ObjectId} store - The store where the order was placed
 * @property {ObjectId} driver - The driver assigned to the order
 * @property {Array} items - The items in the order
 * @property {number} totalAmount - The total amount of the order
 * @property {number} deliveryFee - The delivery fee for the order
 * @property {string} status - The status of the order
 * @property {string} paymentStatus - The payment status of the order
 * @property {Object} deliveryAddress - The delivery address for the order
 */
const orderSchema = new Schema<ILiquorOrder>({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  store: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
    index: true
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    name: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    },
    imageUrl: {
      type: String,
      required: false
    },
    category: {
      type: String,
      required: false
    },
    brand: {
      type: String,
      required: false
    },
    volume: {
      type: Number,
      required: false,
      min: 0
    },
    alcoholContent: {
      type: Number,
      required: false,
      min: 0,
      max: 100
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: false,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        required: false,
        min: -180,
        max: 180
      }
    },
    apartment: {
      type: String,
      required: false
    },
    floor: {
      type: String,
      required: false
    },
    instructions: {
      type: String,
      required: false
    }
  },
  estimatedDeliveryTime: {
    type: Date,
    required: false
  },
  actualDeliveryTime: {
    type: Date,
    required: false
  },
  cancellationReason: {
    type: String,
    required: false
  },
  cancellationTime: {
    type: Date,
    required: false
  },
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for common queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ store: 1, status: 1 });
orderSchema.index({ driver: 1, status: 1 });

/**
 * Virtual field for total amount including delivery fee
 * @returns {number} The total amount including delivery fee
 */
orderSchema.virtual('totalWithFee').get(function(this: Document & ILiquorOrder) {
  return this.totalAmount + this.deliveryFee;
});

/**
 * Virtual field for checking if the order is paid
 * @returns {boolean} Whether the order is paid
 */
orderSchema.virtual('isPaid').get(function(this: Document & ILiquorOrder) {
  return this.paymentStatus === PaymentStatus.PAID;
});

/**
 * Virtual field for checking if the order is completed
 * @returns {boolean} Whether the order is completed
 */
orderSchema.virtual('isCompleted').get(function(this: Document & ILiquorOrder) {
  return this.status === OrderStatus.COMPLETED;
});

orderSchema.virtual('isCancelled').get(function(this: Document & ILiquorOrder) {
  return this.status === OrderStatus.CANCELLED;
});

orderSchema.virtual('isActive').get(function(this: Document & ILiquorOrder) {
  return !this.isCompleted && !this.isCancelled;
});

// Add pre-save middleware
orderSchema.pre('save', async function(this: Document & ILiquorOrder, next) {
  try {
    if (this.isModified('items')) {
      // Validate items
      for (const item of this.items) {
        await orderItemSchema.parseAsync(item);
      }
      // Recalculate total amount if items are modified
      this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    if (this.isModified('deliveryAddress')) {
      // Validate delivery address
      await deliveryAddressSchema.parseAsync(this.deliveryAddress);
    }

    if (this.isModified('status') && this.status === OrderStatus.CANCELLED) {
      this.cancellationTime = new Date();
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid order data', ErrorCode.VALIDATION_ERROR, {
        validationErrors: error.errors
      }));
    } else {
      next(error);
    }
  }
});

// Add post-save middleware
orderSchema.post('save', function(this: Document & ILiquorOrder) {
  logger.info('Order saved', {
    orderId: this._id,
    status: this.status,
    paymentStatus: this.paymentStatus,
    customer: this.customer,
    store: this.store,
    driver: this.driver
  });
});

/**
 * Find orders by customer ID
 * @param {string} customerId - The customer ID
 * @returns {Promise<ILiquorOrder[]>} The orders for the customer
 * @throws {AppError} If the orders cannot be retrieved
 */
orderSchema.statics.findByCustomer = async function(customerId: string): Promise<ILiquorOrder[]> {
  try {
    return await this.find({ customer: customerId }).sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error finding orders by customer:', error);
    throw new AppError('Failed to find orders by customer', ErrorCode.DATABASE_ERROR, {
      context: { error }
    });
  }
};

/**
 * Find orders by store ID
 * @param {string} storeId - The store ID
 * @returns {Promise<ILiquorOrder[]>} The orders for the store
 * @throws {AppError} If the orders cannot be retrieved
 */
orderSchema.statics.findByStore = async function(storeId: string): Promise<ILiquorOrder[]> {
  try {
    return await this.find({ store: storeId }).sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error finding orders by store:', error);
    throw new AppError('Failed to find orders by store', ErrorCode.DATABASE_ERROR, {
      context: { error }
    });
  }
};

/**
 * Find orders by driver ID
 * @param {string} driverId - The driver ID
 * @returns {Promise<ILiquorOrder[]>} The orders for the driver
 * @throws {AppError} If the orders cannot be retrieved
 */
orderSchema.statics.findByDriver = async function(driverId: string): Promise<ILiquorOrder[]> {
  try {
    return await this.find({ driver: driverId }).sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error finding orders by driver:', error);
    throw new AppError('Failed to find orders by driver', ErrorCode.DATABASE_ERROR, {
      context: { error }
    });
  }
};

/**
 * Find orders by status
 * @param {OrderStatus} status - The order status
 * @returns {Promise<ILiquorOrder[]>} The orders with the specified status
 * @throws {AppError} If the orders cannot be retrieved
 */
orderSchema.statics.findByStatus = async function(status: OrderStatus): Promise<ILiquorOrder[]> {
  try {
    return await this.find({ status }).sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error finding orders by status:', error);
    throw new AppError('Failed to find orders by status', ErrorCode.DATABASE_ERROR, {
      context: { error }
    });
  }
};

/**
 * Find orders by payment status
 * @param {PaymentStatus} paymentStatus - The payment status
 * @returns {Promise<ILiquorOrder[]>} The orders with the specified payment status
 * @throws {AppError} If the orders cannot be retrieved
 */
orderSchema.statics.findByPaymentStatus = async function(paymentStatus: PaymentStatus): Promise<ILiquorOrder[]> {
  try {
    return await this.find({ paymentStatus }).sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error finding orders by payment status:', error);
    throw new AppError('Failed to find orders by payment status', ErrorCode.DATABASE_ERROR, {
      context: { error }
    });
  }
};

orderSchema.statics.findActiveOrders = function() {
  return this.find({
    status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
  }).sort({ createdAt: -1 });
};

/**
 * Update the status of an order
 * @param {OrderStatus} newStatus - The new status
 * @returns {Promise<ILiquorOrder>} The updated order
 * @throws {AppError} If the order cannot be updated
 */
orderSchema.methods.updateStatus = async function(this: Document & ILiquorOrder, newStatus: OrderStatus, reason?: string): Promise<ILiquorOrder> {
  try {
    this.status = newStatus;
    if (reason) {
      this.cancellationReason = reason;
    }
    return await this.save();
  } catch (error) {
    logger.error('Error updating order status:', error);
    throw new AppError('Failed to update order status', ErrorCode.DATABASE_ERROR, {
      context: { error }
    });
  }
};

/**
 * Update the payment status of an order
 * @param {PaymentStatus} newPaymentStatus - The new payment status
 * @returns {Promise<ILiquorOrder>} The updated order
 * @throws {AppError} If the order cannot be updated
 */
orderSchema.methods.updatePaymentStatus = async function(this: Document & ILiquorOrder, newPaymentStatus: PaymentStatus): Promise<ILiquorOrder> {
  try {
    this.paymentStatus = newPaymentStatus;
    return await this.save();
  } catch (error) {
    logger.error('Error updating order payment status:', error);
    throw new AppError('Failed to update order payment status', ErrorCode.DATABASE_ERROR, {
      context: { error }
    });
  }
};

orderSchema.methods.addItem = async function(this: Document & ILiquorOrder, item: ILiquorOrderItem) {
  try {
    await orderItemSchema.parseAsync(item);
    this.items.push(item);
    return this.save();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Invalid item data', ErrorCode.VALIDATION_ERROR, {
        validationErrors: error.errors
      });
    }
    throw error;
  }
};

orderSchema.methods.removeItem = async function(this: Document & ILiquorOrder, itemIndex: number) {
  if (itemIndex < 0 || itemIndex >= this.items.length) {
    throw new AppError('Invalid item index', ErrorCode.VALIDATION_ERROR);
  }
  this.items.splice(itemIndex, 1);
  return this.save();
};

/**
 * Interface for the Order model
 * @interface IOrderModel
 * @extends {Model<ILiquorOrder>}
 */
export interface IOrderModel extends Model<ILiquorOrder> {
  findByCustomer(customerId: string): Promise<ILiquorOrder[]>;
  findByStore(storeId: string): Promise<ILiquorOrder[]>;
  findByDriver(driverId: string): Promise<ILiquorOrder[]>;
  findByStatus(status: OrderStatus): Promise<ILiquorOrder[]>;
  findByPaymentStatus(paymentStatus: PaymentStatus): Promise<ILiquorOrder[]>;
  findActiveOrders(): Promise<ILiquorOrder[]>;
}

// Create and export the model
export const OrderModel = model<ILiquorOrder, IOrderModel>('Order', orderSchema); 