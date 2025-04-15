import { connectToDatabase } from "@/lib/mongodb";
import Analytics from "@/models/Analytics";
import Order from "@/models/Order";

async function generateDailyAnalytics() {
  try {
    await connectToDatabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if analytics already exists for yesterday
    const existingAnalytics = await Analytics.findOne({ date: yesterday });
    if (existingAnalytics) {
      console.log("Analytics already exists for", yesterday);
      return;
    }

    // Get all orders from yesterday
    const orders = await Order.find({
      createdAt: {
        $gte: yesterday,
        $lt: today
      },
      status: "completed"
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = new Set(orders.map(order => order.userId.toString())).size;

    // Create analytics document
    await Analytics.create({
      date: yesterday,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      uniqueCustomers
    });

    console.log("Generated analytics for", yesterday);
  } catch (error) {
    console.error("Error generating daily analytics:", error);
  }
}

// Run the script
generateDailyAnalytics(); 