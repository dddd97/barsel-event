import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../lib/axios';
import { 
  PlayIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  TrophyIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { Prize as PrizeType } from '../../types/prize';
// import type { Winning } from '../../types/winning'; // Unused import

interface Participant {
  id: number;
  name: string;
  registrationNumber: string;
  institution: string;
  email: string;
  phoneNumber: string;
}

interface Winner extends Participant {
  prizeName: string;
}

interface SlotMachineDigit {
  value: string;
  isSpinning: boolean;
  finalValue: string;
}

export const FullscreenDrawing: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prizes, setPrizes] = useState<PrizeType[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<PrizeType | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  
  // 4-slot machine state (for 4-digit participant numbers 0001-9999)
  const [slots, setSlots] = useState<SlotMachineDigit[]>([
    { value: '0', isSpinning: false, finalValue: '0' },
    { value: '0', isSpinning: false, finalValue: '0' },
    { value: '0', isSpinning: false, finalValue: '0' },
    { value: '1', isSpinning: false, finalValue: '1' }
  ]);

  const [animationPhase, setAnimationPhase] = useState<'idle' | 'spinning' | 'stopping' | 'complete'>('idle');

  useEffect(() => {
    if (eventId) {
      fetchPrizes();
    }
  }, [eventId]);

  const fetchPrizes = async () => {
    try {
      const response = await api.get(`/api/admin/events/${eventId}/prizes`);
      // Filter prizes that have quantity > 0 (available for drawing)
      const availablePrizes = response.data.filter((prize: PrizeType) => 
        prize.quantity > 0
      );
      setPrizes(availablePrizes);
    } catch (error) {
      toast.error('Gagal memuat daftar hadiah');
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        toast.error('Gagal masuk mode fullscreen');
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  const spinSlots = (finalNumber: string) => {
    const digits = finalNumber.padStart(4, '0').split('');
    
    // Start spinning animation
    setSlots(prev => prev.map(slot => ({ ...slot, isSpinning: true })));
    setAnimationPhase('spinning');

    // Generate random spinning animation
    const spinInterval = setInterval(() => {
      setSlots(prev => prev.map(slot => ({
        ...slot,
        value: Math.floor(Math.random() * 10).toString()
      })));
    }, 100);

    // Stop slots one by one with delays
    setTimeout(() => {
      setAnimationPhase('stopping');
      
      // Stop first slot
      setTimeout(() => {
        setSlots(prev => {
          const newSlots = [...prev];
          newSlots[0] = { ...newSlots[0], isSpinning: false, value: digits[0], finalValue: digits[0] };
          return newSlots;
        });
      }, 1000);

      // Stop second slot
      setTimeout(() => {
        setSlots(prev => {
          const newSlots = [...prev];
          newSlots[1] = { ...newSlots[1], isSpinning: false, value: digits[1], finalValue: digits[1] };
          return newSlots;
        });
      }, 2000);

      // Stop third slot
      setTimeout(() => {
        setSlots(prev => {
          const newSlots = [...prev];
          newSlots[2] = { ...newSlots[2], isSpinning: false, value: digits[2], finalValue: digits[2] };
          return newSlots;
        });
      }, 3000);

      // Stop fourth slot and show winner
      setTimeout(() => {
        clearInterval(spinInterval);
        setSlots(prev => {
          const newSlots = [...prev];
          newSlots[3] = { ...newSlots[3], isSpinning: false, value: digits[3], finalValue: digits[3] };
          return newSlots;
        });
        setAnimationPhase('complete');
        
        // Show winner after a dramatic pause
        setTimeout(() => {
          setShowWinner(true);
        }, 1000);
      }, 4000);
    }, 2000);
  };

  const handleDrawWinner = async () => {
    if (!selectedPrize) {
      toast.error('Pilih hadiah terlebih dahulu');
      return;
    }

    setIsDrawing(true);
    setShowWinner(false);
    setCurrentWinner(null);

    try {
      const response = await api.post(`/api/admin/events/${eventId}/prize_drawings/${selectedPrize.id}/draw`);
      
      if (response.data.success) {
        const winner = response.data.winner;
        const winnerData: Winner = {
          id: winner.id,
          name: winner.name,
          registrationNumber: winner.registration_number,
          institution: winner.institution,
          email: winner.email,
          phoneNumber: winner.phone_number,
          prizeName: selectedPrize.name
        };

        setCurrentWinner(winnerData);
        
        // Extract participant number from registration number (assuming format like "E1-0123")
        const participantNumber = winner.registration_number.split('-')[1] || winner.registration_number.slice(-4);
        
        // Start slot machine animation
        spinSlots(participantNumber);
        
        toast.success('Undian berhasil!');
      }
    } catch (error: any) {
      console.error('Error drawing winner:', error);
      toast.error(error.response?.data?.error || 'Gagal mengundi hadiah');
    } finally {
      setIsDrawing(false);
    }
  };

  const resetDraw = () => {
    setCurrentWinner(null);
    setShowWinner(false);
    setAnimationPhase('idle');
    setSlots([
      { value: '0', isSpinning: false, finalValue: '0' },
      { value: '0', isSpinning: false, finalValue: '0' },
      { value: '0', isSpinning: false, finalValue: '0' },
      { value: '1', isSpinning: false, finalValue: '1' }
    ]);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Prize Drawing</h1>
              <p className="text-white/60">Event ID: {eventId}</p>
            </div>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-5 h-5" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-12">
          {/* Prize Selection */}
          {!selectedPrize && (
            <div className="w-full max-w-4xl">
              <h2 className="text-3xl font-bold text-white text-center mb-8">Pilih Hadiah untuk Diundi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prizes.map((prize) => (
                  <button
                    key={prize.id}
                    onClick={() => setSelectedPrize(prize)}
                    className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all transform hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-yellow-900" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-semibold text-white">{prize.name}</h3>
                        <p className="text-white/60">Kategori: {prize.category}</p>
                        <p className="text-white/80">Tersisa: {prize.quantity}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Prize & Slot Machine */}
          {selectedPrize && (
            <div className="w-full max-w-6xl space-y-12">
              {/* Selected Prize Display */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-4 px-8 py-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                  <TrophyIcon className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPrize.name}</h2>
                    <p className="text-white/60">Mengundi hadiah {selectedPrize.category}</p>
                  </div>
                </div>
              </div>

              {/* 4-Slot Machine */}
              <div className="flex justify-center">
                <div className="flex space-x-4">
                  {slots.map((slot, index) => (
                    <div
                      key={index}
                      className={`
                        w-32 h-48 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-4 border-yellow-400 
                        flex items-center justify-center text-8xl font-bold text-yellow-400 shadow-2xl
                        ${slot.isSpinning ? 'animate-pulse' : ''}
                        ${animationPhase === 'complete' ? 'animate-bounce' : ''}
                      `}
                    >
                      <span className={slot.isSpinning ? 'blur-sm' : ''}>{slot.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Participant Number Display */}
              <div className="text-center">
                <p className="text-white/60 text-xl mb-2">Nomor Peserta</p>
                <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <span className="text-white/40 text-2xl font-mono">E1-</span>
                  <span className="text-white text-3xl font-mono font-bold">
                    {slots.map(slot => slot.value).join('')}
                  </span>
                </div>
              </div>

              {/* Draw Button */}
              {animationPhase === 'idle' && (
                <div className="text-center">
                  <button
                    onClick={handleDrawWinner}
                    disabled={isDrawing}
                    className="inline-flex items-center space-x-3 px-12 py-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-2xl rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all disabled:opacity-50 disabled:transform-none"
                  >
                    <PlayIcon className="w-8 h-8" />
                    <span>{isDrawing ? 'Mengundi...' : 'MULAI UNDIAN'}</span>
                  </button>
                </div>
              )}

              {/* Winner Display */}
              {showWinner && currentWinner && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-12 max-w-2xl w-full mx-4 text-center shadow-3xl">
                    <div className="mb-8">
                      <TrophyIcon className="w-24 h-24 mx-auto text-yellow-900 mb-4" />
                      <h2 className="text-4xl font-bold text-gray-900 mb-2">🎉 SELAMAT! 🎉</h2>
                      <p className="text-xl text-gray-800">Pemenang {currentWinner.prizeName}</p>
                    </div>
                    
                    <div className="bg-white/20 rounded-2xl p-8 mb-8">
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <UserIcon className="w-12 h-12 text-gray-900" />
                        <div>
                          <h3 className="text-3xl font-bold text-gray-900">{currentWinner.name}</h3>
                          <p className="text-xl text-gray-800">No. {currentWinner.registrationNumber}</p>
                        </div>
                      </div>
                      <p className="text-lg text-gray-800">{currentWinner.institution}</p>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowWinner(false)}
                        className="flex-1 px-6 py-3 bg-white/20 text-gray-900 font-semibold rounded-xl hover:bg-white/30 transition-all"
                      >
                        Tutup
                      </button>
                      <button
                        onClick={() => {
                          resetDraw();
                          setSelectedPrize(null);
                          fetchPrizes();
                        }}
                        className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
                      >
                        Undian Selanjutnya
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Button */}
              {animationPhase !== 'idle' && !showWinner && (
                <div className="text-center">
                  <button
                    onClick={resetDraw}
                    className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm"
                  >
                    Reset Undian
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullscreenDrawing; 