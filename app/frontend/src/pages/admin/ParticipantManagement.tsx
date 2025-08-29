import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/axios';

interface Participant {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  nik: string;
  institution: string;
  registrationNumber: string;
  createdAt: string;
  eventId: number;
}

interface Event {
  id: number;
  name: string;
  participantsCount: number;
  maxParticipants: number | null;
  participants_count?: number;
  max_participants?: number | null;
}

export const ParticipantManagement = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage] = useState(20); // default per page
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    nik: '',
    institution: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Memoize fetchEvents and fetchParticipants to prevent useEffect loops
  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/events');
      // Handle both array and object response formats
      if (Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        setEvents(response.data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Gagal memuat daftar event');
      setEvents([]);
    }
  }, []);

  const fetchParticipants = async () => {
    if (!selectedEventId) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/api/admin/events/${selectedEventId}/participants`, {
        params: { page: currentPage, per_page: perPage, search: searchTerm }
      });
      
      // Debug logging
      console.log('Participants API Response:', response.data);
      console.log('Participants count:', response.data.participants?.length || 0);
      console.log('Pagination data:', response.data.pagination);
      
      setParticipants(response.data.participants || []);
      
      if (response.data.pagination) {
        const totalPages = response.data.pagination.total_pages || response.data.pagination.totalPages || 1;
        const currentPageFromAPI = response.data.pagination.current_page || response.data.pagination.currentPage || 1;
        const totalCount = response.data.pagination.total_count || response.data.pagination.totalCount || 0;
        
        console.log('Setting pagination:', { totalPages, currentPage: currentPageFromAPI, totalCount });
        
        setTotalPages(totalPages);
        setCurrentPage(currentPageFromAPI);
        setTotalCount(totalCount);
      } else {
        // Check if we have more than perPage participants or exactly perPage (indicates more pages might exist)
        const participantCount = response.data.participants?.length || 0;
        console.log('No pagination info from backend. Participant count:', participantCount);
        
        if (participantCount >= perPage) {
          console.log('No pagination info but have full page - there might be more data');
          // If we have exactly perPage participants, assume there might be more
          // Try to estimate total pages by checking if next page exists
          setTotalPages(Math.max(2, Math.ceil(participantCount / perPage) + 1)); 
          setTotalCount(participantCount); // At least this many
        } else {
          setTotalPages(1);
          setTotalCount(participantCount);
        }
        setCurrentPage(currentPage);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Gagal memuat daftar peserta');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipants();
    }
  }, [selectedEventId, currentPage, searchTerm, perPage]);

  const handleSearch = () => {
    if (selectedEventId) {
      setCurrentPage(1);
    }
  };

  // Helper function to fetch ALL participants and generate CSV
  const generateCSVFromAllData = async () => {
    try {
      // Fetch ALL participants without pagination
      const response = await api.get(`/api/admin/events/${selectedEventId}/participants`, {
        params: { 
          page: 1, 
          per_page: 10000, // Large number to get all participants
          search: '' // No search filter for export
        }
      });
      
      const allParticipants = response.data.participants || [];
      console.log(`✅ Successfully fetched ${allParticipants.length} participants for export`);
      
      const headers = ['No Registrasi', 'Nama', 'Email', 'Telepon', 'NIK', 'Instansi', 'Tanggal Daftar'];
      const csvRows = [headers.join(',')];
      
      allParticipants.forEach((participant: any) => {
        const row = [
          `"${participant.registrationNumber || ''}"`,
          `"${participant.name || ''}"`,
          `"${participant.email || ''}"`,
          `"${participant.phoneNumber || ''}"`,
          `"${participant.nik || ''}"`,
          `"${participant.institution || ''}"`,
          `"${new Date(participant.createdAt).toLocaleDateString('id-ID')}"`
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    } catch (error) {
      console.error('Error fetching all participants for export:', error);
      // Fallback to current page data if API fails
      const headers = ['No Registrasi', 'Nama', 'Email', 'Telepon', 'NIK', 'Instansi', 'Tanggal Daftar'];
      const csvRows = [headers.join(',')];
      
      participants.forEach(participant => {
        const row = [
          `"${participant.registrationNumber || ''}"`,
          `"${participant.name || ''}"`,
          `"${participant.email || ''}"`,
          `"${participant.phoneNumber || ''}"`,
          `"${participant.nik || ''}"`,
          `"${participant.institution || ''}"`,
          `"${new Date(participant.createdAt).toLocaleDateString('id-ID')}"`
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  };

  const handleExport = async () => {
    if (!selectedEventId) return;
    setIsExporting(true);
    
    try {
      console.log('Starting export process...');
      
      // Since backend export endpoint is not working properly, 
      // directly use our CSV generation method
      const csvContent = await generateCSVFromAllData();
      
      if (!csvContent || csvContent.trim() === '') {
        toast.error('Tidak ada data peserta untuk diekspor');
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
      const selectedEvent = events.find(e => e.id.toString() === selectedEventId);
      const eventName = selectedEvent ? selectedEvent.name.replace(/[^a-zA-Z0-9]/g, '-') : selectedEventId;
      const filename = `peserta-${eventName}-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      const participantCount = csvContent.split('\n').length - 1; // -1 for header
      toast.success(`✅ Data ${participantCount} peserta berhasil diunduh`);
      
    } catch (error: any) {
      console.error('Error during export:', error);
      toast.error('Gagal mengunduh data peserta - silakan coba lagi');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Pilih event terlebih dahulu');
      return;
    }

    try {
      if (selectedParticipant) {
        // Update participant
        await api.put(`/api/admin/events/${selectedEventId}/participants/${selectedParticipant.id}`, { participant: formData });
        toast.success('Data peserta berhasil diperbarui');
      } else {
        // Create new participant
        await api.post(`/api/admin/events/${selectedEventId}/participants`, { participant: formData });
        toast.success('Peserta berhasil ditambahkan');
      }
      setIsModalOpen(false);
      resetForm();
      // Refresh participants data
      fetchParticipants();
    } catch (error: unknown) {
      if (
        error && 
        typeof error === 'object' && 
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'errors' in error.response.data
      ) {
        const errorMessages = Object.entries(error.response.data.errors as Record<string, string[]>)
          .map(([field, messages]) => `${field}: ${messages}`)
          .join(', ');
        toast.error(`Error: ${errorMessages}`);
      } else {
        toast.error('Terjadi kesalahan saat menyimpan data peserta');
      }
    }
  };

  const handleEdit = (participant: Participant) => {
    setSelectedParticipant(participant);
    setFormData({
      name: participant.name,
      email: participant.email || '',
      phone_number: participant.phoneNumber || '',
      nik: participant.nik || '',
      institution: participant.institution || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (participantId: number) => {
    if (!selectedEventId) return;
    
    if (window.confirm('Apakah Anda yakin ingin menghapus peserta ini?')) {
      try {
        // Gunakan endpoint yang benar
        await api.delete(`/api/admin/events/${selectedEventId}/participants/${participantId}`);
        toast.success('Peserta berhasil dihapus');
        // Refresh participants data
        fetchParticipants();
      } catch {
        toast.error('Gagal menghapus peserta');
      }
    }
  };

  const resetForm = () => {
    setSelectedParticipant(null);
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      nik: '',
      institution: '',
    });
  };

  const censorNIK = (nik: string) => {
    if (!nik || nik.length < 16) return nik;
    return `${nik.substring(0, 8)}XXXX${nik.substring(12)}`;
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Manajemen Peserta</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tambah Peserta
            </button>
            <button
              onClick={handleExport}
              disabled={!selectedEventId || isExporting}
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
                'Export Excel'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block mb-2">Pilih Event</label>
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Pilih Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({(event.participantsCount || event.participants_count || 0)}/{(event.maxParticipants || event.max_participants || '∞')})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-2">Cari Peserta</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama, email, NIK, atau no HP"
                className="w-full border p-2 rounded"
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
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instansi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Registrasi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(8)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {selectedEventId ? (
              participants.length > 0 ? (
                <>
                  {/* Pagination Info */}
                  {totalCount > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Total: {totalCount} peserta</strong> | 
                        Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalCount)} dari {totalCount} peserta |
                        Halaman {currentPage} dari {totalPages}
                      </p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 border">No Registrasi</th>
                          <th className="px-4 py-2 border">Nama</th>
                          <th className="px-4 py-2 border">Email</th>
                          <th className="px-4 py-2 border">Telepon</th>
                          <th className="px-4 py-2 border">NIK</th>
                          <th className="px-4 py-2 border">Instansi</th>
                          <th className="px-4 py-2 border">Terdaftar</th>
                          <th className="px-4 py-2 border">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((participant) => (
                          <tr key={participant.id}>
                            <td className="px-4 py-2 border font-mono text-xs">
                              {participant.registrationNumber}
                            </td>
                            <td className="px-4 py-2 border">{participant.name}</td>
                            <td className="px-4 py-2 border">{participant.email || '-'}</td>
                            <td className="px-4 py-2 border">{participant.phoneNumber || '-'}</td>
                            <td className="px-4 py-2 border font-mono text-xs">
                              {censorNIK(participant.nik)}
                            </td>
                            <td className="px-4 py-2 border">{participant.institution || '-'}</td>
                            <td className="px-4 py-2 border whitespace-nowrap">
                              {new Date(participant.createdAt).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-4 py-2 border">
                              <button
                                onClick={() => handleEdit(participant)}
                                className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(participant.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
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
                <div className="text-center p-12 bg-gray-50 rounded">
                  <p className="text-gray-600">Belum ada peserta untuk event ini.</p>
                </div>
              )
            ) : (
              <div className="text-center p-12 bg-gray-50 rounded">
                <p className="text-gray-600">Pilih event untuk melihat daftar peserta.</p>
              </div>
            )}
          </>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-xl">
              <h2 className="text-xl font-bold mb-4">
                {selectedParticipant ? 'Edit Peserta' : 'Tambah Peserta Baru'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Email (Opsional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Nomor HP</label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2">NIK (KTP)</label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) =>
                        setFormData({ ...formData, nik: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                      required
                      pattern="[0-9]{16}"
                      title="NIK harus berisi 16 digit angka"
                      placeholder="16 digit angka NIK"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Instansi/Organisasi (Opsional)</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) =>
                        setFormData({ ...formData, institution: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {selectedParticipant ? 'Simpan Perubahan' : 'Tambah Peserta'}
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

export default ParticipantManagement; 