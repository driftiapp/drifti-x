import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Link from 'next/link';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Driftix</h1>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-700">Welcome, {user?.email}</span>
                    <button
                      onClick={() => logout()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
              
              {user?.role === 'admin' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Tools</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Link
                      href="/admin/users"
                      className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      <h4 className="text-lg font-medium text-gray-900">User Management</h4>
                      <p className="mt-1 text-sm text-gray-500">Manage user accounts and permissions</p>
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      <h4 className="text-lg font-medium text-gray-900">System Settings</h4>
                      <p className="mt-1 text-sm text-gray-500">Configure application settings</p>
                    </Link>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Link
                    href="/profile"
                    className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-medium text-gray-900">My Profile</h4>
                    <p className="mt-1 text-sm text-gray-500">View and edit your profile information</p>
                  </Link>
                  <Link
                    href="/settings"
                    className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-medium text-gray-900">Account Settings</h4>
                    <p className="mt-1 text-sm text-gray-500">Manage your account preferences</p>
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h3>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    <li className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">Last login</p>
                        <p className="text-sm text-gray-500">Just now</p>
                      </div>
                    </li>
                    <li className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">Account created</p>
                        <p className="text-sm text-gray-500">2 days ago</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 