import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/axios';

interface DashboardStats {
  events: {
    total: number;
    active: number;
    participantsToday: number;
  };
  participants: {
    total: number;
    today: number;
    thisWeek: number;
  };
  prizes: {
    total: number;
    drawn: number;
    remaining: number;
  };
  recentActivities: Array<{
    id: number;
    adminName: string;
    actionDisplayName: string;
    resourceDisplayName: string;
    createdAt: string;
    ipAddress: string;
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: realTimeData, isConnected, lastUpdated, error } = useRealTimeUpdates();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-28"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>

          {/* Charts and Activity Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Chart Skeleton */}
            <div className="bg-white rounded-lg shadow p-6 border">
              <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="bg-white rounded-lg shadow p-6 border">
              <div className="h-6 bg-gray-200 rounded w-36 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="mt-8 bg-white rounded-lg shadow p-6 border">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
              </h1>
              <div className="mt-2 flex items-center space-x-3">
                {/* Admin Profile Photo */}
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10 rounded-full shadow-lg overflow-hidden border-2 border-white">
                    {/* Try to show actual photo first, then avatar, then fallback */}
                    <img 
                      src={user?.avatar ? 
                        (user.avatar.startsWith('http') ? user.avatar : `/uploads/avatars/${user.avatar}`) :
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=3b82f6&color=ffffff&size=128`
                      } 
                      alt={user?.name || 'Admin'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <div 
                      className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center hidden"
                    >
                      <span className="text-white font-bold text-lg">
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Selamat datang, <span className="font-medium text-gray-900">{user?.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      {user?.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Actions */}
            <div className="flex items-center space-x-3">
              <Link 
                to="/admin/profile"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit Profile
              </Link>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-end">
            {/* Real-time connection status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Real-time connected' : 'Disconnected'}
              </span>
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}
      </div>

      {/* System Alerts */}
      {realTimeData?.systemAlerts && realTimeData.systemAlerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">System Alerts</h2>
          <div className="space-y-2">
            {realTimeData.systemAlerts.map((alert, index) => (
              <div 
                key={index}
                className={`p-3 border rounded-md ${getAlertBadgeColor(alert.type)}`}
              >
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.action === 'view_audit_logs' && true && ( // hasPermission('canViewAuditLogs')
                  <Link 
                    to="/admin/audit-logs"
                    className="mt-2 inline-block text-xs underline"
                  >
                    View Audit Logs
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Events Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Events</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {realTimeData ? realTimeData.eventsCount : stats?.events.total || 0}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {realTimeData ? realTimeData.activeEvents : stats?.events.active || 0} active
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Participants Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Participants</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {realTimeData ? realTimeData.participantsCount : stats?.participants.total || 0}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {stats?.participants.today || 0} today
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Prizes Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Prizes</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.prizes.total || 0}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {stats?.prizes.remaining || 0} remaining
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Registrations
            </h3>
            {realTimeData?.recentRegistrations && realTimeData.recentRegistrations.length > 0 ? (
              <div className="space-y-3">
                {realTimeData.recentRegistrations.map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{registration.name}</p>
                      <p className="text-xs text-gray-500">{registration.eventName}</p>
                      <p className="text-xs text-gray-400">#{registration.registrationNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(registration.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent registrations</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activities
              </h3>
              {true && ( // hasPermission('canViewAuditLogs')
                <Link 
                  to="/admin/audit-logs"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View All
                </Link>
              )}
            </div>
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.adminName}</p>
                      <p className="text-xs text-gray-600">{activity.actionDisplayName}</p>
                      {activity.resourceDisplayName && (
                        <p className="text-xs text-gray-500">{activity.resourceDisplayName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.createdAt)}
                      </p>
                      <p className="text-xs text-gray-400">{activity.ipAddress}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activities</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {true && ( // hasPermission('canManageEvents')
            <Link
              to="/admin/events"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Manage Events
            </Link>
          )}
          
                      {true && ( // hasPermission('canManageParticipants')
            <Link
              to="/admin/participants"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Manage Participants
            </Link>
          )}
          
                      {true && ( // hasPermission('canManagePrizes')
            <Link
              to="/admin/prizes"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              Manage Prizes
            </Link>
          )}
          
                      {true && ( // hasPermission('canDrawPrizes')
            <Link
              to="/admin/draw"
              className="relative inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl overflow-hidden group"
            >
              {/* Animated background overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              {/* Sparkle effect */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute top-3 right-2 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-2 left-3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
              </div>
              
              {/* Trophy icon */}
              <svg className="w-5 h-5 mr-2 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 9V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM3 9a6 6 0 0 0 6 6h2v3h1a1 1 0 0 1 1 1v1h-8v-1a1 1 0 0 1 1-1h1v-3H5a6 6 0 0 1-6-6V8a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1zm18 0V8a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a6 6 0 0 1-6 6h-2v3h1a1 1 0 0 1 1 1v1h-8v-1a1 1 0 0 1 1-1h1v-3h2a6 6 0 0 0 6-6z"/>
              </svg>
              
              <span className="relative z-10">🎁 Prize Drawing</span>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000"></div>
            </Link>
          )}
          
                      {true && ( // hasPermission('canViewAuditLogs')
            <Link
              to="/admin/audit-logs"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
            >
              View Audit Logs
            </Link>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard; 