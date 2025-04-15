export interface AnalyticsData {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
}

export const generateMockAnalytics = (days: number = 30): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const totalOrders = Math.floor(Math.random() * 100) + 20;
    const averageOrderValue = Math.floor(Math.random() * 50) + 30;
    const totalRevenue = totalOrders * averageOrderValue;
    const uniqueCustomers = Math.floor(totalOrders * 0.7);
    
    data.push({
      date: date.toISOString().split('T')[0],
      totalOrders,
      totalRevenue,
      averageOrderValue,
      uniqueCustomers
    });
  }
  
  return data.reverse();
};

export const getMockMetrics = () => {
  const data = generateMockAnalytics(1)[0];
  return {
    totalRevenue: data.totalRevenue,
    totalOrders: data.totalOrders,
    averageOrderValue: data.averageOrderValue,
    uniqueCustomers: data.uniqueCustomers,
    change: {
      totalRevenue: Math.floor(Math.random() * 20) - 5,
      totalOrders: Math.floor(Math.random() * 20) - 5,
      averageOrderValue: Math.floor(Math.random() * 10) - 2,
      uniqueCustomers: Math.floor(Math.random() * 15) - 3
    }
  };
}; 