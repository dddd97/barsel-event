import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import api from '../lib/axios';
import type { Event } from '../types/event';
import type { Prize } from '../types/prize';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  GiftIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  StarIcon,
  TrophyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { CategoryBadge } from '../components/CategoryBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pendaftaran dibuka':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        ring: 'ring-emerald-600/20',
        icon: CheckCircleIcon,
      };
    case 'Pendaftaran akan dibuka':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        ring: 'ring-amber-600/20',
        icon: ClockIcon,
      };
    default:
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        ring: 'ring-rose-600/20',
        icon: XCircleIcon,
      };
  }
};

export const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickingButton, setClickingButton] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const [eventResponse, prizesResponse] = await Promise.all([
          api.get<Event>(`/api/events/${id}`),
          api.get(`/api/events/${id}/prizes`)
        ]);

        setEvent(eventResponse.data);
        setPrizes(Array.isArray(prizesResponse.data) ? prizesResponse.data : []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch event details. Please try again later.');
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pt-16">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="animate-pulse">
            {/* Back button skeleton */}
            <div className="mb-8">
              <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
            </div>

            {/* Header section skeleton */}
            <div className="mb-12 text-center">
              <div className="h-12 bg-gray-200 rounded w-2/3 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
              
              {/* Status badge skeleton */}
              <div className="flex justify-center mb-8">
                <div className="h-8 bg-gray-200 rounded-full w-40"></div>
              </div>
            </div>

            {/* Main content grid skeleton */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {/* Left column - Event details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Event info card skeleton */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                          <div className="h-6 bg-gray-200 rounded w-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description skeleton */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>

                {/* Prizes skeleton */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="h-8 w-8 bg-gray-200 rounded mr-3"></div>
                          <div className="h-6 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column - Registration card skeleton */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-white rounded-2xl shadow-lg p-8">
                  <div className="h-8 bg-gray-200 rounded w-2/3 mb-6"></div>
                  
                  {/* Progress bar skeleton */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full"></div>
                  </div>

                  {/* Stats skeleton */}
                  <div className="space-y-4 mb-8">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>

                  {/* Buttons skeleton */}
                  <div className="space-y-3">
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 shadow-inner">
            <XCircleIcon className="h-8 w-8 text-rose-600" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-rose-800">Oops! Terjadi Kesalahan</h3>
          <p className="mt-2 text-rose-600">
            {error || 'Event tidak ditemukan'}
          </p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-rose-700 shadow-md transition-all hover:bg-rose-50 hover:shadow-lg"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Kembali ke Daftar Event
          </Link>
        </div>
      </div>
    );
  }

  const percentage = event.maxParticipants
    ? Math.round((event.participantsCount / event.maxParticipants) * 100)
    : 0;

  const statusColors = getStatusColor(event.registrationStatus);
  const StatusIcon = statusColors.icon;

  const handleButtonClick = (buttonType: string) => {
    setClickingButton(buttonType);
    // Reset after navigation delay - increased for better UX
    setTimeout(() => setClickingButton(null), 2500);
  };

  // Separate prizes by category
  const mainPrizes = prizes.filter(prize => prize.category === 'utama');
  const regularPrizes = prizes.filter(prize => prize.category === 'reguler');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pt-16 relative overflow-hidden animate-fade-in-up">
      {/* Enhanced Animated Background Light Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Floating lights with different animations */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float-slow"></div>
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-gradient-to-r from-pink-200 to-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-float-medium" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-gradient-to-r from-green-200 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-fast" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-10 right-1/3 w-64 h-64 bg-gradient-to-r from-orange-200 to-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float-slow" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-2/3 left-1/2 w-56 h-56 bg-gradient-to-r from-indigo-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-float-medium" style={{animationDelay: '4s'}}></div>
        
        {/* Additional sparkle effects */}
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-twinkle"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-25 animate-twinkle" style={{animationDelay: '2.5s'}}></div>
      </div>
      
      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-slow {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
            50% { transform: translate(-20px, -30px) scale(1.1); opacity: 0.6; }
          }
          
          @keyframes float-medium {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
            33% { transform: translate(15px, -25px) scale(1.05); opacity: 0.5; }
            66% { transform: translate(-10px, 20px) scale(0.95); opacity: 0.45; }
          }
          
          @keyframes float-fast {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
            25% { transform: translate(20px, -15px) scale(1.1); opacity: 0.4; }
            50% { transform: translate(-15px, -20px) scale(0.9); opacity: 0.5; }
            75% { transform: translate(10px, 15px) scale(1.05); opacity: 0.35; }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
          }
          
          .animate-float-slow {
            animation: float-slow 12s ease-in-out infinite;
          }
          
          .animate-float-medium {
            animation: float-medium 8s ease-in-out infinite;
          }
          
          .animate-float-fast {
            animation: float-fast 6s ease-in-out infinite;
          }
          
          .animate-twinkle {
            animation: twinkle 4s ease-in-out infinite;
          }
        `
      }} />
      {/* Hero Banner - Mobile Optimized */}
      <div className="relative w-full bg-gray-900 h-[50vh] sm:h-[60vh] lg:h-[70vh] z-10">
        {event.bannerUrl ? (
          <>
            <img
              src={event.bannerUrl.startsWith('http') 
                    ? event.bannerUrl 
                    : `http://localhost:3000${event.bannerUrl}`}
              alt={event.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent"></div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center">
              <GiftIcon className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-4 text-gray-400">No banner available</p>
            </div>
          </div>
        )}
        
        {/* Back Button Overlay - Mobile */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 animate-fade-in-up">
          <Link 
            to="/events" 
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Kembali ke Daftar Event</span>
            <span className="sm:hidden">Kembali</span>
          </Link>
        </div>
        
        {/* Event title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 animate-fade-in-up-delay-1">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <CategoryBadge category={event.category === 'utama' ? 'main' : 'regular'} size="lg">
                {event.category === 'utama' ? 'EVENT UTAMA' : 'EVENT REGULER'}
              </CategoryBadge>
              <div
                className={`inline-flex items-center rounded-lg ${statusColors.bg} px-2 sm:px-3 py-1 text-xs font-semibold ${statusColors.text} ring-1 ring-inset ${statusColors.ring}`}
              >
                <StatusIcon className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">{event.registrationStatus}</span>
                <span className="sm:hidden">{event.registrationStatus.split(' ')[0]}</span>
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-white sm:text-3xl lg:text-4xl xl:text-5xl mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
              {event.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium">
                  <span className="hidden sm:inline">{format(new Date(event.eventDate), 'EEEE, dd MMMM yyyy', { locale: idLocale })}</span>
                  <span className="sm:hidden">{format(new Date(event.eventDate), 'dd MMM yyyy', { locale: idLocale })}</span>
                  {(event.startTime || event.start_time) && (
                    <span className="ml-2 text-blue-200">
                      • {(() => {
                        try {
                          const timeStr = event.startTime || event.start_time;
                          if (!timeStr) return '';
                          
                          let timeDate;
                          if (timeStr.includes('T')) {
                            // Full datetime format
                            timeDate = new Date(timeStr);
                          } else {
                            // Time only format (HH:mm:ss)
                            timeDate = new Date(`2000-01-01T${timeStr}`);
                          }
                          
                          if (isNaN(timeDate.getTime())) return timeStr + ' WIB';
                          return format(timeDate, 'HH:mm') + ' WIB';
                        } catch (e) {
                          return (event.startTime || event.start_time) + ' WIB';
                        }
                      })()}
                    </span>
                  )}
                </span>
              </div>
              {event.location && (
                <div className="flex items-start gap-1 sm:gap-2 min-w-0">
                  <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                  <span className="font-medium text-sm sm:text-base break-words leading-tight">{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 sm:gap-2">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium">
                  {event.participantsCount}
                  <span className="hidden sm:inline"> Peserta</span>
                  {event.maxParticipants && ` / ${event.maxParticipants}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up-delay-2">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column - Event details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in-up-delay-1">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
                Informasi Event
              </h2>

              {/* Event Date & Time */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tanggal & Waktu Event
                </h3>
                <div className="flex items-center space-x-4">
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {format(new Date(event.eventDate), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                    </p>
                    {(event.startTime || event.start_time) && (
                      <p className="text-blue-600 font-medium">
                        Jam {(() => {
                          try {
                            const timeStr = event.startTime || event.start_time;
                            if (!timeStr) return '';
                            
                            let timeDate;
                            if (timeStr.includes('T')) {
                              // Full datetime format
                              timeDate = new Date(timeStr);
                            } else {
                              // Time only format (HH:mm:ss)
                              timeDate = new Date(`2000-01-01T${timeStr}`);
                            }
                            
                            if (isNaN(timeDate.getTime())) return timeStr;
                            return format(timeDate, 'HH:mm');
                          } catch (e) {
                            return event.startTime || event.start_time;
                          }
                        })()} WIB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Capacity Progress */}
              {event.maxParticipants && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Kapasitas Event</h3>
                    <span className="text-lg font-bold text-blue-600">
                      {event.participantsCount} / {event.maxParticipants}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        percentage >= 100 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {event.availableSlots && event.availableSlots > 0
                      ? `Tersisa ${event.availableSlots} slot`
                      : 'Kuota sudah penuh'}
                  </p>
                </div>
              )}
              
              {/* Registration Period */}
              {(event.registrationStart || event.registrationEnd) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Periode Pendaftaran
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {event.registrationStart && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Pembukaan</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {format(new Date(event.registrationStart), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(event.registrationStart), 'HH:mm', { locale: idLocale })} WIB
                        </p>
                      </div>
                    )}
                    
                    {event.registrationEnd && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Penutupan</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {format(new Date(event.registrationEnd), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(event.registrationEnd), 'HH:mm', { locale: idLocale })} WIB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Event description */}
              {event.description && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Deskripsi Event</h3>
                  <p className="text-gray-700 leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>

            {/* Creator Card */}
            {event.creator && (
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in-up-delay-2">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrophyIcon className="h-6 w-6 text-yellow-600 mr-2" />
                  Event Creator
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                      {event.creator.profilePhoto ? (
                        <img 
                          src={event.creator.profilePhoto} 
                          alt={event.creator.name} 
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-8 w-8 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{event.creator.name}</h3>
                    <p className="text-xs text-blue-600 font-medium mt-1">Event Organizer</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Actions and Info */}
          <div className="space-y-6 animate-fade-in-up-delay-2">
            {/* Action Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <StarIcon className="h-6 w-6 mr-2" />
                  Aksi Cepat
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <Link
                  to={`/events/${event.id}/register`}
                  onClick={() => handleButtonClick('register')}
                  className={`block w-full text-center px-6 py-4 rounded-xl font-semibold transition-all transform ${
                    clickingButton === 'register' 
                      ? 'opacity-80 cursor-wait scale-95' 
                      : 'hover:scale-105 active:scale-95'
                  } ${
                    event.registrationStatus === 'Pendaftaran dibuka' && event.availableSlots && event.availableSlots > 0
                      ? clickingButton === 'register'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {clickingButton === 'register' ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Mengarahkan...
                    </span>
                  ) : (
                    'Daftar Event'
                  )}
                </Link>
                
                <Link
                  to={`/events/${event.id}/check-registration`}
                  onClick={() => handleButtonClick('checkStatus')}
                  className={`block w-full text-center px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                    clickingButton === 'checkStatus'
                      ? 'bg-gray-300 text-gray-500 cursor-wait opacity-80'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {clickingButton === 'checkStatus' ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                      Memuat...
                    </span>
                  ) : (
                    'Cek Status Pendaftaran'
                  )}
                </Link>
                
                <Link
                  to={`/events/${event.id}/winners`}
                  className="block w-full text-center px-6 py-4 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-xl font-semibold hover:from-yellow-200 hover:to-amber-200 transition-all transform hover:scale-105"
                >
                  Lihat Pemenang
                </Link>
              </div>
            </div>
            
            {/* Contact Person */}
            {(event.contactPerson1Name || event.contactPerson2Name) && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <PhoneIcon className="h-6 w-6 text-green-600 mr-2" />
                  Kontak Person
                </h2>
                <div className="space-y-4">
                  {event.contactPerson1Name && (
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{event.contactPerson1Name}</p>
                        {event.contactPerson1Phone && (
                          <a 
                            href={`tel:${event.contactPerson1Phone}`} 
                            className="text-sm text-green-600 hover:text-green-800 font-medium"
                          >
                            {event.contactPerson1Phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {event.contactPerson2Name && (
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{event.contactPerson2Name}</p>
                        {event.contactPerson2Phone && (
                          <a 
                            href={`tel:${event.contactPerson2Phone}`} 
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {event.contactPerson2Phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prizes section */}
        {prizes.length > 0 && (
          <div className="mt-16 animate-fade-in-up-delay-3">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Daftar Hadiah</h2>
              <p className="text-lg text-gray-600">
                Total {prizes.length} hadiah menarik menanti Anda
              </p>
            </div>
            
            {/* Main Prizes */}
            {mainPrizes.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-center mb-8">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-8 py-3 rounded-full shadow-lg">
                    <TrophyIcon className="inline h-6 w-6 mr-2" />
                    <span className="font-bold text-lg">Hadiah Utama</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {mainPrizes.map((prize) => (
                    <div key={prize.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                      <div className="relative">
                        {prize.imageUrl ? (
                          <img
                            src={prize.imageUrl.startsWith('http') 
                              ? prize.imageUrl 
                              : `http://localhost:3000${prize.imageUrl}`}
                            alt={prize.name}
                            className="w-full h-40 sm:h-64 object-contain bg-gray-50"
                          />
                        ) : (
                          <div className="w-full h-40 sm:h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <GiftIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                          <CategoryBadge category="utama" size="sm" />
                        </div>
                      </div>
                      
                      <div className="p-3 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                          {prize.name}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                          <span className="text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                            {prize.quantity} buah
                          </span>
                        </div>
                        
                        {prize.description && (
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                            {prize.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Regular Prizes */}
            {regularPrizes.length > 0 && (
              <div>
                <div className="flex items-center justify-center mb-8">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-full shadow-lg">
                    <GiftIcon className="inline h-6 w-6 mr-2" />
                    <span className="font-bold text-lg">Hadiah Reguler</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {regularPrizes.map((prize) => (
                    <div key={prize.id} className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                      <div className="relative">
                        {prize.imageUrl ? (
                          <img
                            src={prize.imageUrl.startsWith('http') 
                              ? prize.imageUrl 
                              : `http://localhost:3000${prize.imageUrl}`}
                            alt={prize.name}
                            className="w-full h-32 sm:h-48 object-contain bg-gray-50"
                          />
                        ) : (
                          <div className="w-full h-32 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <GiftIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                          <CategoryBadge category="reguler" size="sm" />
                        </div>
                      </div>
                      
                      <div className="p-2 sm:p-4">
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                          {prize.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-green-600 bg-green-50 px-1 sm:px-2 py-1 rounded-full">
                            {prize.quantity} buah
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};