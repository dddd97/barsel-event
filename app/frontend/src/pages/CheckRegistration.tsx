import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, CreditCard, Hash, User, Mail, Building2, CheckCircle, XCircle, Download, ArrowLeft, Eye } from 'lucide-react';
import api from '../lib/axios';
import { previewPDF, downloadPDF } from '../utils/api';

interface CheckResult {
  found: boolean;
  participant?: {
    id: number;
    name: string;
    email: string;
    nik: string;
    registrationNumber: string;
    institution?: string;
  };
}

interface Event {
  id: number;
  name: string;
  title?: string;
  description: string;
  date?: string;
  eventDate: string;
  location: string;
}

export const CheckRegistration = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [nik, setNik] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/api/events/${eventId}`);
        setEvent(response.data);
      } catch (error) {
        console.error('Failed to fetch event:', error);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nik.trim() && !registrationNumber.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (nik.trim()) params.append('nik', nik.trim());
      if (registrationNumber.trim()) params.append('registration_number', registrationNumber.trim());
      
      const response = await api.get(`/api/events/${eventId}/check-registration?${params}`);
      setResult(response.data as CheckResult);
    } catch (error: unknown) {
      console.error('Error checking registration:', error);
      setResult({ found: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewCard = async () => {
    if (!result?.participant) return;
    
    try {
      const url = `/api/events/${eventId}/participants/${result.participant.id}/download_card`;
      previewPDF(url);
    } catch (error) {
      console.error('Failed to preview card:', error);
    }
  };

  const handleDownloadCard = async () => {
    if (!result?.participant) return;
    
    try {
      const url = `/api/events/${eventId}/participants/${result.participant.id}/download_card`;
      await downloadPDF(url);
    } catch (error) {
      console.error('Failed to download card:', error);
    }
  };

  const resetForm = () => {
    setNik('');
    setRegistrationNumber('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cek Status Registrasi
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Masukkan NIK atau Nomor Registrasi Anda untuk melihat status pendaftaran event.
          </p>
        </div>

        {/* Event Info */}
        {event && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">{event.name || event.title}</h2>
            <div className="text-gray-600 mb-4 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-500">
              <span>
                {new Date(event.eventDate || event.date || '').toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="hidden sm:block">•</span>
              <span>{event.location}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Cari Data Pendaftaran
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nik" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4" />
                  NIK (Nomor Induk Kependudukan)
                </label>
                <input
                  type="text"
                  id="nik"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  placeholder="Masukkan 16 digit NIK"
                  maxLength={16}
                />
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="h-px bg-gray-300 flex-1 w-16"></div>
                  <span className="text-sm text-gray-500 font-medium">ATAU</span>
                  <div className="h-px bg-gray-300 flex-1 w-16"></div>
                </div>
              </div>
              
              <div>
                <label htmlFor="registrationNumber" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4" />
                  Nomor Registrasi
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  placeholder="Contoh: E1-0001"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading || (!nik.trim() && !registrationNumber.trim())}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Mencari...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Search className="w-5 h-5" />
                      Cek Status
                    </div>
                  )}
                </button>
                
                {(nik || registrationNumber || result) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Result */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Hasil Pencarian
            </h2>
            
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ) : !result ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Masukkan NIK atau Nomor Registrasi untuk melihat status pendaftaran Anda.
                </p>
              </div>
            ) : result.found ? (
              <div className="space-y-6 animate-fade-in-up">
                {/* Success Header */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    Registrasi Ditemukan!
                  </h3>
                  <p className="text-green-600">
                    Data pendaftaran Anda berhasil ditemukan.
                  </p>
                </div>

                {/* Participant Details */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl">
                    <p className="text-sm font-medium opacity-90">Nomor Registrasi</p>
                    <p className="text-xl font-bold">{result.participant?.registrationNumber}</p>
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Nama Lengkap</p>
                        <p className="text-gray-600">{result.participant?.name}</p>
                      </div>
                    </div>
                    
                    {result.participant?.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Email</p>
                          <p className="text-gray-600">{result.participant.email}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CreditCard className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">NIK</p>
                        <p className="text-gray-600 font-mono">{result.participant?.nik}</p>
                      </div>
                    </div>
                    
                    {result.participant?.institution && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Instansi</p>
                          <p className="text-gray-600">{result.participant.institution}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  <button
                    onClick={handlePreviewCard}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview Kartu Peserta
                    </div>
                  </button>
                  
                  <button
                    onClick={handleDownloadCard}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" />
                      Download Kartu Peserta
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 animate-fade-in-up">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">
                  Registrasi Tidak Ditemukan
                </h3>
                <p className="text-red-600 mb-6">
                  Data pendaftaran dengan NIK atau Nomor Registrasi yang Anda masukkan tidak ditemukan.
                </p>
                
                <div className="bg-red-50 rounded-xl p-4 text-left">
                  <h4 className="font-semibold text-red-800 mb-2">Pastikan:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• NIK yang dimasukkan sesuai dengan yang didaftarkan</li>
                    <li>• Nomor registrasi ditulis dengan benar (contoh: E1-0001)</li>
                    <li>• Anda sudah melakukan pendaftaran sebelumnya</li>
                  </ul>
                </div>
                
                <div className="mt-6">
                  <Link
                    to={`/events/${eventId}/register`}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200"
                  >
                    Daftar Sekarang
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Butuh Bantuan?</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-700">
            <div className="text-center">
              <h4 className="font-semibold mb-2">📞 Hubungi Panitia</h4>
              <p>
                Jika ada pertanyaan terkait pendaftaran, silakan hubungi panitia event.
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">🔄 Perubahan Data</h4>
              <p>
                Untuk mengubah data pendaftaran, hubungi panitia dengan menyertakan nomor registrasi.
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">🎫 Kartu Peserta</h4>
              <p>
                Simpan kartu peserta Anda dengan baik. Kartu diperlukan saat check-in event.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
