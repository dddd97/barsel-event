import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, UserPlus, Edit, Trash2, Search, Filter, Shield, User, Crown } from 'lucide-react';
import api from '../../lib/axios';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  roleDisplayName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminFormData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: string;
}

const AdminManagement = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [formData, setFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    role: 'admin'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Check if current user is super admin
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error('Akses ditolak. Hanya super admin yang dapat mengakses halaman ini.');
      return;
    }
    fetchAdmins();
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/admins');
      setAdmins(response.data);
      setFilteredAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search functionality  
  useEffect(() => {
    let filtered = admins;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(admin => 
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(admin => admin.role === filterRole);
    }

    setFilteredAdmins(filtered);
  }, [admins, searchTerm, filterRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.passwordConfirmation) {
      toast.error('Password dan konfirmasi password tidak cocok');
      return;
    }

    setIsSubmitting(true);

    try {
      const adminData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ...(formData.password && { 
          password: formData.password,
          password_confirmation: formData.passwordConfirmation
        })
      };

      if (editingAdmin) {
        const response = await api.put(`/api/admin/admins/${editingAdmin.id}`, { admin: adminData });
        console.log('Update response:', response.data);
        toast.success('Admin berhasil diperbarui');
      } else {
        const response = await api.post('/api/admin/admins', { admin: adminData });
        console.log('Create response:', response.data);
        toast.success('Admin baru berhasil ditambahkan');
      }
      
      setShowModal(false);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      console.error('Error saving admin:', error);
      console.error('Error response:', error.response?.data);
      let message = 'Gagal menyimpan data admin';
      
      if (error.response?.data?.error) {
        message = error.response.data.error;
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          message += ': ' + error.response.data.details.join(', ');
        }
      }
      
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      passwordConfirmation: '',
      role: admin.role
    });
    setShowModal(true);
  };

  const handleDelete = async (admin: Admin) => {
    if (admin.id === user?.id) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus admin "${admin.name}"?`)) {
      return;
    }

    setDeleteId(admin.id);

    try {
      await api.delete(`/api/admin/admins/${admin.id}`);
      toast.success('Admin berhasil dihapus');
      fetchAdmins();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      const message = error.response?.data?.error || 'Gagal menghapus admin';
      toast.error(message);
    } finally {
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      role: 'admin'
    });
    setEditingAdmin(null);
  };

  const closeModal = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setShowModal(false);
    resetForm();
  };

  // Helper functions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'moderator':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderator':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAdminStats = () => {
    const total = admins.length;
    const superAdmins = admins.filter(admin => admin.role === 'super_admin').length;
    const regularAdmins = admins.filter(admin => admin.role === 'admin').length;
    const moderators = admins.filter(admin => admin.role === 'moderator').length;
    
    return { total, superAdmins, regularAdmins, moderators };
  };

  // Don't render anything if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  const stats = getAdminStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl font-bold mb-2">Kelola Administrator</h1>
            <p className="text-blue-100 text-lg">Kelola akun dan hak akses administrator sistem</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-3 bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <UserPlus size={20} />
            <span>Tambah Admin</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Admin</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Super Admin</p>
              <p className="text-2xl font-bold text-gray-900">{stats.superAdmins}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Admin</p>
              <p className="text-2xl font-bold text-gray-900">{stats.regularAdmins}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Moderator</p>
              <p className="text-2xl font-bold text-gray-900">{stats.moderators}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari admin berdasarkan nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="all">Semua Role</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {filteredAdmins.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada admin ditemukan</h3>
            <p className="text-gray-500">
              {searchTerm || filterRole !== 'all' 
                ? 'Coba ubah filter atau kata kunci pencarian' 
                : 'Belum ada admin yang terdaftar'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Administrator
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role & Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Bergabung
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="relative h-12 w-12 rounded-xl shadow-sm overflow-hidden border-2 border-white">
                              <img 
                                src={admin.avatar ? 
                                  (admin.avatar.startsWith('http') ? admin.avatar : `/uploads/avatars/${admin.avatar}`) :
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=3b82f6&color=ffffff&size=128`
                                } 
                                alt={admin.name} 
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
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hidden">
                                <span className="text-lg font-bold text-white">
                                  {admin.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            {admin.id === user?.id && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {admin.name}
                              </p>
                              {admin.id === user?.id && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(admin.role)}`}>
                            {getRoleIcon(admin.role)}
                            <span>{admin.roleDisplayName}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                            weekday: 'long'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(admin)}
                            className="inline-flex items-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Admin"
                          >
                            <Edit size={16} />
                          </button>
                          {admin.id !== user?.id && (
                            <button
                              onClick={() => handleDelete(admin)}
                              disabled={deleteId === admin.id}
                              className="inline-flex items-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus Admin"
                            >
                              {deleteId === admin.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-100">
                {filteredAdmins.map((admin) => (
                  <div key={admin.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="relative h-12 w-12 rounded-xl shadow-sm overflow-hidden border-2 border-white">
                          <img 
                            src={admin.avatar ? 
                              (admin.avatar.startsWith('http') ? admin.avatar : `/uploads/avatars/${admin.avatar}`) :
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=3b82f6&color=ffffff&size=128`
                            } 
                            alt={admin.name} 
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
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hidden">
                            <span className="text-lg font-bold text-white">
                              {admin.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {admin.id === user?.id && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {admin.name}
                              </h3>
                              {admin.id === user?.id && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEdit(admin)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            {admin.id !== user?.id && (
                              <button
                                onClick={() => handleDelete(admin)}
                                disabled={deleteId === admin.id}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deleteId === admin.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(admin.role)}`}>
                            {getRoleIcon(admin.role)}
                            <span>{admin.roleDisplayName}</span>
                          </span>
                          
                          <span className="text-xs text-gray-500">
                            {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-200 scale-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    {editingAdmin ? <Edit className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {editingAdmin ? 'Edit Administrator' : 'Tambah Administrator Baru'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {editingAdmin ? 'Perbarui informasi administrator' : 'Buat akun administrator baru'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@example.com"
                />
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Role Administrator
                </label>
                <div className="relative">
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="admin">Admin - Kelola event dan peserta</option>
                    <option value="super_admin">Super Admin - Akses penuh sistem</option>
                    <option value="moderator">Moderator - Kelola peserta saja</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                  {editingAdmin && <span className="text-gray-500 font-normal"> (kosongkan jika tidak ingin mengubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingAdmin}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Confirmation Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirmation ? "text" : "password"}
                    required={!editingAdmin || formData.password !== ''}
                    value={formData.passwordConfirmation}
                    onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ulangi password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPasswordConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  <span>
                    {isSubmitting 
                      ? (editingAdmin ? 'Memperbarui...' : 'Menambahkan...') 
                      : (editingAdmin ? 'Perbarui Admin' : 'Tambah Admin')
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;