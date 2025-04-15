import { Schema, model, Model, Document } from 'mongoose';
import { ILiquorOrder } from '../types/liquorDelivery';
import { OrderStatus, PaymentStatus } from '../types/order';
import { logger } from '../utils/logger';

/**
 * Order schema definition
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
      lat: Number,
      lng: Number
    }
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

// Add virtual fields
orderSchema.virtual('totalWithFee').get(function() {
  return this.totalAmount + this.deliveryFee;
});

orderSchema.virtual('isPaid').get(function() {
  return this.paymentStatus === PaymentStatus.PAID;
});

orderSchema.virtual('isCompleted').get(function() {
  return this.status === OrderStatus.COMPLETED;
});

// Add pre-save middleware
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    // Recalculate total amount if items are modified
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  next();
});

// Add post-save middleware
orderSchema.post('save', function(doc) {
  logger.info(`Order ${doc._id} saved with status ${doc.status} and payment status ${doc.paymentStatus}`);
});

// Add static methods
orderSchema.statics.findByCustomer = function(customerId: string) {
  return this.find({ customer: customerId }).sort({ createdAt: -1 });
};

orderSchema.statics.findByStore = function(storeId: string) {
  return this.find({ store: storeId }).sort({ createdAt: -1 });
};

orderSchema.statics.findByDriver = function(driverId: string) {
  return this.find({ driver: driverId }).sort({ createdAt: -1 });
};

orderSchema.statics.findByStatus = function(status: OrderStatus) {
  return this.find({ status }).sort({ createdAt: -1 });
};

orderSchema.statics.findByPaymentStatus = function(paymentStatus: PaymentStatus) {
  return this.find({ paymentStatus }).sort({ createdAt: -1 });
};

// Add instance methods
orderSchema.methods.updateStatus = async function(newStatus: OrderStatus) {
  this.status = newStatus;
  return this.save();
};

orderSchema.methods.updatePaymentStatus = async function(newPaymentStatus: PaymentStatus) {
  this.paymentStatus = newPaymentStatus;
  return this.save();
};

// Define the model interface
export interface IOrderModel extends Model<ILiquorOrder> {
  findByCustomer(customerId: string): Promise<ILiquorOrder[]>;
  findByStore(storeId: string): Promise<ILiquorOrder[]>;
  findByDriver(driverId: string): Promise<ILiquorOrder[]>;
  findByStatus(status: OrderStatus): Promise<ILiquorOrder[]>;
  findByPaymentStatus(paymentStatus: PaymentStatus): Promise<ILiquorOrder[]>;
}

// Create and export the model
export const OrderModel = model<ILiquorOrder, IOrderModel>('Order', orderSchema); 