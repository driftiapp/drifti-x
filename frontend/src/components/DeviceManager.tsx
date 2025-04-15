import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Device {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  os: string;
  browser: string;
  lastIp: string;
  lastSeen: string;
  firstSeen: string;
  isTrusted: boolean;
}

export function DeviceManager() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to revoke device');
      }

      setDevices(devices.filter(device => device.id !== deviceId));
      toast.success('Device access revoked');
    } catch (err) {
      toast.error('Failed to revoke device');
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trusted Devices</CardTitle>
        <CardDescription>
          Manage devices that have access to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No trusted devices</AlertTitle>
            <AlertDescription>
              You haven't marked any devices as trusted yet.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div className="font-medium">
                      {device.deviceName || `${device.deviceType} (${device.os})`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {device.browser}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {device.lastIp}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={device.isTrusted ? "default" : "secondary"}>
                      {device.isTrusted ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Trusted
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Untrusted
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeDevice(device.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 