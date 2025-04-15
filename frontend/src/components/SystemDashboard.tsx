import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SystemStatus {
  status: string;
  timestamp: string;
  services: {
    mongodb: {
      status: string;
      latency: number;
    };
    slack: {
      status: string;
      lastMessage?: string;
    };
  };
  system: {
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
    };
    platform: string;
    nodeVersion: string;
  };
  config: {
    environment: string;
    port: number;
    corsOrigin: string;
    logLevel: string;
  };
}

export const SystemDashboard: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/health/system', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }

      const data = await response.json();
      setStatus(data);
      setLastChecked(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testSlack = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health/test/slack', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to test Slack connection');
      }

      const data = await response.json();
      if (data.success) {
        alert('Slack test message sent successfully!');
      } else {
        alert('Failed to send Slack test message');
      }
    } catch (err) {
      alert('Error testing Slack connection');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStatus();
      const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-yellow-500" />
        <p className="mt-2 text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading && !status) {
    return (
      <div className="p-4 text-center">
        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
        <p className="mt-2 text-gray-600">Loading system status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <XCircle className="w-8 h-8 mx-auto text-red-500" />
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={fetchStatus}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Dashboard</h1>
        <div className="flex items-center space-x-4">
          {lastChecked && (
            <span className="text-sm text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStatus}
            className="p-2 text-blue-500 hover:text-blue-600"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Services Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Services Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>MongoDB</span>
              {status?.services.mongodb.status === 'ok' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Slack</span>
              {status?.services.slack.status === 'ok' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <button
              onClick={testSlack}
              className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Slack Connection
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">System Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Uptime:</span> {Math.floor(status?.system.uptime || 0)} seconds</p>
            <p><span className="font-medium">Memory Usage:</span> {Math.round((status?.system.memory.heapUsed || 0) / 1024 / 1024)}MB</p>
            <p><span className="font-medium">Platform:</span> {status?.system.platform}</p>
            <p><span className="font-medium">Node Version:</span> {status?.system.nodeVersion}</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Environment:</span> {status?.config.environment}</p>
            <p><span className="font-medium">Port:</span> {status?.config.port}</p>
            <p><span className="font-medium">CORS Origin:</span> {status?.config.corsOrigin}</p>
            <p><span className="font-medium">Log Level:</span> {status?.config.logLevel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 