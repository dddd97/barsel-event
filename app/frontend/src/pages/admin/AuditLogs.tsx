import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

interface AuditLog {
  id: number;
  admin_name: string;
  admin_email: string;
  action: string;
  action_display_name: string;
  resource_type: string;
  resource_type_display_name: string;
  resource_display_name: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

interface Filters {
  actions: string[];
  resourceTypes: string[];
  admins: Array<{ id: number; name: string; email: string }>;
}

interface Stats {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  mostActiveAdmin: Array<{ name: string; activityCount: number }>;
  mostCommonActions: Array<{ action: string; count: number }>;
  recentLogins: Array<{ adminName: string; ipAddress: string; createdAt: string }>;
}

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    perPage: 25
  });
  const [filters, setFilters] = useState<Filters>({
    actions: [],
    resourceTypes: [],
    admins: []
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState({
    adminId: '',
    actionFilter: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [showStats, setShowStats] = useState(false);

  // Check permissions - only super_admin and admin can view audit logs
  const canViewAuditLogs = user?.role === 'super_admin' || user?.role === 'admin';
  
  if (!canViewAuditLogs) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-red-800">
            Akses Ditolak
          </h3>
          <p className="mt-2 text-sm text-red-700">
            Anda tidak memiliki izin untuk melihat audit logs. Hanya Super Admin dan Admin yang dapat mengakses fitur ini.
          </p>
        </div>
      </AdminLayout>
    );
  }

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      // Temporary: Use dashboard stats endpoint until audit logs are implemented
      // Try to get more activities by adding limit parameter
      const response = await api.get('/api/dashboard/stats?limit=100');
      
      if (response.data.recentActivities) {
        // Map dashboard activities to audit log format
        const mappedActivities = response.data.recentActivities.map((activity: any, index: number) => {
          // Extract better information from activity data
          const getResourceInfo = (activity: any) => {
            if (activity.actionDisplayName?.includes('Admin')) {
              return {
                type: 'admin',
                type_display: 'Administrator',
                display_name: activity.resourceDisplayName || activity.adminName || 'Admin'
              };
            } else if (activity.actionDisplayName?.includes('Event')) {
              return {
                type: 'event',
                type_display: 'Event',
                display_name: activity.resourceDisplayName || 'Event'
              };
            } else if (activity.actionDisplayName?.includes('Login') || activity.actionDisplayName?.includes('Logout')) {
              return {
                type: 'auth',
                type_display: 'Authentication',
                display_name: 'System Login'
              };
            } else {
              return {
                type: 'system',
                type_display: 'System',
                display_name: activity.resourceDisplayName || 'System Resource'
              };
            }
          };

          const resourceInfo = getResourceInfo(activity);
          
          return {
            id: activity.id || index,
            admin_name: activity.adminName || 'Unknown Admin',
            admin_email: activity.adminEmail || activity.email || 'Email tidak tersedia',
            action: activity.action || 'unknown',
            action_display_name: activity.actionDisplayName || activity.action || 'Unknown Action',
            resource_type: resourceInfo.type,
            resource_type_display_name: resourceInfo.type_display,
            resource_display_name: resourceInfo.display_name,
            details: activity.details || (activity.actionDisplayName?.includes('Login') || activity.actionDisplayName?.includes('Logout') ? '' : `Aksi ${activity.actionDisplayName || 'tidak diketahui'} dilakukan oleh ${activity.adminName || 'admin'}`),
            ip_address: activity.ipAddress || 'IP tidak tersedia',
            user_agent: activity.userAgent || 'User agent tidak tersedia',
            created_at: activity.createdAt || new Date().toISOString()
          };
        });
        
        setAuditLogs(mappedActivities);
        
        // Store all activities for filtering
        const allActivities = mappedActivities;
        
        // Apply filters to get filtered activities
        const filteredActivities = allActivities.filter((log: any) => {
          // Apply admin filter
          if (currentFilters.adminId && log.admin_name !== currentFilters.adminId) {
            return false;
          }
          
          // Apply action filter  
          if (currentFilters.actionFilter && log.action_display_name !== currentFilters.actionFilter) {
            return false;
          }
          
          // Apply resource type filter
          if (currentFilters.resourceType && log.resource_type_display_name !== currentFilters.resourceType) {
            return false;
          }
          
          // Apply date filters
          if (currentFilters.startDate || currentFilters.endDate) {
            const logDate = new Date(log.created_at);
            const startDate = currentFilters.startDate ? new Date(currentFilters.startDate) : null;
            const endDate = currentFilters.endDate ? new Date(currentFilters.endDate) : null;
            
            if (startDate && logDate < startDate) return false;
            if (endDate && logDate > endDate) return false;
          }
          
          return true;
        });
        
        // Set pagination with filtered data
        const perPage = 25;
        const totalPages = Math.ceil(filteredActivities.length / perPage);
        setPagination({
          currentPage: currentFilters.page,
          totalPages: totalPages,
          totalCount: filteredActivities.length,
          perPage: perPage
        });
        
        // Extract unique filter options from the activities
        const uniqueActions = [...new Set(mappedActivities.map((activity: any) => activity.action_display_name).filter(Boolean))];
        const uniqueResourceTypes = [...new Set(mappedActivities.map((activity: any) => activity.resource_type_display_name).filter(Boolean))];
        const uniqueAdmins = [...new Set(mappedActivities.map((activity: any) => ({
          id: activity.id,
          name: activity.admin_name,
          email: activity.admin_email
        })).filter((admin: any) => admin.name))];
        
        // Remove duplicates by name
        const uniqueAdminsByName = uniqueAdmins.filter((admin: any, index: number, self: any[]) => 
          index === self.findIndex((a: any) => a.name === admin.name)
        );
        
        setFilters({
          actions: uniqueActions as string[],
          resourceTypes: uniqueResourceTypes as string[],
          admins: uniqueAdminsByName as { id: number; name: string; email: string; }[]
        });
      } else {
        setAuditLogs([]);
      }
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      
      let errorMessage = 'Gagal memuat audit logs';
      if (error.response) {
        switch (error.response.status) {
          case 403:
            errorMessage = 'Tidak memiliki akses untuk melihat audit logs';
            break;
          case 404:
            errorMessage = 'Endpoint audit logs tidak ditemukan';
            break;
          case 500:
            errorMessage = 'Terjadi kesalahan pada server';
            break;
          default:
            errorMessage = error.response?.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Tidak dapat terhubung ke server';
      }
      
      toast.error(errorMessage);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Temporary: Stats are included in dashboard endpoint response
      const response = await api.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      
      let errorMessage = 'Gagal memuat statistik';
      if (error.response?.status === 404) {
        errorMessage = 'Statistik audit log tidak tersedia';
      } else if (error.response?.status === 403) {
        errorMessage = 'Tidak memiliki akses untuk melihat statistik';
      }
      
      // Don't show error toast for stats as it's not critical
      console.warn(errorMessage);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchStats();
  }, [currentFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setCurrentFilters({
      adminId: '',
      actionFilter: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      page: 1
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Tanggal tidak tersedia';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is invalid
      if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
      }
      
      // Format date with Indonesian locale and timezone
      return date.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString);
      return 'Tanggal tidak valid';
    }
  };

  const getActionBadgeColor = (action: string, actionDisplayName?: string) => {
    // Check display name for better categorization
    const displayName = actionDisplayName?.toLowerCase() || action?.toLowerCase() || '';
    
    if (displayName.includes('login')) {
      return 'bg-green-100 text-green-800';
    } else if (displayName.includes('logout')) {
      return 'bg-gray-100 text-gray-800';
    } else if (displayName.includes('update') || displayName.includes('edit')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (displayName.includes('delete') || displayName.includes('hapus')) {
      return 'bg-red-100 text-red-800';
    } else if (displayName.includes('create') || displayName.includes('tambah')) {
      return 'bg-blue-100 text-blue-800';
    } else if (displayName.includes('draw') || displayName.includes('prize')) {
      return 'bg-purple-100 text-purple-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track dan monitor semua aktivitas admin di sistem
        </p>
      </div>

      {/* Statistics Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowStats(!showStats)}
          className="mb-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          {showStats ? 'Sembunyikan' : 'Tampilkan'} Statistik
        </button>

        {showStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{stats.totalLogs}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Logs</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalLogs}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{stats.logsToday}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Hari Ini</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.logsToday}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{stats.logsThisWeek}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Minggu Ini</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.logsThisWeek}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Admin</label>
            <select
              value={currentFilters.adminId}
              onChange={(e) => handleFilterChange('adminId', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua Admin</option>
              {filters.admins.map(admin => (
                <option key={admin.name} value={admin.name}>
                  {admin.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Aksi</label>
            <select
              value={currentFilters.actionFilter}
              onChange={(e) => handleFilterChange('actionFilter', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua Aksi</option>
              {filters.actions.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipe Resource</label>
            <select
              value={currentFilters.resourceType}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua Tipe</option>
              {filters.resourceTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
            <input
              type="date"
              value={currentFilters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tanggal Akhir</label>
            <input
              type="date"
              value={currentFilters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <li key={i} className="px-6 py-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="flex items-center space-x-4">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : auditLogs.length === 0 ? (
            <li className="px-6 py-4 text-center">
              <p className="text-sm text-gray-500">Tidak ada audit logs ditemukan</p>
            </li>
          ) : (
            auditLogs
              .filter(log => {
                if (!log || !log.id) return false;
                
                // Apply admin filter
                if (currentFilters.adminId && log.admin_name !== currentFilters.adminId) {
                  return false;
                }
                
                // Apply action filter  
                if (currentFilters.actionFilter && log.action_display_name !== currentFilters.actionFilter) {
                  return false;
                }
                
                // Apply resource type filter
                if (currentFilters.resourceType && log.resource_type_display_name !== currentFilters.resourceType) {
                  return false;
                }
                
                // Apply date filters
                if (currentFilters.startDate || currentFilters.endDate) {
                  const logDate = new Date(log.created_at);
                  const startDate = currentFilters.startDate ? new Date(currentFilters.startDate) : null;
                  const endDate = currentFilters.endDate ? new Date(currentFilters.endDate) : null;
                  
                  if (startDate && logDate < startDate) return false;
                  if (endDate && logDate > endDate) return false;
                }
                
                return true;
              })
              .slice((currentFilters.page - 1) * pagination.perPage, currentFilters.page * pagination.perPage)
              .map((log) => (
              <li key={log.id}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action || '', log.action_display_name)}`}>
                        {log.action_display_name || log.action || 'Aksi Tidak Diketahui'}
                      </span>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {log.admin_name || 'Admin Tidak Diketahui'}
                        </p>
                        {log.admin_email && log.admin_email !== 'Email tidak tersedia' && (
                          <p className="text-sm text-gray-500">
                            {log.admin_email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {log.ip_address || 'IP tidak tersedia'}
                      </p>
                    </div>
                  </div>
                  
                  {log.resource_display_name && log.resource_display_name !== 'System Login' && log.resource_type !== 'auth' && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{log.resource_type_display_name}:</span> {log.resource_display_name}
                      </p>
                    </div>
                  )}
                  
                  {log.details && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">{log.details}</p>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * pagination.perPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.perPage, pagination.totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.currentPage
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs; 