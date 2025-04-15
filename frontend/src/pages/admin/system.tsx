import React from 'react';
import { SystemDashboard } from '../../components/SystemDashboard';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const SystemStatusPage: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-100">
        <SystemDashboard />
      </div>
    </ProtectedRoute>
  );
};

export default SystemStatusPage; 