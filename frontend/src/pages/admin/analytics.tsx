import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format } from 'date-fns';

// Mock data for initial development
const mockPageViews = [
  { date: '2024-01-01', views: 100 },
  { date: '2024-01-02', views: 150 },
  { date: '2024-01-03', views: 200 },
  { date: '2024-01-04', views: 180 },
  { date: '2024-01-05', views: 220 },
];

const mockClickEvents = [
  { event: 'Button Click', count: 500 },
  { event: 'Form Submit', count: 300 },
  { event: 'Link Click', count: 200 },
  { event: 'Image View', count: 150 },
];

const mockSystemMetrics = {
  uptime: '99.9%',
  activeWorkers: 3,
  memoryUsage: '45%',
  cpuUsage: '30%',
};

const mockActiveUsers = [
  { id: 1, name: 'User 1', lastActive: '2 minutes ago' },
  { id: 2, name: 'User 2', lastActive: '5 minutes ago' },
  { id: 3, name: 'User 3', lastActive: '10 minutes ago' },
];

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pageViews, setPageViews] = useState(mockPageViews);
  const [clickEvents, setClickEvents] = useState(mockClickEvents);
  const [systemMetrics, setSystemMetrics] = useState(mockSystemMetrics);
  const [activeUsers, setActiveUsers] = useState(mockActiveUsers);

  const { lastMessage } = useWebSocket('ws://localhost:3001');

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'analytics') {
        setPageViews(data.pageViews);
        setClickEvents(data.clickEvents);
        setSystemMetrics(data.systemMetrics);
        setActiveUsers(data.activeUsers);
      }
    }
  }, [lastMessage]);

  const fetchAnalytics = async () => {
    try {
      const [pageViewsRes, clickEventsRes, systemRes] = await Promise.all([
        fetch(`/api/analytics?pageView&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`),
        fetch(`/api/analytics/click?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`),
        fetch('/api/analytics/system'),
      ]);

      const [pageViewsData, clickEventsData, systemData] = await Promise.all([
        pageViewsRes.json(),
        clickEventsRes.json(),
        systemRes.json(),
      ]);

      setPageViews(pageViewsData);
      setClickEvents(clickEventsData);
      setSystemMetrics(systemData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, dateRange]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
          </div>
          <Button onClick={fetchAnalytics}>Refresh</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pageViews}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Click Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clickEvents}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="event" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Active Users ({activeUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-500">Last active: {user.lastActive}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Uptime</span>
                    <span className="font-medium">{systemMetrics.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Workers</span>
                    <span className="font-medium">{systemMetrics.activeWorkers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-medium">{systemMetrics.memoryUsage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU Usage</span>
                    <span className="font-medium">{systemMetrics.cpuUsage}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 