import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../types/event';
import { 
  ArrowRightIcon, 
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface EventHeroProps {
  events: Event[];
}

const placeholder = '/images/event-placeholder.jpg';

export const EventHero: React.FC<EventHeroProps> = ({ events }) => {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mainEvents = events.filter(e => e.category === 'utama').slice(0, 3);

  // Smooth slide transition function
  const slideToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev + 1) % mainEvents.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const slideToPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev - 1 + mainEvents.length) % mainEvents.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const slideToIndex = (index: number) => {
    if (isTransitioning || index === current) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying || mainEvents.length <= 1 || isTransitioning) return;
    
    const interval = setInterval(() => {
      slideToNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, mainEvents.length, isTransitioning]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    slideToNext();
  };
  
  const prevSlide = () => {
    setIsAutoPlaying(false);
    slideToPrev();
  };

  if (mainEvents.length === 0) {
    return (
      <section className="relative h-[70vh] sm:min-h-[600px] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden mt-16">
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-20 flex items-center justify-center h-full">
          <div className="text-center text-white px-4">
            <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-yellow-400" />
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent leading-tight">
              Event Terbaru Segera Hadir
            </h1>
            <p className="text-lg sm:text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
              Pantau terus website ini untuk mendapatkan informasi event terbaru dan menarik dari kami.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const event = mainEvents[current];
  
  // Safety check: if no event at current index, fallback to first event or return early
  if (!event && mainEvents.length > 0) {
    setCurrent(0);
    return null;
  }
  
  if (!event) {
    // Return empty state if no events at all
    return (
      <section className="relative h-[70vh] sm:min-h-[600px] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden mt-16">
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-20 flex items-center justify-center h-full">
          <div className="text-center text-white px-4">
            <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-yellow-400" />
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent leading-tight">
              Event Terbaru Segera Hadir
            </h1>
            <p className="text-lg sm:text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
              Pantau terus website ini untuk mendapatkan informasi event terbaru dan menarik dari kami.
            </p>
          </div>
        </div>
      </section>
    );
  }
  
  // const banner = event.bannerUrl || placeholder; // Unused variable

  const formatEventDate = (dateString: string) => {
    if (!dateString) return 'Tanggal belum ditentukan';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatStartTime = (timeString: string) => {
    if (!timeString) return null;
    try {
      // Handle different time formats
      let time;
      if (timeString.includes('T')) {
        // Full datetime format
        time = new Date(timeString);
      } else {
        // Time only format (HH:mm:ss)
        time = new Date(`2000-01-01T${timeString}`);
      }
      
      if (isNaN(time.getTime())) return timeString;
      
      return time.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return timeString;
    }
  };

  const getRegistrationStatus = (event: Event) => {
    if (event.registrationStatus === 'Pendaftaran dibuka') {
      return {
        text: 'Pendaftaran Dibuka',
        className: 'bg-green-500 text-white',
        icon: '🟢'
      };
    } else {
      return {
        text: 'Pendaftaran Ditutup',
        className: 'bg-gray-500 text-white',
        icon: '🔴'
      };
    }
  };

  const status = getRegistrationStatus(event);

  return (
    <section className="relative h-[70vh] sm:min-h-[600px] lg:min-h-[700px] overflow-hidden mt-16">
      {/* Background Images with Smooth Transitions */}
      <div className="absolute inset-0 overflow-hidden">
        {mainEvents.map((slideEvent, index) => {
          if (!slideEvent) return null;
          
          const slideBanner = slideEvent.bannerUrl || placeholder;
          const isActive = index === current;
          const isPrev = index === (current - 1 + mainEvents.length) % mainEvents.length;
          const isNext = index === (current + 1) % mainEvents.length;
          
          return (
            <div
              key={`slide-${slideEvent.id}-${index}`}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                isActive 
                  ? 'opacity-100 scale-100 z-10' 
                  : isPrev 
                  ? 'opacity-0 scale-105 -translate-x-full z-5'
                  : isNext
                  ? 'opacity-0 scale-105 translate-x-full z-5'
                  : 'opacity-0 scale-110 z-0'
              }`}
            >
              <img
                src={slideBanner}
                alt={slideEvent.name || 'Event Banner'}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out"
                style={{ 
                  filter: 'brightness(0.6) contrast(1.1)',
                  objectPosition: 'center 30%',
                  objectFit: 'cover',
                  transform: isActive ? 'scale(1)' : 'scale(1.05)'
                }}
                loading={index === current ? 'eager' : 'lazy'}
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Prevent infinite loops by checking if we're already showing placeholder
                  if (!target.src.includes('event-placeholder.jpg')) {
                    target.src = placeholder;
                  } else {
                    // If placeholder also fails, hide image
                    target.style.display = 'none';
                  }
                }}
              />
            </div>
          );
        })}
        
        {/* Enhanced Gradient Overlays with Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/70 to-transparent z-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10 z-15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3)_0%,transparent_50%)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.2)_0%,transparent_50%)] animate-pulse delay-1000"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(99,102,241,0.2)_0%,transparent_50%)] animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Floating Elements - Hidden on mobile for better performance */}
      <div className="hidden sm:block absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="hidden sm:block absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>

      {/* Main Content */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-16 lg:py-20 flex items-center h-full">
        <div className={`max-w-4xl w-full transition-all duration-800 ease-out ${
          isTransitioning ? 'opacity-50 transform translate-y-4' : 'opacity-100 transform translate-y-0'
        }`}>
          {/* Event Category Badge */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <span className="inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-xs sm:text-sm rounded-full shadow-lg">
              <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Event Utama
            </span>
            <span className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${status.className}`}>
              <span className="mr-1">{status.icon}</span>
              {status.text}
            </span>
          </div>

          {/* Event Title */}
          <h1 className="text-xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-6 text-white leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
              {event.name || 'Event Tanpa Judul'}
            </span>
          </h1>

          {/* Event Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3 text-blue-100">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-300 uppercase tracking-wide">Tanggal & Waktu</p>
                <p className="font-semibold text-sm sm:text-base">{formatEventDate(event.eventDate)}</p>
                {event.startTime && formatStartTime(event.startTime) && (
                  <p className="text-xs text-blue-200">{formatStartTime(event.startTime)} WIB</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 text-blue-100">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-300 uppercase tracking-wide">Lokasi</p>
                <p className="font-semibold text-sm sm:text-base">{event.location || 'Lokasi belum ditentukan'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 text-blue-100 sm:col-span-2 md:col-span-1">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-300 uppercase tracking-wide">Peserta</p>
                <p className="font-semibold text-sm sm:text-base">
                  {event.participantsCount || 0}
                  {event.maxParticipants && ` / ${event.maxParticipants}`}
                </p>
              </div>
            </div>
          </div>

          {/* Event Description */}
          <p className="text-sm sm:text-lg md:text-xl text-blue-100 mb-4 sm:mb-8 leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-none">
            {event.description || 'Deskripsi event belum tersedia.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Link
              to={`/events/${event.id}`}
              className="group inline-flex items-center justify-center px-4 sm:px-8 py-2 sm:py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-sm sm:text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Lihat Detail Event
              <ArrowRightIcon className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {status.text === 'Pendaftaran Dibuka' && (
              <Link
                to={`/events/${event.id}/register`}
                className="inline-flex items-center justify-center px-4 sm:px-8 py-2 sm:py-4 bg-white/20 text-white font-semibold text-sm sm:text-lg rounded-xl border-2 border-white/30 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
              >
                Daftar Sekarang
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Slider Navigation */}
      {mainEvents.length > 1 && (
        <>
          {/* Enhanced Dots Indicator */}
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-30">
            {mainEvents.map((_, idx) => (
              <button
                key={idx}
                className={`relative w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-500 ease-out ${
                  idx === current 
                    ? 'bg-yellow-400 scale-125 shadow-lg shadow-yellow-400/50' 
                    : 'bg-white/40 hover:bg-white/70 hover:scale-110'
                } ${isTransitioning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => {
                  if (!isTransitioning) {
                    setIsAutoPlaying(false);
                    slideToIndex(idx);
                  }
                }}
                disabled={isTransitioning}
                aria-label={`Go to slide ${idx + 1}`}
              >
                {/* Active indicator ring */}
                {idx === current && (
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-300 animate-ping opacity-75"></div>
                )}
                
                {/* Progress ring for active slide */}
                {idx === current && isAutoPlaying && (
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-300">
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-300 animate-spin opacity-60"></div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Enhanced Arrow Navigation */}
          <button
            className={`hidden sm:block absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-black/20 hover:bg-black/40 text-white rounded-full shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-110 group z-30 ${
              isTransitioning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            onClick={prevSlide}
            disabled={isTransitioning}
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7 mx-auto transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          </button>
          
          <button
            className={`hidden sm:block absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-black/20 hover:bg-black/40 text-white rounded-full shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-110 group z-30 ${
              isTransitioning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            onClick={nextSlide}
            disabled={isTransitioning}
            aria-label="Next slide"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7 mx-auto transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          </button>
        </>
      )}

      {/* Enhanced Auto-play Control */}
      {mainEvents.length > 1 && (
        <button
          className={`hidden sm:block absolute top-4 sm:top-6 right-4 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 text-white rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 group z-30 ${
            isAutoPlaying 
              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30' 
              : 'bg-white/10 hover:bg-white/20 border border-white/20'
          }`}
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          <div className="relative">
            {isAutoPlaying ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
            
            {/* Pulsing indicator when playing */}
            {isAutoPlaying && (
              <div className="absolute inset-0 rounded-full border border-yellow-400 animate-ping opacity-40"></div>
            )}
          </div>
        </button>
      )}
    </section>
  );
};

export default EventHero; 