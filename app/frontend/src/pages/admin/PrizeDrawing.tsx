import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../lib/axios';
import { ArrowLeftIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import type { Prize as PrizeType } from '../../types/prize';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';

interface Winner {
  id: number;
  name: string;
  registrationNumber: string;
  institution: string;
  email: string;
  phoneNumber: string;
  nik: string;
}

const PrizeDrawing: React.FC = () => {
  const navigate = useNavigate();

  // Helper function to censor sensitive data
  const censorData = (data: string, type: 'nik' | 'email' | 'phone'): string => {
    if (!data) return '';
    
    switch (type) {
      case 'nik':
        // NIK: Show first 3 and last 3 digits, censor middle 10 digits
        // Example: 123***********456
        if (data.length >= 6) {
          const start = data.substring(0, 3);
          const end = data.substring(data.length - 3);
          const middle = '*'.repeat(data.length - 6);
          return `${start}${middle}${end}`;
        }
        return data;
        
      case 'email':
        // Email: Show first 3 chars, censor until @, show domain
        // Example: abc***@domain.com
        const atIndex = data.indexOf('@');
        if (atIndex > 3) {
          const start = data.substring(0, 3);
          const domain = data.substring(atIndex);
          const middle = '*'.repeat(3);
          return `${start}${middle}${domain}`;
        }
        return data;
        
      case 'phone':
        // Phone: Show first 3 digits, censor middle, show last 3 digits
        // Example: 081***456 or +62***456
        const cleanPhone = data.replace(/\D/g, ''); // Remove non-digits
        if (cleanPhone.length >= 6) {
          const start = cleanPhone.substring(0, 3);
          const end = cleanPhone.substring(cleanPhone.length - 3);
          const middle = '*'.repeat(3);
          return `${start}${middle}${end}`;
        }
        return data;
        
      default:
        return data;
    }
  };
  const [events, setEvents] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<PrizeType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  
  // Slot Machine States
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [currentPrize, setCurrentPrize] = useState<PrizeType | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState(() => ({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  }));
  
  // Winner Confirmation States
  const [tempWinner, setTempWinner] = useState<Winner | null>(null);
  const [tempPrize, setTempPrize] = useState<PrizeType | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  

  // Memoize resize handler to prevent unnecessary re-renders
  const handleResize = useCallback(() => {
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    fetchEvents();
    
    // Throttle resize events for better performance
    let resizeTimeout: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', throttledResize);
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(resizeTimeout);
    };
  }, [handleResize]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/api/admin/events');
      setEvents(response.data || []);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Gagal memuat data event');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrizes = async (eventId: number) => {
    try {
      const [prizesResponse, winnersResponse, eligibleResponse] = await Promise.all([
        api.get(`/api/admin/events/${eventId}/prizes`),
        api.get(`/api/admin/events/${eventId}/winners`),
        // CRITICAL: Ensure we get ALL eligible participants for fair drawing
        api.get(`/api/admin/events/${eventId}/prize_drawings/eligible_participants`, {
          params: {
            per_page: 10000, // Large number to get ALL participants
            page: 1,
            limit: 10000 // Alternative parameter name
          }
        })
      ]);
      
      const allPrizes = prizesResponse.data || [];
      const winnings = winnersResponse.data || [];
      
      // Handle different response formats for eligible participants
      let eligibleParticipants = [];
      if (eligibleResponse.data.participants) {
        eligibleParticipants = eligibleResponse.data.participants;
      } else if (Array.isArray(eligibleResponse.data)) {
        eligibleParticipants = eligibleResponse.data;
      } else {
        eligibleParticipants = [];
      }
      
      // CRITICAL DEBUG LOGGING
      console.log('=== PRIZE DRAWING FAIRNESS CHECK ===');
      console.log('🎁 All prizes fetched:', allPrizes.length);
      console.log('🏆 All winnings fetched:', winnings.length);
      console.log('👥 Eligible participants count:', eligibleParticipants.length);
      console.log('📄 Eligible participants response format:', eligibleResponse.data);
      
      // Check if we might have pagination
      if (eligibleResponse.data.pagination) {
        console.log('⚠️ PAGINATION DETECTED in eligible participants!');
        console.log('📊 Pagination info:', eligibleResponse.data.pagination);
        const totalCount = eligibleResponse.data.pagination.total_count || eligibleResponse.data.pagination.totalCount;
        console.log(`📈 Total eligible participants: ${totalCount}`);
        console.log(`📋 Current page size: ${eligibleParticipants.length}`);
        
        if (totalCount > eligibleParticipants.length) {
          console.error('🚨 CRITICAL: Not all eligible participants loaded! This affects fairness!');
          console.error(`🚨 Only ${eligibleParticipants.length} out of ${totalCount} participants loaded`);
          
          // Try to fetch ALL participants using a very large per_page value
          console.log('🔄 Attempting to fetch ALL eligible participants...');
          try {
            const allParticipantsResponse = await api.get(`/api/admin/events/${eventId}/prize_drawings/eligible_participants`, {
              params: {
                per_page: totalCount + 100, // Add buffer
                page: 1,
                limit: totalCount + 100
              }
            });
            
            let allEligibleParticipants = [];
            if (allParticipantsResponse.data.participants) {
              allEligibleParticipants = allParticipantsResponse.data.participants;
            } else if (Array.isArray(allParticipantsResponse.data)) {
              allEligibleParticipants = allParticipantsResponse.data;
            }
            
            if (allEligibleParticipants.length >= totalCount) {
              console.log(`✅ Successfully fetched all ${allEligibleParticipants.length} eligible participants`);
              eligibleParticipants = allEligibleParticipants;
              toast.success(`✅ Berhasil memuat semua ${allEligibleParticipants.length} peserta eligible - undian adil!`);
            } else {
              console.error(`🚨 Still only got ${allEligibleParticipants.length} out of ${totalCount} participants`);
              toast.error(`🚨 GAGAL: Hanya berhasil memuat ${allEligibleParticipants.length} dari ${totalCount} peserta! Undian TIDAK ADIL!`);
            }
          } catch (retryError) {
            console.error('🚨 Failed to fetch all participants on retry:', retryError);
            toast.error(`⚠️ PERINGATAN KRITIS: Hanya ${eligibleParticipants.length} dari ${totalCount} peserta yang dimuat! Undian mungkin tidak adil!`);
          }
        } else {
          console.log('✅ All eligible participants loaded successfully');
          toast.success(`✅ Semua ${eligibleParticipants.length} peserta eligible berhasil dimuat - undian adil!`);
        }
      } else {
        console.log('ℹ️ No pagination info - assuming all participants loaded');
      }
      
      // Log sample of participants for verification
      if (eligibleParticipants.length > 0) {
        console.log('📝 Sample participants (first 3):');
        eligibleParticipants.slice(0, 3).forEach((p: any, i: number) => {
          console.log(`  ${i + 1}. ${p.name} (${p.registrationNumber || p.registration_number})`);
        });
        
        if (eligibleParticipants.length > 3) {
          console.log(`  ... and ${eligibleParticipants.length - 3} more participants`);
        }
      }
      console.log('=== END FAIRNESS CHECK ===');
      
      // Add remaining quantity calculation to each prize
      const prizesWithRemainingCount = allPrizes.map((prize: PrizeType) => {
        const wonCount = winnings.filter((w: any) => w.prizeName === prize.name).length;
        const remainingQuantity = prize.quantity - wonCount;
        
        console.log(`Prize "${prize.name}": won ${wonCount}/${prize.quantity}, remaining: ${remainingQuantity}`);
        
        return {
          ...prize,
          remainingQuantity,
          wonCount
        };
      });
      
      // Filter prizes that still have remaining quantity AND have eligible participants
      const availablePrizes = prizesWithRemainingCount.filter((prize: PrizeType & { remainingQuantity: number; wonCount: number }) => {
        const hasRemainingQuantity = prize.remainingQuantity > 0;
        const hasEligibleParticipants = eligibleParticipants.length > 0;
        
        return hasRemainingQuantity && hasEligibleParticipants;
      });
      
      console.log('Available prizes after filtering:', availablePrizes);
      setPrizes(availablePrizes);
    } catch (err: any) {
      console.error('Error fetching prizes:', err);
      toast.error('Gagal memuat data hadiah');
    }
  };


  // Simple slot machine states - one state per reel showing the final digit
  const [slotDigits, setSlotDigits] = useState(['0', '0', '0', '0']);
  const [slotSpinning, setSlotSpinning] = useState([false, false, false, false]);

  // Start spinning animation
  const startSpinning = () => {
    setIsSpinning(true);
    setShowControls(false);
    
    // Set all reels to spinning
    setSlotSpinning([true, true, true, true]);
    setSlotDigits(['0', '0', '0', '0']); // Reset to zeros
  };

  // Stop reels one by one with delays - simplified approach
  const stopReels = (finalDigits: string[]) => {
    console.log('🎰 Final digits to display:', finalDigits);
    
    // Stop each reel with staggered timing - longer and more dramatic
    finalDigits.forEach((digit, index) => {
      const delay = 3500 + (index * 1000); // 3.5s base + 1s per reel
      
      setTimeout(() => {
        console.log(`🎯 Stopping reel ${index + 1} at digit: ${digit}`);
        
        setSlotSpinning(prev => {
          const newSpinning = [...prev];
          newSpinning[index] = false;
          return newSpinning;
        });
        
        setSlotDigits(prev => {
          const newDigits = [...prev];
          newDigits[index] = digit;
          return newDigits;
        });
      }, delay);
    });

    // Show winner after all reels stop
    const totalDuration = 3500 + (4 * 1000) + 1500;
    setTimeout(() => {
      console.log('🏆 All reels stopped, showing winner');
      setIsSpinning(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }, totalDuration);
  };

  const handleDrawWinner = async () => {
    if (!selectedEvent || !selectedPrize) {
      toast.error('Pilih event dan hadiah terlebih dahulu');
      return;
    }

    setIsDrawing(true);

    try {
      const prize = prizes.find(p => p.id === selectedPrize);
      if (!prize) {
        toast.error('Hadiah tidak ditemukan');
        return;
      }

      setCurrentPrize(prize);

      // Start slot machine animation
      startSpinning();

      // Make the preview draw request - use the prize ID as the resource ID
      const response = await api.post(`/api/admin/events/${selectedEvent}/prize_drawings/${selectedPrize}/preview_draw`);

      if (response.data.success) {
        const winnerData = response.data.winner;
        console.log('Raw winner data from backend:', winnerData);
        
        const winner: Winner = {
          id: winnerData.id,
          name: winnerData.name,
          registrationNumber: winnerData.registration_number || winnerData.registrationNumber,
          institution: winnerData.institution,
          email: winnerData.email,
          phoneNumber: winnerData.phone_number || winnerData.phoneNumber,
          nik: winnerData.nik
        };
        
        console.log('Mapped winner object:', winner);

        // Set temporary winner instead of current winner
        setTempWinner(winner);
        setTempPrize(prize);

        // Extract 4 digits from registration number for slot machine
        const regNumber = winner.registrationNumber || winner.id?.toString() || '0001';
        console.log('=== SLOT MACHINE DEBUG ===');
        console.log('Original registration number:', winner.registrationNumber);
        console.log('Using regNumber:', regNumber);
        
        // For formats like "E1-0001", we want the last 4 digits from the number part
        let digits: string[];
        
        // Check if it contains a dash and extract the part after dash
        if (regNumber.includes('-')) {
          const parts = regNumber.split('-');
          const numberPart = parts[parts.length - 1]; // Get last part after dash
          console.log('Number part after dash:', numberPart);
          
          // Remove any remaining non-digits and ensure 4 digits
          const cleanNumberPart = numberPart.replace(/\D/g, '');
          console.log('Clean number part:', cleanNumberPart);
          
          if (cleanNumberPart.length >= 4) {
            digits = cleanNumberPart.slice(-4).split('');
          } else {
            digits = cleanNumberPart.padStart(4, '0').split('');
          }
        } else {
          // Fallback for numbers without dash
          const cleanNumber = regNumber.toString().replace(/\D/g, '');
          console.log('Clean number (no dash):', cleanNumber);
          
          if (cleanNumber.length >= 4) {
            digits = cleanNumber.slice(-4).split('');
          } else {
            digits = cleanNumber.padStart(4, '0').split('');
          }
        }
        
        console.log('Final digits array for slot machine:', digits);
        console.log('Final digits as string:', digits.join(''));
        console.log('=== END DEBUG ===');
        
        // Set the winning digits and stop the reels
        stopReels(digits);

        toast.success('Pemenang telah dipilih! Silakan konfirmasi.');
        
        // Show confirmation dialog after slot animation completes
        setTimeout(() => {
          setShowConfirmation(true);
          // Trigger confetti when modal appears
          setShowConfetti(true);
          // Stop confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 5000);
        }, 8500); // Wait for longer slot animation to complete
      }
    } catch (error: any) {
      console.error('Error drawing winner:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Gagal mengundi hadiah';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        
        // Show details if available
        if (error.response.data.details) {
          const details = error.response.data.details;
          console.log('Error details:', details);
          errorMessage += `\n\nDetail: ${details.total_participants} peserta total, ${details.participants_already_won} sudah memenangkan ${details.prize_name}`;
        }
      } else if (error.response?.status === 404) {
        errorMessage = 'Event atau hadiah tidak ditemukan';
      } else if (error.response?.status === 401) {
        errorMessage = 'Tidak memiliki akses. Silakan login kembali.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Request tidak valid';
      }
      
      toast.error(errorMessage);
      setIsSpinning(false);
      setShowControls(true);
    } finally {
      setIsDrawing(false);
    }
  };

  const confirmWinner = async () => {
    if (!tempWinner || !tempPrize || !selectedEvent) return;
    
    setIsConfirming(true);
    try {
      const response = await api.post(
        `/api/admin/events/${selectedEvent}/prize_drawings/${tempPrize.id}/confirm_winner`,
        { participant_id: tempWinner.id }
      );
      
      if (response.data.success) {
        // Move temp winner to current winner
        setCurrentWinner(tempWinner);
        setCurrentPrize(tempPrize);
        
        // Clear temp states
        setTempWinner(null);
        setTempPrize(null);
        setShowConfirmation(false);
        
        toast.success('Pemenang berhasil dikonfirmasi!');
        
        // Trigger confetti celebration for confirmed winner
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        
        // Refresh prizes list to update remaining quantities
        if (selectedEvent) {
          fetchPrizes(selectedEvent);
        }
      }
    } catch (error: any) {
      console.error('Error confirming winner:', error);
      toast.error(error.response?.data?.error || 'Gagal mengkonfirmasi pemenang');
    } finally {
      setIsConfirming(false);
    }
  };

  const cancelWinner = () => {
    // Clear temp states without saving to database
    setTempWinner(null);
    setTempPrize(null);
    setShowConfirmation(false);
    setShowConfetti(false); // Stop confetti immediately
    
    toast('Undian dibatalkan. Silakan coba lagi.', { icon: 'ℹ️' });
    
    // Reset slot machine
    resetDraw();
  };

  const resetDraw = () => {
    setCurrentWinner(null);
    setCurrentPrize(null);
    setTempWinner(null);
    setTempPrize(null);
    setSlotDigits(['0', '0', '0', '0']);
    setSlotSpinning([false, false, false, false]);
    setIsSpinning(false);
    setShowControls(true);
    setShowConfetti(false);
    setShowConfirmation(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white text-xl">Memuat halaman undian...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-red-400 text-8xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-white mb-2">Error</h3>
          <p className="text-gray-300 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Enhanced Confetti Effect with higher z-index */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            initialVelocityY={25}
            initialVelocityX={5}
            colors={['#FFD700', '#FF6B35', '#F7931E', '#FFB900', '#FF0080', '#00D4FF', '#7B68EE', '#32CD32']}
            confettiSource={{
              x: 0,
              y: 0,
              w: windowDimensions.width,
              h: 0
            }}
          />
        </div>
      )}
      {/* Simplified Background - Reduced animation load */}
      {!isSpinning && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        </div>
      )}

      {/* Controls Toggle Button - Bottom Right, Always Visible */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur-sm text-white p-4 rounded-full hover:from-blue-400 hover:to-purple-500 transition-all shadow-2xl border-2 border-white/30 animate-pulse"
          title="Buka Panel Kontrol"
        >
          <Cog6ToothIcon className="h-7 w-7" />
        </button>
      )}

      {/* Control Panel - Slide in from right */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-black/40 backdrop-blur-lg border-l border-white/20 transform transition-transform duration-300 z-40 ${
        showControls ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/30 hover:scrollbar-thumb-white/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Panel Kontrol</h2>
            <button
              onClick={() => setShowControls(false)}
              className="text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full flex items-center space-x-2 text-white hover:text-yellow-300 transition-colors mb-6 p-3 rounded-lg hover:bg-white/10"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Kembali ke Dashboard</span>
          </button>

          {/* Event Selection */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">📅 Pilih Event</h3>
            <select
              value={selectedEvent || ''}
              onChange={(e) => {
                const eventId = Number(e.target.value) || null;
                setSelectedEvent(eventId);
                setSelectedPrize(null);
                if (eventId) {
                  fetchPrizes(eventId);
                }
              }}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Pilih Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id} className="text-black">
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prize Selection */}
          {selectedEvent && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">🎁 Pilih Hadiah</h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {prizes.length > 0 ? (
                  prizes.map((prize) => (
                    <div
                      key={prize.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPrize === prize.id
                          ? 'border-yellow-400 bg-yellow-400/20'
                          : 'border-white/30 hover:border-yellow-300 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedPrize(prize.id)}
                    >
                      <h4 className="font-semibold text-white text-sm">{prize.name}</h4>
                      <p className="text-xs text-gray-300 mb-1">{prize.description}</p>
                      <p className="text-xs text-green-300">Tersisa: {prize.remainingQuantity ?? prize.quantity} dari {prize.quantity} hadiah</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-4xl mb-2">🎁</div>
                    <p className="text-gray-300 text-sm">Tidak ada hadiah yang tersedia</p>
                    <p className="text-gray-400 text-xs">Semua hadiah sudah diundi atau peserta sudah menang</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Draw Button */}
          {selectedPrize && (
            <button
              onClick={handleDrawWinner}
              disabled={isDrawing || isSpinning}
              className={`w-full py-4 rounded-xl text-lg font-bold transition-all mb-4 ${
                isDrawing || isSpinning
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white shadow-xl'
              }`}
            >
              {isDrawing || isSpinning ? 'MENGUNDI...' : '🎰 MULAI UNDIAN!'}
            </button>
          )}

          {/* Reset Button */}
          {currentWinner && (
            <button
              onClick={resetDraw}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors mb-3"
            >
              🔄 Reset Undian
            </button>
          )}

        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col h-full">
        <div className="text-center w-full max-w-6xl mx-auto px-4 py-6 flex-1 overflow-y-auto">
          
          {/* Title */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-4 md:gap-8 mb-4">
              {/* Left Logo */}
              <img 
                src="/images/barsel-event.png" 
                alt="Barsel Event" 
                className="h-16 md:h-24 lg:h-32 w-auto object-contain"
                onError={(e) => {
                  console.error('Failed to load barsel-event.png');
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Title */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-wider">
                DRAWING
              </h1>
              
              {/* Right Logo */}
              <img 
                src="/images/barsel-logo.png" 
                alt="Barsel Logo" 
                className="h-16 md:h-24 lg:h-32 w-auto object-contain"
                onError={(e) => {
                  console.error('Failed to load barsel-logo.png');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            {currentPrize && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 mx-auto max-w-2xl">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-300 mb-2">{currentPrize.name}</h2>
                <p className="text-sm md:text-base lg:text-lg text-white">{currentPrize.description}</p>
              </div>
            )}
          </div>

          {/* 4 Slot Machines - Rebuilt for reliability */}
          <div className="flex justify-center gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="slot-reel">
                <div className="bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl border-4 border-yellow-300">
                  <div className="bg-black rounded-xl p-3 md:p-4 shadow-inner">
                    
                    {/* Simple Slot Display Window */}
                    <div className="slot-display w-16 md:w-20 lg:w-24 h-20 md:h-24 lg:h-28 bg-white rounded-lg border-4 border-gray-800 flex items-center justify-center relative overflow-hidden">
                      
                      {slotSpinning[index] ? (
                        /* Spinning Animation */
                        <div className="spinning-numbers absolute inset-0 flex flex-col">
                          {Array.from({ length: 20 }, (_, i) => (
                            <div
                              key={i}
                              className="number-item h-5 md:h-6 lg:h-7 flex items-center justify-center text-lg md:text-xl lg:text-2xl font-bold text-gray-900 drop-shadow-md"
                            >
                              {i % 10}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Final Number Display */
                        <div className="final-number text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 drop-shadow-lg animate-pulse">
                          {slotDigits[index]}
                        </div>
                      )}
                      
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs md:text-sm font-bold text-white">DIGIT {index + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Number Display */}
          <div className="mb-6 md:mb-8">
            <div className="bg-black/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 inline-block">
              <div className="text-white text-sm md:text-base lg:text-lg mb-2">NOMOR PEMENANG:</div>
              <div className="text-3xl md:text-4xl lg:text-6xl font-mono font-bold text-yellow-400 tracking-widest">
                {slotDigits.join('')}
              </div>
            </div>
          </div>

          {/* Status Display */}
          {isSpinning && (
            <div className="bg-red-500/80 backdrop-blur-sm text-white px-6 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl inline-block border-2 md:border-4 border-red-300 shadow-2xl animate-pulse">
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold">🎲 SEDANG MENGUNDI... 🎲</span>
            </div>
          )}


          {/* Winner Confirmation Dialog */}
          {showConfirmation && tempWinner && tempPrize && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 md:p-8 max-w-md w-full border-4 border-yellow-300 shadow-2xl relative z-[61]">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Konfirmasi Pemenang</h2>
                  
                  <div className="bg-white/20 rounded-xl p-4 mb-6 text-left">
                    <div className="text-yellow-300 font-bold text-lg mb-3">{tempWinner.name}</div>
                    <div className="text-white text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-200">🆔</span>
                        <span className="font-mono">{censorData(tempWinner.nik, 'nik')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-200">📍</span>
                        <span>{tempWinner.institution}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-200">🎫</span>
                        <span className="font-bold">{tempWinner.registrationNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-200">📧</span>
                        <span>{censorData(tempWinner.email, 'email')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-200">📱</span>
                        <span>{censorData(tempWinner.phoneNumber, 'phone')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-400/20 rounded-xl p-4 mb-6 border-2 border-yellow-300">
                    <div className="text-yellow-300 font-bold mb-1">Hadiah:</div>
                    <div className="text-white font-bold text-lg">{tempPrize.name}</div>
                    <div className="text-yellow-100 text-sm">{tempPrize.description}</div>
                  </div>
                  
                  <div className="text-white text-sm mb-6">
                    Apakah pemenang hadir dan memenuhi syarat untuk menerima hadiah?
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={confirmWinner}
                      disabled={isConfirming}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-6 rounded-xl font-bold transition-all"
                    >
                      {isConfirming ? 'Mengkonfirmasi...' : '✅ TERIMA'}
                    </button>
                    <button
                      onClick={cancelWinner}
                      disabled={isConfirming}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-6 rounded-xl font-bold transition-all"
                    >
                      ❌ BATAL
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-300 mt-4">
                    Alasan pembatalan: Peserta tidak hadir, kupon tidak valid, dll.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Winner Display - Inline below slot machine */}
          {currentWinner && !isSpinning && (
            <div className="winner-info-section mt-8 mb-8">
              <div className="bg-gradient-to-r from-green-500 to-green-600 backdrop-blur-sm text-white p-4 md:p-6 rounded-2xl border-4 border-green-300 shadow-2xl max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-bold mb-4 text-yellow-300">🎉 SELAMAT PEMENANG! 🎉</div>
                  
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
                    {/* Winner Info */}
                    <div className="space-y-2 md:space-y-3">
                      <div className="text-xl md:text-2xl font-bold text-yellow-300">
                        {currentWinner.name}
                      </div>
                      <div className="text-sm md:text-base text-green-100 font-mono">
                        NIK: {censorData(currentWinner.nik, 'nik')}
                      </div>
                      <div className="text-base md:text-lg text-green-100">{currentWinner.institution}</div>
                      <div className="bg-white/20 rounded-lg px-3 md:px-4 py-2 backdrop-blur-sm">
                        <div className="text-xs md:text-sm text-green-100">Nomor Kupon:</div>
                        <div className="text-lg md:text-xl font-mono font-bold">
                          {currentWinner.registrationNumber}
                        </div>
                      </div>
                    </div>
                    
                    {/* Prize Info */}
                    <div className="bg-yellow-400/20 rounded-xl p-3 md:p-4 border-2 border-yellow-300">
                      <div className="text-base md:text-lg text-yellow-200 mb-2">Hadiah yang Dimenangkan:</div>
                      <div className="text-lg md:text-2xl text-yellow-300 font-bold">
                        {currentPrize?.name}
                      </div>
                      <div className="text-xs md:text-sm text-yellow-100 mt-1">
                        {currentPrize?.description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!currentWinner && !isSpinning && (
            <div className="text-white text-base md:text-lg lg:text-xl opacity-70 px-4">
              {!selectedEvent || !selectedPrize ? 
                "Buka panel kontrol (⚙️) untuk memilih event dan hadiah" :
                "Klik tombol 'MULAI UNDIAN' untuk memulai!"
              }
            </div>
          )}

        </div>
      </div>

      {/* CSS for slot machine animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spinNumbers {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-100px); }
          }
          
          .spinning-numbers {
            animation: spinNumbers 0.1s linear infinite;
            will-change: transform;
          }
          
          .slot-display {
            contain: layout style paint;
          }
          
          /* Custom scrollbar styles */
          .scrollbar-thin {
            scrollbar-width: thin;
          }
          
          .scrollbar-thin::-webkit-scrollbar {
            width: 8px;
          }
          
          .scrollbar-track-transparent::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .scrollbar-thumb-white\\/30::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }
          
          .hover\\:scrollbar-thumb-white\\/50:hover::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.5);
          }
          
          .digit {
            user-select: none;
            position: relative;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(50px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          .winner-announcement {
            animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .animate-fade-in {
            animation: fadeIn 1s ease-in-out;
          }
          
          @keyframes sparkle {
            0%, 100% {
              transform: scale(1) rotate(0deg);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.2) rotate(180deg);
              opacity: 1;
            }
          }
          
          .winner-announcement .absolute {
            animation: sparkle 2s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
};

export default PrizeDrawing;