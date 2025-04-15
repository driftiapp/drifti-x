import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  date: Date;
  storeId?: mongoose.Types.ObjectId;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema: Schema = new Schema({
  date: { type: Date, required: true, unique: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: false },
  totalOrders: { type: Number, required: true, default: 0 },
  totalRevenue: { type: Number, required: true, default: 0 },
  averageOrderValue: { type: Number, required: true, default: 0 },
  uniqueCustomers: { type: Number, required: true, default: 0 }
}, {
  timestamps: true
});

// Add indexes for performance
AnalyticsSchema.index({ date: 1 });
AnalyticsSchema.index({ createdAt: -1 });
AnalyticsSchema.index({ storeId: 1, date: 1 });

// Static methods for common analytics queries
AnalyticsSchema.statics.getWeeklySummary = async function(startDate: Date, storeId?: mongoose.Types.ObjectId) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  const matchStage: any = {
    date: { $gte: startDate, $lt: endDate }
  };

  if (storeId) {
    matchStage.storeId = storeId;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: '$totalOrders' },
        totalRevenue: { $sum: '$totalRevenue' },
        averageOrderValue: { $avg: '$averageOrderValue' },
        uniqueCustomers: { $sum: '$uniqueCustomers' }
      }
    }
  ]);
};

AnalyticsSchema.statics.getMonthlyRevenue = async function(year: number, month: number, storeId?: mongoose.Types.ObjectId) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const matchStage: any = {
    date: { $gte: startDate, $lte: endDate }
  };

  if (storeId) {
    matchStage.storeId = storeId;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalRevenue' },
        dailyAverages: { $avg: '$totalRevenue' }
      }
    }
  ]);
};

AnalyticsSchema.statics.getTopPerformingDays = async function(
  limit: number = 10,
  storeId?: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: any = {};
  
  if (storeId) {
    matchStage.storeId = storeId;
  }
  
  if (startDate && endDate) {
    matchStage.date = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $project: {
        date: 1,
        totalRevenue: 1,
        totalOrders: 1,
        averageOrderValue: 1,
        uniqueCustomers: 1
      }
    }
  ]);
};

export default mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema); 