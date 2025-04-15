import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { getMockMetrics } from "@/lib/mock-analytics";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {Math.abs(change)}% from last period
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsGrid() {
  const metrics = getMockMetrics();

  const metricCards = [
    {
      title: "Total Revenue",
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      change: metrics.change.totalRevenue,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Total Orders",
      value: metrics.totalOrders.toLocaleString(),
      change: metrics.change.totalOrders,
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Unique Customers",
      value: metrics.uniqueCustomers.toLocaleString(),
      change: metrics.change.uniqueCustomers,
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Average Order Value",
      value: `$${metrics.averageOrderValue.toLocaleString()}`,
      change: metrics.change.averageOrderValue,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
} 