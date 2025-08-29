import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Navbar } from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

interface Winner {
  id: number;
  prizeId: number;
  participantId: number;
  drawnAt: string;
  participant: {
    id: number;
    name: string;
    email: string;
    registrationNumber: string;
    institution?: string;
  };
  prize: {
    id: number;
    name: string;
    description?: string;
    category: string;
  };
}

export const Winners = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWinners = async () => {
    if (!eventId) {
      console.error('No eventId provided');
      setError('ID event tidak valid');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/events/${eventId}/winners`);
      setWinners(response.data as Winner[]);
    } catch (err: any) {
      console.error('Error fetching winners:', err);
      let errorMessage = 'Gagal memuat data pemenang';
      
      if (err.response) {
        // Server responded with error status
        switch (err.response.status) {
          case 404:
            errorMessage = 'Event tidak ditemukan';
            break;
          case 403:
            errorMessage = 'Tidak memiliki akses untuk melihat data pemenang';
            break;
          case 500:
            errorMessage = 'Terjadi kesalahan pada server';
            break;
          default:
            errorMessage = err.response?.data?.message || errorMessage;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      
      setError(errorMessage);
      setWinners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, [eventId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingSpinner 
              size="large" 
              text="Memuat data pemenang..." 
              variant="modern"
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            to={`/events/${eventId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Detail Event
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8">Daftar Pemenang</h1>
        
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Terjadi Kesalahan</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchWinners}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        ) : winners.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">Belum ada pemenang yang diundi</p>
            <p className="text-gray-400 text-sm mt-2">Undian hadiah akan segera dilaksanakan</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-gray-700 text-lg font-medium">
                🎉 Selamat kepada para pemenang! 🎉
              </p>
              <p className="text-gray-500 text-sm">
                Total {winners.length} pemenang telah diundi
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {winners.filter(winner => winner && winner.participant && winner.prize).map((winner, index) => (
                <div key={winner.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                        🏆 #{index + 1}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {winner.drawnAt ? new Date(winner.drawnAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{winner.prize?.name || 'Hadiah Tidak Diketahui'}</h3>
                    {winner.prize?.description && (
                      <p className="text-gray-600 text-sm">{winner.prize.description}</p>
                    )}
                    <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {winner.prize?.category || 'Kategori Tidak Diketahui'}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {winner.participant?.name?.charAt(0)?.toUpperCase() || 'P'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{winner.participant?.name || 'Pemenang Tidak Diketahui'}</h4>
                        <p className="text-xs text-gray-500">Pemenang</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      {winner.participant?.email && (
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          {winner.participant.email}
                        </p>
                      )}
                      {winner.participant?.registrationNumber && (
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          {winner.participant.registrationNumber}
                        </p>
                      )}
                      {winner.participant?.institution && (
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {winner.participant.institution}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}; 