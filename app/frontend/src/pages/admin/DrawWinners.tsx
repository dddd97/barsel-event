import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../lib/axios';
import { TrophyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { Prize as PrizeType } from '../../types/prize';
import type { Winning } from '../../types/winning';
import { CategoryBadge } from '../../components/CategoryBadge';
// import AdminLayout from '../../components/AdminLayout'; // Unused import
import SlotMachine from '../../components/SlotMachine';

interface SlotAnimationData {
  reel1: string[];
  reel2: string[];
  reel3: string[];
  reel4: string[];
  reel5: string[];
  animationDuration: number;
  reelDelays: number[];
  finalSpinDuration: number;
}

interface Winner {
  id: number;
  name: string;
  registrationNumber: string;
  institution: string;
  email: string;
  phoneNumber: string;
}

export const DrawWinners = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [prizes, setPrizes] = useState<PrizeType[]>([]);
  const [winners, setWinners] = useState<Winning[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // const [drawResult, setDrawResult] = useState<Winning | null>(null); // Unused state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Slot Machine States
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotAnimation, setSlotAnimation] = useState<SlotAnimationData | null>(null);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [currentPrize, setCurrentPrize] = useState<PrizeType | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const fetchData = async () => {
    try {
      setError(null);
      const [prizesResponse, winnersResponse] = await Promise.all([
        api.get(`/api/admin/events/${eventId}/prizes`),
        api.get(`/api/admin/events/${eventId}/winners`)
      ]);

      setPrizes(prizesResponse.data || []);
      setWinners(winnersResponse.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data');
      toast.error('Gagal memuat data event');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawWinner = async () => {
    if (!selectedPrize) {
      toast.error('Pilih hadiah terlebih dahulu');
      return;
    }

    setIsDrawing(true);
    // Don't set isSpinning here, wait until slotAnimation is set

    try {
      // Get the selected prize details
      const prize = prizes.find(p => p.id === selectedPrize);
      if (!prize) {
        toast.error('Hadiah tidak ditemukan');
        return;
      }

      setCurrentPrize(prize);

      // Make the draw request with proper authentication
      const response = await api.post(`/api/admin/events/${eventId}/prize_drawings/${selectedPrize}/draw`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      if (response.data.success) {
        const winnerData = response.data.winner;
        const winner: Winner = {
          id: winnerData.id,
          name: winnerData.name,
          registrationNumber: winnerData.registration_number,
          institution: winnerData.institution,
          email: winnerData.email,
          phoneNumber: winnerData.phone_number
        };

        setCurrentWinner(winner);

        // Use slot animation data from API response
        const animationData: SlotAnimationData = {
          reel1: response.data.slotAnimation.reel1,
          reel2: response.data.slotAnimation.reel2,
          reel3: response.data.slotAnimation.reel3,
          reel4: response.data.slotAnimation.reel4,
          reel5: response.data.slotAnimation.reel5,
          animationDuration: response.data.slotAnimation.animationDuration,
          reelDelays: response.data.slotAnimation.reelDelays,
          finalSpinDuration: response.data.slotAnimation.finalSpinDuration
        };

        setSlotAnimation(animationData);
        toast.success('Undian berhasil!');
        
        // Add a small delay before starting animation to ensure state is set
        setTimeout(() => {
          setIsSpinning(true);
        }, 100);
        
        // Refresh data
        await fetchData();
        setSelectedPrize(null);
      }
    } catch (error: any) {
      console.error('Error drawing winner:', error);
      const errorMessage = error.response?.data?.error || 'Gagal mengundi hadiah';
      toast.error(errorMessage);
      // Don't set isSpinning to false here since it was never set to true
    } finally {
      setIsDrawing(false);
    }
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    // Don't clear the winner and prize data to keep them visible
    // setSlotAnimation(null);
    // setCurrentWinner(null);
    // setCurrentPrize(null);
  };

  const availablePrizes = prizes.filter(prize => {
    const wonCount = winners.filter(w => w.prizeName === prize.name).length;
    return wonCount < prize.quantity;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="animate-pulse mb-8">
            <div className="flex items-center mb-6">
              <div className="h-8 w-8 bg-white/20 rounded mr-4"></div>
              <div className="h-8 bg-white/20 rounded w-48"></div>
            </div>
            <div className="h-12 bg-white/20 rounded w-64 mb-4"></div>
            <div className="h-6 bg-white/20 rounded w-96"></div>
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Prize Selection Skeleton */}
            <div className="animate-pulse">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="h-6 bg-white/20 rounded w-40 mb-6"></div>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-5 bg-white/20 rounded w-32 mb-2"></div>
                          <div className="h-4 bg-white/20 rounded w-24"></div>
                        </div>
                        <div className="h-6 bg-white/20 rounded-full w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-12 bg-white/20 rounded-xl"></div>
              </div>
            </div>

            {/* Right Panel - Slot Machine Skeleton */}
            <div className="animate-pulse">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="h-6 bg-white/20 rounded w-36 mb-6"></div>
                <div className="bg-black/30 rounded-xl p-8">
                  <div className="grid grid-cols-5 gap-4 mb-8">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-32 bg-white/10 rounded-lg"></div>
                    ))}
                  </div>
                  <div className="text-center">
                    <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-4"></div>
                    <div className="h-6 bg-white/20 rounded w-32 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Winners List Skeleton */}
          <div className="mt-8 animate-pulse">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="h-6 bg-white/20 rounded w-36 mb-6"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-white/20 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-white/20 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <TrophyIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-white">Error</h3>
          <p className="mt-2 text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2 text-white hover:text-yellow-300 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Kembali ke Dashboard</span>
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">🎰 UNDIAN BERHADIAH 🎰</h1>
              <p className="text-yellow-300 text-sm">Event ID: {eventId}</p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Prize Selection */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">🎁 Pilih Hadiah</h2>
              {availablePrizes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availablePrizes.map((prize) => {
                    const wonCount = winners.filter(w => w.prizeName === prize.name).length;
                    const remaining = prize.quantity - wonCount;
                    
                    return (
                      <div
                        key={prize.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPrize === prize.id
                            ? 'border-yellow-400 bg-yellow-400/20'
                            : 'border-white/30 hover:border-yellow-300 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedPrize(prize.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{prize.name}</h3>
                          <CategoryBadge category={prize.category === 'utama' ? 'main' : 'regular'}>
                            {prize.category === 'utama' ? 'UTAMA' : 'REGULER'}
                          </CategoryBadge>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{prize.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Sisa: {remaining}/{prize.quantity}</span>
                          {selectedPrize === prize.id && (
                            <span className="text-yellow-400 font-medium">✓ Dipilih</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🎁</div>
                  <h3 className="text-lg font-medium text-white mb-2">Tidak Ada Hadiah Tersedia</h3>
                  <p className="text-gray-300">Semua hadiah sudah diundi untuk event ini.</p>
                </div>
              )}
            </div>

            {/* Draw Button */}
            {selectedPrize && availablePrizes.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <button
                  onClick={handleDrawWinner}
                  disabled={isDrawing || isSpinning}
                  className={`w-full py-6 px-8 rounded-xl text-2xl font-bold transition-all ${
                    isDrawing || isSpinning
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105'
                  }`}
                >
                  {isDrawing || isSpinning ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
                      MENGUNDI...
                    </div>
                  ) : (
                    '🎰 MULAI UNDIAN! 🎰'
                  )}
                </button>
              </div>
            )}

            {/* Winners List */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">🏆 Daftar Pemenang</h2>
              {winners.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {winners.map((winner) => (
                    <div key={winner.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{winner.participantName}</p>
                          <p className="text-gray-300 text-sm">{winner.prizeName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-300 text-xs">
                            {new Date(winner.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-white mb-2">Belum Ada Pemenang</h3>
                  <p className="text-gray-300">Pilih hadiah dan lakukan undian untuk menentukan pemenang.</p>
                </div>
              )}
              
              {/* Clear button for current result */}
              {currentWinner && (
                <button
                  onClick={() => {
                    setCurrentWinner(null);
                    setCurrentPrize(null);
                    setSlotAnimation(null);
                  }}
                  className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  🗑️ Clear Hasil Terakhir
                </button>
              )}
            </div>
          </div>

          {/* Slot Machine Display */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              {(isSpinning || (currentWinner && currentPrize)) ? (
                <SlotMachine
                  isSpinning={isSpinning}
                  winner={currentWinner}
                  prize={currentPrize}
                  slotAnimation={slotAnimation}
                  onSpinComplete={handleSpinComplete}
                  className="w-full"
                />
              ) : (
                <div className="text-center py-20">
                  <div className="text-8xl mb-6">🎰</div>
                  <h2 className="text-3xl font-bold text-white mb-4">Slot Machine Siap!</h2>
                  <p className="text-gray-300 text-lg">
                    Pilih hadiah di panel kiri untuk memulai undian
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 