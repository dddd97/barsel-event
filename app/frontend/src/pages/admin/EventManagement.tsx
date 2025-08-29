import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import { BannerUploadGuide } from '../../components/BannerUploadGuide';
import type { Event } from '../../types/event';
import api from '../../lib/axios';

const EventManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBannerGuide, setShowBannerGuide] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  // Hapus ticket_price dari formData state
  type FormDataType = {
    name: string;
    event_date: string;
    start_time: string;
    location: string;
    description: string;
    max_participants: number;
    category: 'utama' | 'reguler';
    registration_start: string;
    registration_end: string;
    contact_person1_name: string;
    contact_person1_phone: string;
    contact_person2_name: string;
    contact_person2_phone: string;
  };
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    event_date: '',
    start_time: '',
    location: '',
    description: '',
    max_participants: 0,
    category: 'reguler',
    registration_start: '',
    registration_end: '',
    contact_person1_name: '',
    contact_person1_phone: '',
    contact_person2_name: '',
    contact_person2_phone: '',
  });
  // Tambahkan loading state
  type LoadingType = 'fetch' | 'submit' | null;
  const [loading, setLoading] = useState<LoadingType>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(25); // default per page

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, [currentPage]);

  // Handle edit parameter from URL
  useEffect(() => {
    const editEventId = searchParams.get('edit');
    if (editEventId && events.length > 0) {
      const eventToEdit = events.find(event => event.id.toString() === editEventId);
      if (eventToEdit) {
        handleEdit(eventToEdit);
        // Remove edit parameter from URL after opening modal
        setSearchParams(params => {
          params.delete('edit');
          return params;
        });
      }
    }
  }, [events, searchParams, setSearchParams]);

  const fetchEvents = async () => {
    setLoading('fetch');
    try {
      // Use admin endpoint for proper authentication and data access
      const response = await api.get('/api/admin/events', {
        params: { page: currentPage, per_page: perPage },
        withCredentials: true
      });
      
      // Handle array response format from admin endpoint
      if (Array.isArray(response.data)) {
        console.log('Events received from backend:', response.data);
        setEvents(response.data);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        // Handle paginated response format if available
        console.log('Events received from backend (paginated):', response.data);
        setEvents(response.data.events || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.total_pages || 1);
          setCurrentPage(response.data.pagination.current_page || 1);
        } else {
          setTotalPages(1);
          setCurrentPage(1);
        }
      }
    } catch (error: unknown) {
      handleApiError(error);
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(null);
    }
  };

  const handleApiError = (error: any) => {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object'
    ) {
      const response = error.response as { status?: number; data?: { error?: string } };
      if (response.status === 401) {
        toast.error('Sesi login telah berakhir. Silakan login kembali.');
        window.location.href = '/login';
      } else if (response.status === 403) {
        toast.error('Anda tidak memiliki akses ke halaman ini');
      } else if (response.status === 500) {
        toast.error('Terjadi kesalahan pada server: ' + (response.data?.error || 'Unknown error'));
        console.error('Server error:', response.data);
      } else {
        toast.error('Gagal mengambil data: ' + (response.data?.error || 'Unknown error'));
      }
    } else if (error && typeof error === 'object' && 'request' in error) {
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } else {
      toast.error('Terjadi kesalahan dalam aplikasi');
    }
    console.error('API Error:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validasi form
    if (!formData.name || !formData.event_date || !formData.location || !formData.description || !formData.registration_start || !formData.registration_end || !formData.contact_person1_name || !formData.contact_person1_phone) {
      toast.error('Semua field wajib diisi');
      return;
    }
    if (formData.max_participants < 0 || formData.max_participants > 9999) {
      toast.error('Maksimal peserta harus antara 0-9999 (sesuai kapasitas slot machine)');
      return;
    }
    if (formData.registration_start > formData.registration_end) {
      toast.error('Waktu pendaftaran dibuka harus sebelum waktu ditutup');
      return;
    }
    // Validasi format jam mulai
    if (formData.start_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.start_time)) {
      toast.error('Format Jam Mulai tidak valid. Gunakan format HH:MM (contoh: 14:30)');
      return;
    }
    if (bannerFile) {
      if (bannerFile.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }
      if (!bannerFile.type.startsWith('image/')) {
        toast.error('File harus berupa gambar');
        return;
      }
    }
    setLoading('submit');
    try {
      const dataToSend = new FormData();
      console.log('Form data to send:', formData);
      Object.entries(formData).forEach(([key, value]) => {
        console.log(`Appending ${key}:`, value);
        dataToSend.append(key, value == null ? '' : String(value));
      });
      if (bannerFile) {
        dataToSend.append('banner', bannerFile);
      }
      if (selectedEvent) {
        await api.put(`/api/admin/events/${selectedEvent.id}`, dataToSend, { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true });
        toast.success('Event berhasil diperbarui');
      } else {
        await api.post('/api/admin/events', dataToSend, { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true });
        toast.success('Event berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchEvents();
      resetForm();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (eventId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus event ini?')) {
      setLoading('submit');
      try {
        await api.delete(`/api/admin/events/${eventId}`, { withCredentials: true });
        toast.success('Event berhasil dihapus');
        fetchEvents();
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(null);
      }
    }
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    
    // Format start_time for HTML time input
    const formatTimeForInput = (timeStr: string) => {
      if (!timeStr) return '';
      try {
        let time;
        if (timeStr.includes('T')) {
          // Full datetime format
          time = new Date(timeStr);
        } else {
          // Time only format (HH:mm:ss)
          time = new Date(`2000-01-01T${timeStr}`);
        }
        
        if (isNaN(time.getTime())) return '';
        
        // Format as HH:mm for HTML time input
        return time.toTimeString().slice(0, 5);
      } catch (e) {
        return '';
      }
    };
    
    // Format event_date for date input (just the date part)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        // Extract just the date part (YYYY-MM-DD)
        if (dateStr.includes('T')) {
          return dateStr.split('T')[0];
        } else {
          // Already in date format
          return dateStr;
        }
      } catch (e) {
        return '';
      }
    };

    setFormData({
      name: event.name,
      event_date: formatDateForInput(event.eventDate),
      start_time: formatTimeForInput(event.startTime || event.start_time || ''),
      location: event.location,
      description: event.description,
      max_participants: event.maxParticipants,
      category: event.category || 'reguler',
      registration_start: event.registrationStart ? event.registrationStart.slice(0, 16) : '',
      registration_end: event.registrationEnd ? event.registrationEnd.slice(0, 16) : '',
      contact_person1_name: event.contactPerson1Name || '',
      contact_person1_phone: event.contactPerson1Phone || '',
      contact_person2_name: event.contactPerson2Name || '',
      contact_person2_phone: event.contactPerson2Phone || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setSelectedEvent(null);
    setFormData({
      name: '',
      event_date: '',
      start_time: '',
      location: '',
      description: '',
      max_participants: 0,
      category: 'reguler',
      registration_start: '',
      registration_end: '',
      contact_person1_name: '',
      contact_person1_phone: '',
      contact_person2_name: '',
      contact_person2_phone: '',
    });
    setBannerFile(null);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manajemen Event</h1>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tambah Event
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Nama Event</th>
                <th className="px-4 py-2 border">Tanggal</th>
                <th className="px-4 py-2 border">Jam</th>
                <th className="px-4 py-2 border">Lokasi</th>
                <th className="px-4 py-2 border">Max Peserta</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Kategori</th>
                <th className="px-4 py-2 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading === 'fetch' ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-2 border">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">Tidak ada event</td></tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-2 border">{event.name}</td>
                    <td className="px-4 py-2 border">{event.eventDate}</td>
                    <td className="px-4 py-2 border">{event.startTime || event.start_time || '-'}</td>
                    <td className="px-4 py-2 border">{event.location}</td>
                    <td className="px-4 py-2 border">{event.maxParticipants}</td>
                    <td className="px-4 py-2 border">
                      <span className={`inline-block px-2 py-1 rounded text-sm ${
                        event.registrationStatus === 'Pendaftaran dibuka'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.registrationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">
                      <span className={`inline-block px-2 py-1 rounded text-sm ${
                        event.category === 'utama'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.category}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="flex flex-wrap gap-1">
                        <Link
                          to={`/admin/events/${event.id}`}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 inline-block"
                        >
                          📋 Detail
                        </Link>
                        <button
                          onClick={() => handleEdit(event)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <Link
                          to={`/admin/events/${event.id}/prize-drawing`}
                          className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 inline-block"
                        >
                          🎰 Undian
                        </Link>
                        <Link
                          to={`/admin/events/${event.id}/participants`}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 inline-block"
                        >
                          👥 Peserta
                        </Link>
                        <Link
                          to={`/admin/events/${event.id}/prizes`}
                          className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 inline-block"
                        >
                          🎁 Hadiah
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-l bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                &laquo; Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border-t border-b border-gray-300 ${
                    currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-r bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next &raquo;
              </button>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            {/* Responsive Modal Container */}
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header - Fixed */}
              <div className="flex items-center justify-between p-6 border-b bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedEvent ? '✏️ Edit Event' : '➕ Tambah Event Baru'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedEvent(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      📋 Informasi Dasar
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Event <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Masukkan nama event"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tanggal Event <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.event_date.split('T')[0] || formData.event_date}
                          onChange={(e) => {
                            // Keep only the date part for date input
                            const dateValue = e.target.value;
                            console.log('Date changed:', dateValue);
                            setFormData({ ...formData, event_date: dateValue });
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Gunakan field "Jam Mulai" untuk menentukan waktu mulai event
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jam Mulai (WIB)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.start_time}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow valid time format characters and prevent invalid patterns
                              if (value === '') {
                                setFormData({ ...formData, start_time: value });
                                return;
                              }
                              
                              // Only allow numbers and colon
                              if (!/^[0-9:]*$/.test(value)) {
                                return;
                              }
                              
                              // Prevent patterns that don't match time format
                              // Allow: "1", "12", "12:", "12:3", "12:30" but reject "1500", "123:", etc.
                              if (value.length > 5) {
                                return;
                              }
                              
                              // Check for valid partial patterns
                              if (/^([01]?[0-9]|2[0-3])?(:([0-5]?[0-9]?)?)?$/.test(value)) {
                                // Additional check: if there are 4+ consecutive digits, reject it
                                if (/\d{4,}/.test(value)) {
                                  return;
                                }
                                console.log('Start time changed:', value);
                                setFormData({ ...formData, start_time: value });
                              }
                            }}
                            onBlur={(e) => {
                              // Auto-format on blur if valid partial time
                              const value = e.target.value;
                              if (value && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                                // Format to ensure leading zeros
                                const [hours, minutes] = value.split(':');
                                const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                                setFormData({ ...formData, start_time: formattedTime });
                              }
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="14:30"
                            maxLength={5}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-sm text-gray-400">HH:MM</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Format 24 jam (00:00 - 23:59). Contoh: 14:30 untuk jam 2:30 siang. Ketik langsung dalam format HH:MM.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lokasi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({ ...formData, location: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Masukkan lokasi event"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kategori <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({ ...formData, category: e.target.value as 'utama' | 'reguler' })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="reguler">Reguler</option>
                          <option value="utama">Utama</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi Event
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Deskripsikan event ini..."
                      />
                    </div>
                  </div>

                  {/* Registration Settings Section */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                      👥 Pengaturan Pendaftaran
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maksimal Peserta
                        </label>
                        <input
                          type="number"
                          value={formData.max_participants}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            // Limit to maximum 9999 participants
                            const limitedValue = Math.min(9999, Math.max(0, value));
                            setFormData({ ...formData, max_participants: limitedValue });
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0 = tidak terbatas"
                          min="0"
                          max="9999"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Maksimal 9999 peserta (sesuai kapasitas slot machine). Kosongkan atau isi 0 untuk peserta tidak terbatas.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Waktu Mulai Pendaftaran
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.registration_start}
                          onChange={(e) =>
                            setFormData({ ...formData, registration_start: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Waktu Berakhir Pendaftaran
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.registration_end}
                          onChange={(e) =>
                            setFormData({ ...formData, registration_end: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      📞 Informasi Kontak
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Contact Person 1
                        </label>
                        <input
                          type="text"
                          value={formData.contact_person1_name}
                          onChange={(e) =>
                            setFormData({ ...formData, contact_person1_name: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Nama lengkap"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          No. HP Contact Person 1
                        </label>
                        <input
                          type="tel"
                          value={formData.contact_person1_phone}
                          onChange={(e) =>
                            setFormData({ ...formData, contact_person1_phone: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Contact Person 2
                        </label>
                        <input
                          type="text"
                          value={formData.contact_person2_name}
                          onChange={(e) =>
                            setFormData({ ...formData, contact_person2_name: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Nama lengkap (opsional)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          No. HP Contact Person 2
                        </label>
                        <input
                          type="tel"
                          value={formData.contact_person2_phone}
                          onChange={(e) =>
                            setFormData({ ...formData, contact_person2_phone: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="08xxxxxxxxxx (opsional)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banner Upload Section */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                      🖼️ Banner Event
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Rekomendasi: 1920x640px, maksimal 2MB, format JPG/PNG
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBannerGuide(!showBannerGuide)}
                        className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                      >
                        {showBannerGuide ? '🔽 Sembunyikan' : '💡 Lihat panduan upload banner'}
                      </button>
                      {showBannerGuide && (
                        <div className="mt-2">
                          <BannerUploadGuide />
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedEvent(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                >
                  ❌ Batal
                </button>
                <button
                  type="submit"
                  disabled={loading === 'submit'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading === 'submit' ? (
                    <>⏳ Menyimpan...</>
                  ) : selectedEvent ? (
                    <>💾 Update Event</>) : (
                    <>➕ Buat Event</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EventManagement; 