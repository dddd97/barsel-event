import React, { useState, useEffect, useRef, useCallback } from 'react';

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

interface Prize {
  id: number;
  name: string;
  category: string;
}

interface SlotMachineProps {
  isSpinning: boolean;
  winner: Winner | null;
  prize: Prize | null;
  slotAnimation: SlotAnimationData | null;
  onSpinComplete?: () => void;
  className?: string;
}

const SlotMachine: React.FC<SlotMachineProps> = ({
  isSpinning,
  winner,
  prize,
  slotAnimation,
  onSpinComplete,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [stoppedReels, setStoppedReels] = useState<boolean[]>([false, false, false, false, false]);
  const [animationWinner, setAnimationWinner] = useState<Winner | null>(null);
  
  const reel1Ref = useRef<HTMLDivElement>(null);
  const reel2Ref = useRef<HTMLDivElement>(null);
  const reel3Ref = useRef<HTMLDivElement>(null);
  const reel4Ref = useRef<HTMLDivElement>(null);
  const reel5Ref = useRef<HTMLDivElement>(null);
  
  const reelRefs = [reel1Ref, reel2Ref, reel3Ref, reel4Ref, reel5Ref];
  const spinningIntervals = useRef<NodeJS.Timeout[]>([]);
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);
  


  // Reset function
  const resetAnimation = useCallback(() => {
    setIsAnimating(false);
    setShowWinner(false);
    setStoppedReels([false, false, false, false, false]);
    
    // Clear all intervals and timeouts
    spinningIntervals.current.forEach(interval => clearInterval(interval));
    animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    spinningIntervals.current = [];
    animationTimeouts.current = [];
    
    // Reset reel positions
    reelRefs.forEach(ref => {
      if (ref.current) {
        ref.current.style.transition = 'none';
        ref.current.style.transform = 'translateY(0px)';
      }
    });
  }, []);

  useEffect(() => {
    console.log('SlotMachine useEffect:', { 
      isSpinning, 
      hasSlotAnimation: !!slotAnimation, 
      hasWinner: !!winner,
      slotAnimationKeys: slotAnimation ? Object.keys(slotAnimation) : null
    });
    
    if (isSpinning && slotAnimation && winner) {
      resetAnimation();
      // Add a small delay to ensure refs are ready
      setTimeout(() => {
        startSlotAnimation();
      }, 100);
    } else if (!isSpinning) {
      resetAnimation();
    }
    
    // Cleanup on unmount
    return () => {
      resetAnimation();
    };
  }, [isSpinning, slotAnimation, winner, resetAnimation]);

  const startSlotAnimation = async () => {
    console.log('startSlotAnimation called:', { slotAnimation: !!slotAnimation, winner: !!winner, animationWinner: !!animationWinner });
    const currentWinner = animationWinner || winner;
    if (!slotAnimation || !currentWinner) {
      console.log('Early return from startSlotAnimation');
      return;
    }
    
    setAnimationWinner(currentWinner); // Store winner for animation
    setIsAnimating(true);
    setShowWinner(false);
    
    console.log('Starting slot animation for winner:', currentWinner?.registrationNumber);
    
    // Start spinning all reels with proper intervals
    reelRefs.forEach((ref, index) => {
      if (ref.current) {
        startReelSpinning(ref.current, index);
      }
    });

    // Calculate proper delays - make sure we have 5 delays for 5 reels
    const delays = slotAnimation.reelDelays || [1000, 2000, 3000, 4000, 5000];
    
    // Stop reels one by one with proper delays
    delays.forEach((delay, index) => {
      const timeout = setTimeout(() => {
        stopReel(index);
      }, delay);
      animationTimeouts.current.push(timeout);
    });

    // Show winner after all reels have stopped
    const finalTimeout = setTimeout(() => {
      console.log('All reels stopped, showing winner');
      console.log('Setting showWinner to true');
      setShowWinner(true);
      setIsAnimating(false);
      // Don't clear animationWinner to keep slot machine visible
      // setAnimationWinner(null); // Clear animation winner
      onSpinComplete?.();
    }, Math.max(...delays) + 2000); // Extra time for stopping animation
    
    animationTimeouts.current.push(finalTimeout);
  };

  const startReelSpinning = useCallback((element: HTMLElement, reelIndex: number) => {
    let position = 0;
    const itemHeight = 80;
    const reelData = getReelData(reelIndex);
    
    if (reelData.length === 0) return;
    
    element.style.transition = 'none';
    
    const interval = setInterval(() => {
      position -= itemHeight;
      // Reset position when we've scrolled through all items
      if (Math.abs(position) >= reelData.length * itemHeight) {
        position = 0;
      }
      element.style.transform = `translateY(${position}px)`;
    }, 100); // Spin speed
    
    spinningIntervals.current[reelIndex] = interval;
  }, []);

  const stopReel = useCallback((reelIndex: number) => {
    // Validate reelIndex
    if (reelIndex < 0 || reelIndex >= reelRefs.length) {
      console.error(`Invalid reelIndex: ${reelIndex}, reelRefs.length: ${reelRefs.length}`);
      return;
    }
    
    const ref = reelRefs[reelIndex];
    if (!ref) {
      console.error(`reelRefs[${reelIndex}] is undefined`);
      return;
    }
    
    // Use animationWinner instead of winner to avoid timing issues
    const currentWinner = animationWinner || winner;
    if (!ref.current || stoppedReels[reelIndex]) {
      console.log(`Early return: ref.current=${!!ref.current}, stoppedReels[${reelIndex}]=${stoppedReels[reelIndex]}`);
      return;
    }
    
    console.log(`Stopping reel ${reelIndex} with currentWinner:`, currentWinner);
    
    // Clear the spinning interval
    if (spinningIntervals.current[reelIndex]) {
      clearInterval(spinningIntervals.current[reelIndex]);
    }
    
    // Mark this reel as stopped
    setStoppedReels(prev => {
      const newStoppedReels = [...prev];
      newStoppedReels[reelIndex] = true;
      return newStoppedReels;
    });

    // Calculate final position to show the correct digit
    const itemHeight = 80;
    // Remove dashes and get only alphanumeric characters
    const cleanNumber = currentWinner?.registrationNumber?.replace(/-/g, '') || '';
    const targetDigit = cleanNumber[reelIndex] || '0';
    const reelData = getReelData(reelIndex);
    let targetIndex = reelData.findIndex(item => item === targetDigit);
    
    // If digit not found, add it to position 2 (middle visible position)
    if (targetIndex === -1) {
      targetIndex = 2;
    }
    
    // Calculate position to show target digit in the middle window
    const finalPosition = -(targetIndex * itemHeight) + (itemHeight * 1); // Offset to center in window
    
    // Apply smooth stopping animation
    ref.current.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
    ref.current.style.transform = `translateY(${finalPosition}px)`;
    
    // Add winner highlight after animation
    setTimeout(() => {
      if (ref.current) {
        ref.current.classList.add('winner-highlight');
      }
    }, 800);
  }, [reelRefs, winner, animationWinner, stoppedReels]);

  const getReelData = (reelIndex: number): string[] => {
    console.log('getReelData called with reelIndex:', reelIndex, 'slotAnimation:', slotAnimation);
    if (!slotAnimation) {
      console.warn('slotAnimation is null in getReelData');
      return Array.from({ length: 20 }, (_, i) => (i % 10).toString());
    }
    
    const reelKey = `reel${reelIndex + 1}` as keyof SlotAnimationData;
    let reel = slotAnimation[reelKey] as string[];
    
    if (!reel || reel.length === 0) {
      console.warn(`reel${reelIndex + 1} is empty, using default data`);
      // Generate default reel data if not provided
      reel = Array.from({ length: 20 }, (_, i) => (i % 10).toString());
    }
    
    // Ensure winner's digit is in the reel at position 2 (middle)
    const currentWinner = animationWinner || winner;
    if (currentWinner?.registrationNumber) {
      // Remove dashes and get only alphanumeric characters
      const cleanNumber = currentWinner.registrationNumber.replace(/-/g, '');
      if (cleanNumber[reelIndex]) {
        const winnerDigit = cleanNumber[reelIndex];
        const modifiedReel = [...reel];
        modifiedReel[2] = winnerDigit; // Position that will be visible when stopped
        return modifiedReel;
      }
    }
    
    return reel;
  };

  // Generate registration number display
  const getDisplayDigits = () => {
    const currentWinner = animationWinner || winner;
    if (!currentWinner?.registrationNumber) return ['?', '?', '?', '?', '?'];
    
    // Remove dashes and get only alphanumeric characters
    const cleanNumber = currentWinner.registrationNumber.replace(/-/g, '');
    const digits = cleanNumber.split('');
    
    // Pad with zeros if needed
    while (digits.length < 5) {
      digits.unshift('0');
    }
    return digits.slice(0, 5);
  };

  return (
    <div className={`slot-machine ${className}`}>
      <style>{`
        .slot-machine {
          font-family: 'Arial Black', Arial, sans-serif;
        }
        
        .reel-container {
          position: relative;
        }
        
        .reel-window {
          position: relative;
          width: 80px;
          height: 240px;
          background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
          border: 4px solid #343a40;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 
            inset 0 0 20px rgba(0, 0, 0, 0.3),
            0 0 15px rgba(0, 0, 0, 0.2);
        }
        
        .reel-window::before {
          content: '';
          position: absolute;
          top: 80px;
          left: 0;
          right: 0;
          height: 80px;
          border: 3px solid #dc2626;
          border-left: none;
          border-right: none;
          background: rgba(220, 38, 38, 0.1);
          z-index: 10;
          pointer-events: none;
        }
        
        .reel-strip {
          position: relative;
          transition: none;
        }
        
        .winner-highlight {
          filter: drop-shadow(0 0 10px #22c55e);
        }
        
        .slot-item {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 900;
          color: #1f2937;
          background: linear-gradient(to bottom, #ffffff, #f3f4f6);
          border-bottom: 2px solid #e5e7eb;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0.7; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(180deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-15px); }
          70% { transform: translateY(-7px); }
          90% { transform: translateY(-3px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        
        @keyframes winnerGlow {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
            border-color: #22c55e;
          }
          50% { 
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
            border-color: #16a34a;
          }
        }
      `}</style>
      
      <div className="relative bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl p-8 shadow-2xl border-4 border-yellow-300">
        
        {/* Background Effects */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-60"
          style={{
            background: 'linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.4), transparent)',
            animation: 'sparkle 3s ease-in-out infinite'
          }}
        />
        
        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <h2 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            🎰 UNDIAN BERHADIAH 🎰
          </h2>
          {prize && (
            <div className="bg-white/95 rounded-lg p-4 mx-4 shadow-lg">
              <p className="text-2xl font-bold text-gray-800">{prize.name}</p>
              <p className="text-sm text-gray-600 uppercase tracking-wide font-semibold">{prize.category}</p>
            </div>
          )}
        </div>

        {/* Slot Reels */}
        <div className="relative bg-gray-800 rounded-xl p-6 shadow-inner border-4 border-gray-600">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3, 4].map((reelIndex) => (
              <div key={reelIndex} className="reel-container">
                <div className="reel-window">
                  <div 
                    ref={reelRefs[reelIndex]}
                    className="reel-strip"
                    data-reel-index={reelIndex}
                  >
                    {getReelData(reelIndex).map((digit, index) => (
                      <div
                        key={`${digit}-${index}-${reelIndex}`}
                        className="slot-item"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Reel Position Labels */}
                <div className="text-center mt-2">
                  <span className="text-sm font-bold text-white drop-shadow">
                    POS {reelIndex + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Current Number Display */}
          <div className="mt-4 text-center">
            <div className="text-white text-lg font-semibold mb-2">Nomor Kupon:</div>
            <div className="bg-black/50 rounded-lg px-4 py-2 inline-block">
              <span className="text-yellow-400 text-2xl font-mono font-bold tracking-wider">
                {getDisplayDigits().join('')}
              </span>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="mt-6 text-center relative z-10">
          {isAnimating && (
            <div 
              className="bg-red-500 text-white px-8 py-4 rounded-full inline-block border-4 border-red-300 shadow-xl"
              style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
            >
              <span className="text-2xl font-bold">🎲 SEDANG MENGUNDI... 🎲</span>
            </div>
          )}
          
          {/* Debug info */}
          <div className="text-white text-xs mb-2">
            Debug: showWinner={showWinner.toString()}, isAnimating={isAnimating.toString()}, hasWinner={!!(animationWinner || winner)}
          </div>
          
          {showWinner && (animationWinner || winner) && !isAnimating && (
            <div 
              className="bg-green-500 text-white p-8 rounded-3xl border-4 border-green-300 shadow-2xl relative z-20"
              style={{ animation: 'winnerGlow 2s ease-in-out infinite' }}
            >
              <div className="text-5xl font-bold mb-4">🎉 SELAMAT! 🎉</div>
              <div className="text-4xl font-bold mb-3 text-yellow-300">{(animationWinner || winner)?.name}</div>
              <div className="text-2xl mb-3 font-mono bg-white/20 rounded-lg px-4 py-2 inline-block">
                Kupon: {(animationWinner || winner)?.registrationNumber}
              </div>
              <div className="text-xl text-green-100 mb-4">{(animationWinner || winner)?.institution}</div>
              <div className="text-2xl text-yellow-300 font-semibold">
                Memenangkan: {prize?.name}
              </div>
              
              {/* Confetti effect */}
              <div className="absolute -top-4 -left-4 text-3xl animate-bounce">🎊</div>
              <div className="absolute -top-4 -right-4 text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎊</div>
              <div className="absolute -bottom-4 -left-4 text-3xl animate-bounce" style={{ animationDelay: '1s' }}>🎊</div>
              <div className="absolute -bottom-4 -right-4 text-3xl animate-bounce" style={{ animationDelay: '1.5s' }}>🎊</div>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div 
          className="absolute top-6 left-6 text-4xl"
          style={{ animation: 'sparkle 4s linear infinite' }}
        >
          ⭐
        </div>
        <div 
          className="absolute top-6 right-6 text-4xl"
          style={{ animation: 'sparkle 4s linear infinite reverse' }}
        >
          ⭐
        </div>
        <div 
          className="absolute bottom-6 left-6 text-4xl"
          style={{ animation: 'bounce 3s infinite' }}
        >
          💎
        </div>
        <div 
          className="absolute bottom-6 right-6 text-4xl"
          style={{ animation: 'bounce 3s infinite 0.5s' }}
        >
          💎
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;