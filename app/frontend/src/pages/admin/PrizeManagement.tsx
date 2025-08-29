import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/axios';

interface Prize {
  id: number;
  name: string;
  description: string;
  quantity: number;
  category: 'utama' | 'reguler';
  eventId: number;
  winningsCount: number;
  imageUrl?: string;
  gambar_url?: string;
}

interface Event {
  id: number;
  name: string;
}

const PrizeManagement: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prizeImageFile, setPrizeImageFile] = useState<File | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage] = useState(10); // 10 prizes per page
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    category: 'reguler' as 'utama' | 'reguler',
    event_id: '',
  });

  // Memoize fetchEvents to prevent useEffect dependency warning
  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/events');
      setEvents(response.data);

      // Jika tidak ada eventId dari parameter URL dan ada events, pilih event pertama
      if (!eventId && response.data.length > 0) {
        setSelectedEvent(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Gagal memuat daftar event');
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      fetchPrizes(selectedEvent);
    }
  }, [selectedEvent, currentPage, searchTerm, categoryFilter]);

  const fetchPrizes = async (eventId: number) => {
    setIsLoading(true);
    try {
      // Gunakan endpoint admin yang benar dengan pagination dan search
      const response = await api.get(`/api/admin/events/${eventId}/prizes`, {
        params: { 
          page: currentPage, 
          per_page: perPage, 
          search: searchTerm,
          category: categoryFilter !== 'all' ? categoryFilter : undefined
        }
      });
      
      // Handle different response formats
      const prizesData = response.data.prizes || response.data;
      setPrizes(Array.isArray(prizesData) ? prizesData : []);
      
      // Handle pagination
      if (response.data.pagination) {
        const totalPages = response.data.pagination.total_pages || response.data.pagination.totalPages || 1;
        const currentPageFromAPI = response.data.pagination.current_page || response.data.pagination.currentPage || 1;
        const totalCount = response.data.pagination.total_count || response.data.pagination.totalCount || 0;
        
        console.log('Setting pagination:', { totalPages, currentPage: currentPageFromAPI, totalCount });
        
        setTotalPages(totalPages);
        setCurrentPage(currentPageFromAPI);
        setTotalCount(totalCount);
      } else {
        // Fallback pagination logic
        const prizeCount = Array.isArray(prizesData) ? prizesData.length : 0;
        if (prizeCount >= perPage) {
          setTotalPages(Math.max(2, Math.ceil(prizeCount / perPage) + 1)); 
          setTotalCount(prizeCount); 
        } else {
          setTotalPages(1);
          setTotalCount(prizeCount);
        }
        setCurrentPage(currentPage);
      }
    } catch (error) {
      console.error('Error fetching prizes:', error);
      toast.error('Gagal memuat data hadiah');
      setPrizes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent && !formData.event_id) {
      toast.error('Pilih event terlebih dahulu');
      return;
    }

    // Validate image file if provided
    if (prizeImageFile) {
      if (prizeImageFile.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file gambar maksimal 2MB');
        return;
      }
      if (!prizeImageFile.type.startsWith('image/')) {
        toast.error('File harus berupa gambar (PNG, JPG, JPEG, WebP)');
        return;
      }
    }

    const eventIdForSubmit = formData.event_id || String(selectedEvent);

    try {
      // Prepare form data for file upload
      const dataToSend = new FormData();
      
      // Add prize data fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          dataToSend.append(`prize[${key}]`, String(value));
        }
      });
      
      dataToSend.append('prize[event_id]', eventIdForSubmit);
      
      // Add image file if provided
      if (prizeImageFile) {
        dataToSend.append('prize[image]', prizeImageFile);
      }

      if (selectedPrize) {
        // Update prize
        await api.put(`/api/admin/events/${eventIdForSubmit}/prizes/${selectedPrize.id}`, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Hadiah berhasil diperbarui');
      } else {
        // Create new prize
        await api.post(`/api/admin/events/${eventIdForSubmit}/prizes`, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Hadiah berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchPrizes(Number(eventIdForSubmit));
      resetForm();
    } catch (error) {
      console.error('Error saving prize:', error);
      toast.error('Gagal menyimpan hadiah');
    }
  };

  const handleEdit = (prize: Prize) => {
    setSelectedPrize(prize);
    setFormData({
      name: prize.name,
      description: prize.description || '',
      quantity: prize.quantity,
      category: prize.category || 'reguler',
      event_id: String(prize.eventId),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (prizeId: number, eventId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus hadiah ini?')) {
      try {
        // Gunakan endpoint admin yang benar
        await api.delete(`/api/admin/events/${eventId}/prizes/${prizeId}`);
        toast.success('Hadiah berhasil dihapus');
        fetchPrizes(eventId);
      } catch (error) {
        console.error('Error deleting prize:', error);
        toast.error('Gagal menghapus hadiah');
      }
    }
  };

  // Helper function to fetch ALL prizes and generate CSV
  const generateCSVFromAllPrizes = async () => {
    if (!selectedEvent) return '';
    
    try {
      // Fetch ALL prizes without pagination
      const response = await api.get(`/api/admin/events/${selectedEvent}/prizes`, {
        params: { 
          page: 1, 
          per_page: 10000, // Large number to get all prizes
          search: '', // No search filter for export
          category: undefined // No category filter for export
        }
      });
      
      const allPrizes = response.data.prizes || response.data || [];
      console.log(`✅ Successfully fetched ${allPrizes.length} prizes for export`);
      
      const headers = ['Nama Hadiah', 'Deskripsi', 'Kategori', 'Jumlah Total', 'Telah Diundi', 'Sisa'];
      const csvRows = [headers.join(',')];
      
      allPrizes.forEach((prize: Prize) => {
        const remaining = prize.quantity - (prize.winningsCount || 0);
        const row = [
          `"${prize.name || ''}"`,
          `"${prize.description || ''}"`,
          `"${prize.category || ''}"`,
          `"${prize.quantity || 0}"`,
          `"${prize.winningsCount || 0}"`,
          `"${remaining}"`
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    } catch (error) {
      console.error('Error fetching all prizes for export:', error);
      // Fallback to current page data if API fails
      const headers = ['Nama Hadiah', 'Deskripsi', 'Kategori', 'Jumlah Total', 'Telah Diundi', 'Sisa'];
      const csvRows = [headers.join(',')];
      
      prizes.forEach((prize: Prize) => {
        const remaining = prize.quantity - (prize.winningsCount || 0);
        const row = [
          `"${prize.name || ''}"`,
          `"${prize.description || ''}"`,
          `"${prize.category || ''}"`,
          `"${prize.quantity || 0}"`,
          `"${prize.winningsCount || 0}"`,
          `"${remaining}"`
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  };

  const handleExport = async () => {
    if (!selectedEvent) return;
    setIsExporting(true);
    
    try {
      console.log('Starting prizes export process...');
      
      const csvContent = await generateCSVFromAllPrizes();
      
      if (!csvContent || csvContent.trim() === '') {
        toast.error('Tidak ada data hadiah untuk diekspor');
        return;
      }
      
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      if (blob.size === 0) {
        toast.error('File CSV kosong - tidak ada data untuk diekspor');
        return;
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get event name for better filename
      const selectedEventData = events.find(e => e.id === selectedEvent);
      const eventName = selectedEventData ? selectedEventData.name.replace(/[^a-zA-Z0-9]/g, '-') : selectedEvent;
      const filename = `hadiah-${eventName}-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      const prizeCount = csvContent.split('\n').length - 1; // -1 for header
      toast.success(`✅ Data ${prizeCount} hadiah berhasil diunduh`);
      
    } catch (error: any) {
      console.error('Error during export:', error);
      toast.error('Gagal mengunduh data hadiah - silakan coba lagi');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearch = () => {
    if (selectedEvent) {
      setCurrentPage(1); // Reset to first page when searching
    }
  };

  const resetForm = () => {
    setSelectedPrize(null);
    setPrizeImageFile(null);
    setFormData({
      name: '',
      description: '',
      quantity: 1,
      category: 'reguler',
      event_id: selectedEvent ? String(selectedEvent) : '',
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">Manajemen Hadiah</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tambah Hadiah
            </button>
            <button
              onClick={handleExport}
              disabled={!selectedEvent || isExporting}
              className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-2`}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Mengunduh...</span>
                </>
              ) : (
                'Export CSV'
              )}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Pilih Event</label>
          <select
            value={selectedEvent || ''}
            onChange={(e) => setSelectedEvent(Number(e.target.value))}
            className="w-full md:w-1/3 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Pilih Event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search and Filter Section */}
        {selectedEvent && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium">Cari Hadiah</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari berdasarkan nama atau deskripsi hadiah"
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Cari
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Filter Kategori</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="utama">Hadiah Utama</option>
                  <option value="reguler">Hadiah Reguler</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            {selectedEvent ? (
              prizes.length > 0 ? (
                <>
                  {/* Pagination Info */}
                  {totalCount > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Total: {totalCount} hadiah</strong> | 
                        Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalCount)} dari {totalCount} hadiah |
                        Halaman {currentPage} dari {totalPages}
                      </p>
                    </div>
                  )}

                  <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">Gambar</th>
                      <th className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">Nama Hadiah</th>
                      <th className="px-2 sm:px-4 py-2 border text-xs sm:text-sm hidden md:table-cell">Deskripsi</th>
                      <th className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">Kategori</th>
                      <th className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">Jumlah</th>
                      <th className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">Telah Diundi</th>
                      <th className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.map((prize) => (
                      <tr key={prize.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">
                          {(prize.imageUrl || prize.gambar_url) ? (
                            <img 
                              src={(prize.imageUrl || prize.gambar_url)?.startsWith('http') 
                                ? (prize.imageUrl || prize.gambar_url) 
                                : `http://localhost:3000${prize.imageUrl || prize.gambar_url}`}
                              alt={prize.name}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.removeAttribute('style');
                              }}
                            />
                          ) : null}
                          {!(prize.imageUrl || prize.gambar_url) && (
                            <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">{prize.name}</td>
                        <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm hidden md:table-cell">{prize.description || '-'}</td>
                        <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            prize.category === 'utama'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {prize.category}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">{prize.quantity}</td>
                        <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">
                          {prize.winningsCount} / {prize.quantity}
                        </td>
                        <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(prize)}
                              className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(prize.id, prize.eventId)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

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
                              currentPage === i + 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-white'
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
                </>
              ) : (
                <div className="text-center p-6 bg-gray-100 rounded">
                  <p>Belum ada hadiah untuk event ini.</p>
                </div>
              )
            ) : (
              <div className="text-center p-6 bg-gray-100 rounded">
                <p>Pilih event untuk melihat daftar hadiah.</p>
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                {selectedPrize ? 'Edit Hadiah' : 'Tambah Hadiah Baru'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">Event *</label>
                    <select
                      value={formData.event_id || selectedEvent || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, event_id: e.target.value })
                      }
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Event</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Nama Hadiah *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Kategori Hadiah *</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as 'utama' | 'reguler' })
                      }
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="reguler">Hadiah Reguler</option>
                      <option value="utama">Hadiah Utama</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Deskripsi hadiah (opsional)"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Gambar Hadiah</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPrizeImageFile(e.target.files?.[0] || null)}
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Format: PNG, JPG, JPEG, WebP. Maksimal 2MB. (Opsional)
                    </p>
                    {prizeImageFile && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          File dipilih: {prizeImageFile.name} ({(prizeImageFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    )}
                    {selectedPrize && (selectedPrize.imageUrl || selectedPrize.gambar_url) && (
                      <div className="mt-2">
                        <p className="text-sm text-blue-600">Gambar saat ini:</p>
                        <img 
                          src={(selectedPrize.imageUrl || selectedPrize.gambar_url)?.startsWith('http') 
                            ? (selectedPrize.imageUrl || selectedPrize.gambar_url) 
                            : `http://localhost:3000${selectedPrize.imageUrl || selectedPrize.gambar_url}`}
                          alt="Prize current image" 
                          className="max-w-32 max-h-32 object-cover rounded border mt-1"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Jumlah Hadiah *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
                  >
                    {selectedPrize ? 'Simpan Perubahan' : 'Tambah Hadiah'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PrizeManagement; 