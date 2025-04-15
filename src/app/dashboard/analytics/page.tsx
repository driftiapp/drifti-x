import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { OrdersChart } from "@/components/analytics/orders-chart";
import { MetricsGrid } from "@/components/analytics/metrics-grid";
import { StoreSelector } from "@/components/analytics/store-selector";

export default function AnalyticsDashboard() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <StoreSelector />
          <DateRangePicker />
        </div>
      </div>

      <MetricsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 