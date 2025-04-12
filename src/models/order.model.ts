import { Schema, model } from 'mongoose';
import { 
  IOrder, 
  IOrderItem,
  IDeliveryAddress,
  OrderStatus,
  PaymentStatus, 
  PaymentMethod 
} from '../types/order';

const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: String,
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
    required: true
  },
  description: String,
  image: String
});

const addressSchema = new Schema<IDeliveryAddress>({
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
  country: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: (coords: number[]) => coords.length === 2,
      message: 'Coordinates must be [latitude, longitude]'
    }
  }
});

const orderSchema = new Schema<IOrder>({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shop: {
    type: Schema.Types.ObjectId,
    ref: 'SmokeShop',
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (items: IOrderItem[]) => items.length > 0,
      message: 'At least one item is required'
    }
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true
  },
  deliveryAddress: {
    type: addressSchema,
    required: true
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for common queries
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ shop: 1, status: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save hook to calculate total amount
orderSchema.pre('save', function(this: IOrder, next) {
  if (this.isModified('items')) {
    this.totalPrice = this.items.reduce((total: number, item: IOrderItem) => total + (item.price * item.quantity), 0);
  }
  next();
});

export const OrderModel = model<IOrder>('Order', orderSchema); 