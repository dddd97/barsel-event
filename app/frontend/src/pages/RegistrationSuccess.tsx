import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Download, Calendar, MapPin, User, Building2, CreditCard, Phone, Mail, Home, ArrowRight, Loader2, Eye } from 'lucide-react';
import api from '../lib/axios';
import ParticipantCard from '../components/ParticipantCard';
import ParticipantCardModal from '../components/ParticipantCardModal';

interface Participant {
  id: number;
  name: string;
  email?: string;
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
  title?: string;
  description: string;
  date?: string;
  eventDate: string;
  location: string;
}

// New interface for card preview data
interface CardPreviewData {
  event: {
    id: number;
    name: string;
    location: string;
    event_date: string;
  };
  participant: {
    id: number;
    name: string;
    nik: string;
    phone_number: string;
    institution: string;
    email: string | null;
    registration_number: string;
  };
  qr_code_svg: string;
  banner_data_uri: string | null;
}

export const RegistrationSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<Event | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardPreview, setCardPreview] = useState<CardPreviewData | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  useEffect(() => {
    // Scroll to top immediately when component mounts
    window.scrollTo(0, 0);
    
    const fetchData = async () => {
      try {
        // Get participant data from navigation state or fetch from API
        const participantData = location.state?.participant;
        
        if (!participantData && id) {
          // If no participant data in state, we might need to fetch it
          // For now, redirect to check registration
          navigate(`/events/${id}/check-registration`);
          return;
        }

        setParticipant(participantData);

        // Fetch event data
        if (id) {
          const eventResponse = await api.get(`/api/events/${id}`);
          setEvent(eventResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, location.state, navigate]);

  // Fetch card preview data when the page loads and participant data is available
  useEffect(() => {
    if (participant && id) {
      fetchCardPreview();
    }
  }, [participant, id]);

  const fetchCardPreview = async () => {
    if (!participant) return;
    
    setCardLoading(true);
    setDownloadError(null);
    
    try {
      const response = await api.get(`/api/events/${id}/participants/${participant.id}/card_data`);
      setCardPreview(response.data);
      setShowCard(true);
    } catch (error) {
      console.error('Failed to fetch card preview:', error);
      setDownloadError('Gagal memuat preview kartu peserta.');
    } finally {
      setCardLoading(false);
    }
  };

  const handleDownloadCard = async () => {
    if (!participant) return;
    
    setCardLoading(true);
    setDownloadError(null);
    
    try {
      // Open PDF in new tab as preview (like Google Drive)
      const url = `/api/events/${id}/participants/${participant.id}/download_card`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to preview card:', error);
      setDownloadError('Gagal membuka preview kartu peserta. Silakan coba lagi nanti.');
    } finally {
      setCardLoading(false);
    }
  };

  // const formatIndonesianDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString('id-ID', {
  //     weekday: 'long',
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric'
  //   });
  // }; // Unused function

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Success Header Skeleton */}
          <div className="text-center mb-10">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          
          {/* Participant Details Skeleton */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-3 pt-4">
                <div className="h-12 bg-gray-200 rounded-xl"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons Skeleton */}
          <div className="text-center">
            <div className="animate-pulse flex flex-col sm:flex-row gap-4 justify-center">
              <div className="h-12 bg-gray-200 rounded-xl w-full sm:w-48"></div>
              <div className="h-12 bg-gray-200 rounded-xl w-full sm:w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!participant || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Data tidak ditemukan</h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 animate-fade-in-up">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pendaftaran Berhasil!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Selamat! Anda telah berhasil mendaftar untuk event ini. Silakan simpan informasi di bawah ini untuk referensi Anda.
          </p>
        </div>

        {/* Virtual Card Preview Section */}
        {showCard && (
          <div className="mb-10 flex flex-col items-center animate-fade-in-up-delay-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              Kartu Peserta
            </h2>
            
            {cardLoading ? (
              <div className="w-full flex justify-center py-12">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            ) : cardPreview ? (
              <div className="w-full max-w-sm mx-auto">
                <ParticipantCard
                  event={cardPreview.event}
                  participant={cardPreview.participant}
                  qr_code_svg={cardPreview.qr_code_svg}
                  banner_data_uri={cardPreview.banner_data_uri}
                  onDownload={handleDownloadCard}
                  downloadLoading={cardLoading}
                  className="mx-auto"
                />
                
                {/* Preview Button */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowCardModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Kartu
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-600">
                <p>Tidak dapat memuat preview kartu. Silakan coba untuk mengunduh kartu.</p>
              </div>
            )}
            
            {/* Download Error Message */}
            {downloadError && (
              <div className="mt-4 text-center">
                <p className="text-red-600 text-sm">{downloadError}</p>
                <button 
                  onClick={fetchCardPreview}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Event Information */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              Informasi Event
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.name || event.title}</h3>
                <p className="text-gray-600 mb-4">{event.description}</p>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Tanggal & Waktu</p>
                    <p className="text-gray-600">
                      {new Date(event.eventDate || event.date || '').toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Lokasi</p>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Participant Information */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <User className="w-6 h-6 text-green-600" />
              Data Peserta
            </h2>
            
            <div className="space-y-4">
              {/* Registration Number - Highlighted */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl">
                <p className="text-sm font-medium opacity-90">Nomor Registrasi</p>
                <p className="text-2xl font-bold">{participant.registrationNumber}</p>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Nama Lengkap</p>
                    <p className="text-gray-600">{participant.name}</p>
                  </div>
                </div>
                
                {participant.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">{participant.email}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Nomor Telepon</p>
                    <p className="text-gray-600">{participant.phoneNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">NIK</p>
                    <p className="text-gray-600 font-mono">{participant.nik}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Instansi</p>
                    <p className="text-gray-600">{participant.institution}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownloadCard}
              disabled={cardLoading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:transform-none disabled:hover:from-blue-600 disabled:hover:to-indigo-600"
            >
              {cardLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Download Kartu Peserta
            </button>
            
            <Link
              to={`/events/${id}/check-registration`}
              className="inline-flex items-center gap-2 bg-white text-gray-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
            >
              <User className="w-5 h-5" />
              Cek Status Pendaftaran
            </Link>
          </div>
          
          <div className="pt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
              Kembali ke Beranda
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Informasi Penting</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">📧 Konfirmasi Email</h4>
              <p>
                {participant.email 
                  ? "Email konfirmasi telah dikirim ke alamat email Anda. Silakan periksa inbox dan folder spam."
                  : "Email tidak disediakan. Silakan simpan nomor registrasi Anda dengan baik."
                }
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎫 Kartu Peserta</h4>
              <p>
                Unduh dan simpan kartu peserta Anda. Kartu ini diperlukan saat check-in di lokasi event.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📱 Hubungi Kami</h4>
              <p>
                Jika ada pertanyaan, silakan hubungi panitia event melalui kontak yang tersedia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔄 Perubahan Data</h4>
              <p>
                Untuk perubahan data peserta, silakan hubungi panitia dengan menyertakan nomor registrasi.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Participant Card Modal */}
      <ParticipantCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        cardData={cardPreview}
        onDownload={handleDownloadCard}
        downloadLoading={cardLoading}
      />
    </div>
  );
};