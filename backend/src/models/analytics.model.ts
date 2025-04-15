import mongoose, { Schema, Document } from 'mongoose';
import { logger } from '../utils/logger';

export interface IAnalytics extends Document {
  userId?: mongoose.Types.ObjectId;
  event: 'page_view' | 'click' | 'login' | 'order_created' | 'system_metric';
  metadata: {
    page?: string;
    button?: string;
    feature?: string;
    [key: string]: any;
  };
  timestamp: Date;
  value?: number;
  tags?: string[];
}

const analyticsSchema = new Schema<IAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  event: {
    type: String,
    required: true,
    enum: ['page_view', 'click', 'login', 'order_created', 'system_metric'],
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  value: {
    type: Number,
    required: false
  },
  tags: [{
    type: String,
    required: false
  }]
}, {
  timestamps: true
});

// Indexes for common queries
analyticsSchema.index({ event: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, event: 1, timestamp: -1 });
analyticsSchema.index({ 'metadata.page': 1, timestamp: -1 });

// Pre-save middleware for validation
analyticsSchema.pre('save', function(next) {
  try {
    // Validate metadata structure based on event type
    switch (this.event) {
      case 'page_view':
        if (!this.metadata.page) {
          throw new Error('Page view events require a page in metadata');
        }
        break;
      case 'click':
        if (!this.metadata.button && !this.metadata.feature) {
          throw new Error('Click events require a button or feature in metadata');
        }
        break;
      case 'system_metric':
        if (typeof this.value !== 'number') {
          throw new Error('System metric events require a numeric value');
        }
        break;
    }
    next();
  } catch (error) {
    logger.error('Analytics validation error:', error);
    next(error as Error);
  }
});

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema); 