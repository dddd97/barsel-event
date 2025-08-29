import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import api from '../lib/axios';
import type { Event } from '../types/event';
// import { CategoryBadge } from '../components/CategoryBadge'; // Unused import
import { ModernSearch } from '../components/ModernSearch';
import { FrequentlyAskedQuestions } from '../components/FrequentlyAskedQuestions';
import { EventSystemInfo } from '../components/EventSystemInfo';
import LoadingSpinner from '../components/LoadingSpinner';
import { CallToAction } from '../components/CallToAction';
// Lazy load EventHero for better performance
const EventHero = lazy(() => import('../components/EventHero').then(module => ({ default: module.EventHero })));
import { handleImageError, getImageUrl } from '../utils/imageHelpers';

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'Pendaftaran dibuka':
      return {
        text: 'Pendaftaran Dibuka',
        Icon: CheckCircleIcon,
        className: 'bg-primary-100 text-primary-700',
      };
    case 'Pendaftaran akan dibuka':
      return {
        text: 'Akan Datang',
        Icon: ClockIcon,
        className: 'bg-secondary-100 text-secondary-700',
      };
    case 'Pendaftaran sudah ditutup':
      return {
        text: 'Pendaftaran Ditutup',
        Icon: XCircleIcon,
        className: 'bg-slate-100 text-slate-700',
      };
    case 'Pendaftaran ditutup (Kuota Penuh)':
      return {
        text: 'Kuota Penuh',
        Icon: XCircleIcon,
        className: 'bg-red-100 text-red-700',
      };
    default:
      return {
        text: 'Pendaftaran Ditutup',
        Icon: XCircleIcon,
        className: 'bg-slate-100 text-slate-700',
      };
  }
};

export const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'utama' | 'reguler'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy] = useState<'date' | 'name' | 'participants'>('date'); // setSortBy removed - unused
  
  // Window width state for responsive behavior
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Pagination states
  const [mainEventsCurrentPage, setMainEventsCurrentPage] = useState(0);
  const [regularEventsCurrentPage, setRegularEventsCurrentPage] = useState(0);
  const [isMainEventsTransitioning, setIsMainEventsTransitioning] = useState(false);
  // Dynamic events per page based on screen size
  const mainEventsPerPage = windowWidth < 1024 ? 3 : 2; // 3 on mobile to show all, 2 on desktop
  const regularEventsPerPage = 8; // 8 regular events per slide

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get<Event[]>('/api/events');
        setEvents(response.data);
        setError(null);
      } catch (err) {
        setError('Gagal memuat data event. Coba lagi nanti.');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter and search events
  useEffect(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => event.registrationStatus === selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'participants':
          return (b.participantsCount || 0) - (a.participantsCount || 0);
        case 'date':
        default:
          return new Date(b.eventDate || b.createdAt).getTime() - new Date(a.eventDate || a.createdAt).getTime();
      }
    });

    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Kelompokkan event berdasarkan kategori dari filtered events
  const mainEvents = filteredEvents.filter(event => event.category === 'utama');
  const regularEvents = filteredEvents.filter(event => event.category === 'reguler');

  // Pagination calculations
  const totalMainPages = Math.ceil(mainEvents.length / mainEventsPerPage);
  const totalRegularPages = Math.ceil(regularEvents.length / regularEventsPerPage);
  
  // const getCurrentMainEvents = () => {
  //   const startIndex = mainEventsCurrentPage * mainEventsPerPage;
  //   return mainEvents.slice(startIndex, startIndex + mainEventsPerPage);
  // }; // Unused function
  
  const getCurrentRegularEvents = () => {
    const startIndex = regularEventsCurrentPage * regularEventsPerPage;
    return regularEvents.slice(startIndex, startIndex + regularEventsPerPage);
  };

  // Pagination handlers using useCallback with smooth transition
  const handleMainEventsNext = useCallback(() => {
    if (totalMainPages > 0 && !isMainEventsTransitioning) {
      setIsMainEventsTransitioning(true);
      setMainEventsCurrentPage(prev => (prev + 1) % totalMainPages);
      setTimeout(() => setIsMainEventsTransitioning(false), 700); // Match CSS transition duration
    }
  }, [totalMainPages, isMainEventsTransitioning]);

  const handleMainEventsPrev = useCallback(() => {
    if (totalMainPages > 0 && !isMainEventsTransitioning) {
      setIsMainEventsTransitioning(true);
      setMainEventsCurrentPage(prev => (prev - 1 + totalMainPages) % totalMainPages);
      setTimeout(() => setIsMainEventsTransitioning(false), 700); // Match CSS transition duration
    }
  }, [totalMainPages, isMainEventsTransitioning]);

  const handleRegularEventsNext = useCallback(() => {
    if (totalRegularPages > 0) {
      setRegularEventsCurrentPage(prev => (prev + 1) % totalRegularPages);
    }
  }, [totalRegularPages]);

  const handleRegularEventsPrev = useCallback(() => {
    if (totalRegularPages > 0) {
      setRegularEventsCurrentPage(prev => (prev - 1 + totalRegularPages) % totalRegularPages);
    }
  }, [totalRegularPages]);

  // Handler for direct pagination click with smooth transition
  const handleMainEventsPageClick = useCallback((index: number) => {
    if (!isMainEventsTransitioning && index !== mainEventsCurrentPage) {
      setIsMainEventsTransitioning(true);
      setMainEventsCurrentPage(index);
      setTimeout(() => setIsMainEventsTransitioning(false), 700);
    }
  }, [isMainEventsTransitioning, mainEventsCurrentPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setMainEventsCurrentPage(0);
    setRegularEventsCurrentPage(0);
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.target !== document.body) return; // Only handle when no input is focused
    
    switch (event.key) {
      case 'ArrowLeft':
        if (totalMainPages > 1) handleMainEventsPrev();
        break;
      case 'ArrowRight':
        if (totalMainPages > 1) handleMainEventsNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (totalRegularPages > 1) handleRegularEventsPrev();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (totalRegularPages > 1) handleRegularEventsNext();
        break;
    }
  }, [totalMainPages, totalRegularPages, handleMainEventsPrev, handleMainEventsNext, handleRegularEventsPrev, handleRegularEventsNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="animate-pulse text-center z-10 max-w-4xl mx-auto px-4">
          <div className="h-16 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto mb-12"></div>
          <div className="flex justify-center gap-4">
            <div className="h-12 bg-gray-200 rounded-xl w-48"></div>
            <div className="h-12 bg-gray-200 rounded-xl w-48"></div>
          </div>
        </div>
      </div>

      {/* Search section skeleton */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse mb-12">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="h-12 bg-gray-200 rounded-xl"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* Event cards skeleton */}
          <div className="space-y-16">
            {/* Main events skeleton */}
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="flex justify-between items-center mt-6">
                        <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                        <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regular events skeleton */}
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="h-32 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg bg-red-50 p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <XCircleIcon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-3 text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );

  // Modern Pagination Component
  const renderPaginationControls = (
    currentPage: number,
    totalPages: number,
    onPrev: () => void,
    onNext: () => void,
    type: 'main' | 'regular'
  ) => {
    if (totalPages <= 1) return null;

    const isDark = type === 'main';
    const baseClasses = isDark 
      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white' 
      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white';
    
    const secondaryClasses = isDark
      ? 'bg-orange-100 hover:bg-orange-200 text-orange-600 hover:scale-110'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-600 hover:scale-110';

    const activeClasses = isDark
      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-125'
      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white scale-125';

    return (
      <div className="flex flex-col items-center gap-4 mt-8">
        {/* Navigation Hint */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            {type === 'main' ? '← → untuk navigasi' : '↑ ↓ untuk navigasi'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onPrev}
            disabled={currentPage === 0 || (type === 'main' && isMainEventsTransitioning)}
            className={`group p-3 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${baseClasses} shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 ${isDark ? 'focus:ring-orange-300' : 'focus:ring-blue-300'}`}
            title="Slide sebelumnya"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2 px-4">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => type === 'main' ? handleMainEventsPageClick(index) : setRegularEventsCurrentPage(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  index === currentPage 
                    ? activeClasses + (isDark ? ' focus:ring-orange-300' : ' focus:ring-blue-300')
                    : secondaryClasses + (isDark ? ' focus:ring-orange-300' : ' focus:ring-blue-300')
                }`}
                title={`Ke slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            disabled={currentPage === totalPages - 1 || (type === 'main' && isMainEventsTransitioning)}
            className={`group p-3 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${baseClasses} shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 ${isDark ? 'focus:ring-orange-300' : 'focus:ring-blue-300'}`}
            title="Slide berikutnya"
          >
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${isDark ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  // Enhanced Hero Card untuk Event Utama
  const renderMainEventCard = (event: Event, index: number = 0) => {
    
    const status = getStatusInfo(event.registrationStatus);
    const percentage = event.maxParticipants
      ? (event.participantsCount / event.maxParticipants) * 100
      : 0;
    const isFull = percentage >= 100;

    const getRegistrationPeriodInfo = () => {
      const registrationStatus = event.registrationStatus || 'Pendaftaran ditutup';
      
      if (event.registrationStart) {
        const startDate = new Date(event.registrationStart);
        const now = new Date();
        if (startDate > now) {
          const distance = formatDistanceToNow(startDate, { locale: idLocale });
          return {
            full: `Dibuka dalam ${distance}`,
            short: `${distance}`
          };
        }
      }
      
      if (registrationStatus === 'Pendaftaran dibuka' && event.registrationEnd) {
        const endDate = new Date(event.registrationEnd);
        const distance = formatDistanceToNow(endDate, { locale: idLocale });
        return {
          full: `Ditutup dalam ${distance}`,
          short: `${distance}`
        };
      }
      
      return null;
    };

    const registrationPeriodInfo = getRegistrationPeriodInfo();

    const getDelayClass = (index: number) => {
      const delays = ['animate-card-enter', 'animate-card-enter-delay-1', 'animate-card-enter-delay-2', 'animate-card-enter-delay-3'];
      return delays[index % delays.length] || 'animate-card-enter';
    };

    return (
      <Link
        key={event.id}
        to={`/events/${event.id}`}
        className={`group block ${getDelayClass(index)}`}
      >
        <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl hover:border-orange-300 flex flex-col">
          {/* Premium Badge */}
          <div className="absolute top-4 left-4 z-30">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
              <SparklesIcon className="h-3 w-3" />
              UTAMA
            </div>
          </div>

          {/* Enhanced Banner Section - Mobile Optimized */}
          <div className="relative h-48 sm:h-52 lg:h-56 w-full overflow-hidden">
            <img
              src={getImageUrl(event.bannerUrl, event.banner_url)}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ objectPosition: 'center center' }}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Status Overlay */}
            <div className="absolute top-3 right-3">
              <div className={`inline-flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold backdrop-blur-sm border border-white/20 ${
                status.className.includes('primary') 
                  ? 'bg-green-500/90 text-white' 
                  : status.className.includes('secondary')
                  ? 'bg-blue-500/90 text-white'
                  : status.className.includes('red')
                  ? 'bg-red-500/90 text-white'
                  : 'bg-gray-500/90 text-white'
              }`}>
                <status.Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{status.text}</span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col flex-1">
            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-orange-600 transition-colors">
              {event.name}
            </h3>
            
            {/* Event Meta Info */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(event.eventDate), 'dd MMM yyyy', { locale: idLocale })}
              </div>
              {event.location && (
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 max-w-full">
                  <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              {registrationPeriodInfo && (
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <ClockIcon className="h-3 w-3" />
                  <span className="hidden sm:inline truncate max-w-40">{registrationPeriodInfo.full}</span>
                  <span className="sm:hidden truncate max-w-20">{registrationPeriodInfo.short}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-6 line-clamp-3">
              {event.description}
            </p>

            {/* Progress Section */}
            {event.maxParticipants && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Peserta</span>
                  <span className="font-bold text-gray-900">
                    <span className={isFull ? 'text-red-600' : 'text-orange-600'}>
                      {event.participantsCount}
                    </span>
                    <span className="text-gray-500">/{event.maxParticipants}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ease-out ${
                      isFull ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {isFull && (
                  <p className="text-xs text-red-600 font-medium mt-1">Kuota Penuh</p>
                )}
              </div>
            )}

            {/* Action Section */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 group-hover:gap-3 transition-all">
                Lihat Detail Event
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Hover Border Glow */}
          <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-orange-400/50 transition-colors pointer-events-none" />
        </div>
      </Link>
    );
  };

  // Enhanced Compact Card untuk Event Reguler
  const renderRegularEventCard = (event: Event, index: number = 0) => {
    const status = getStatusInfo(event.registrationStatus);
    const percentage = event.maxParticipants
      ? (event.participantsCount / event.maxParticipants) * 100
      : 0;
    const isFull = percentage >= 100;

    const getDelayClass = (index: number) => {
      const delays = ['animate-card-enter', 'animate-card-enter-delay-1', 'animate-card-enter-delay-2', 'animate-card-enter-delay-3', 'animate-card-enter-delay-4'];
      return delays[index % delays.length] || 'animate-card-enter';
    };

    return (
      <Link
        key={event.id}
        to={`/events/${event.id}`}
        className={`group block h-full ${getDelayClass(index)}`}
      >
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-300 h-full flex flex-col">
          {/* Enhanced Banner - Mobile Responsive */}
          <div className="relative h-36 sm:h-40 lg:h-44 w-full overflow-hidden">
            <img
              src={getImageUrl(event.bannerUrl, event.banner_url)}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ objectPosition: 'center center' }}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            
            {/* Floating Status */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
              <div className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold backdrop-blur-sm border border-white/20 ${
                status.className.includes('primary') 
                  ? 'bg-green-500/90 text-white' 
                  : status.className.includes('secondary')
                  ? 'bg-blue-500/90 text-white'
                  : status.className.includes('red')
                  ? 'bg-red-500/90 text-white'
                  : 'bg-gray-500/90 text-white'
              }`}>
                <status.Icon className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">{status.text}</span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 flex flex-col flex-grow">
            {/* Title */}
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
              {event.name}
            </h3>
            
            {/* Meta Info Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(event.eventDate), 'dd MMM', { locale: idLocale })}
              </div>
              {event.location && (
                <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 max-w-full">
                  <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-grow">
              {event.description}
            </p>

            {/* Progress Section */}
            {event.maxParticipants ? (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Peserta</span>
                  <span className="font-medium text-gray-700">
                    <span className={isFull ? 'text-red-600' : 'text-blue-600'}>
                      {event.participantsCount}
                    </span>
                    <span className="text-gray-400">/{event.maxParticipants}</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      isFull ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {isFull && (
                  <p className="text-xs text-red-600 font-medium mt-1">Kuota Penuh</p>
                )}
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <UsersIcon className="h-3 w-3 text-gray-400" />
                  <span className="font-medium">{event.participantsCount || 0} Peserta</span>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="mt-auto pt-2">
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                Lihat Detail
                <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>

          {/* Hover Border Effect */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-400/30 transition-colors pointer-events-none" />
        </div>
      </Link>
    );
  };

  return (
    <div className="bg-slate-50 relative min-h-screen overflow-hidden">
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
      
      <main className="relative z-10">
        {/* Hero Section - Lazy loaded for performance */}
        <Suspense 
          fallback={
            <div className="h-[70vh] sm:min-h-[600px] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          }
        >
          <EventHero events={mainEvents} />
        </Suspense>

        {/* Modern Search */}
        <div className="relative z-20 max-w-4xl mx-auto px-6 -mt-12">
          <ModernSearch
            onSearch={(query) => setSearchQuery(query)}
            onCategoryFilter={(category) => setSelectedCategory(category)}
            totalResults={filteredEvents.length}
            placeholder="Cari event berdasarkan nama atau lokasi..."
          />
        </div>



        {/* Events Grid */}
        <div id="events-list" className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto h-24 w-24 text-slate-300 mb-6">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8-4 4-4-4m0 0L9 9l-4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Tidak ada event yang ditemukan</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery ? 
                  `Tidak ada event yang cocok dengan pencarian "${searchQuery}"` : 
                  'Coba ubah filter atau kriteria pencarian Anda'
                }
              </p>
              {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                  }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-primary-600 bg-primary-100 hover:bg-primary-200 transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Event Utama - Premium Container */}
              {mainEvents.length > 0 && (
                <div className="mb-20">
                  <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-orange-200/50 shadow-xl">
                    {/* Header Section */}
                    <div className="text-center mb-8 sm:mb-12">
                      <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-6 py-3 mb-6 shadow-lg">
                        <SparklesIcon className="h-6 w-6 text-white" />
                        <span className="text-lg font-bold text-white">EVENT UTAMA</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-4">
                        🏆 <span className="inline sm:inline">Event Utama</span> <span className="inline sm:inline">Unggulan</span>
                      </h2>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed px-2">
                        Event besar di Barito Selatan dengan hadiah menarik, pengalaman tak terlupakan, dan kesempatan emas untuk menjadi bagian dari momen istimewa
                      </p>
                    </div>
                    
                    {/* Featured Events Grid */}
                    <div className="relative">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1)_0%,transparent_50%)] pointer-events-none"></div>
                      
                      {/* Events Grid with Smooth Slide Transitions - Mobile Optimized */}
                        <div className={`relative lg:min-h-[520px] overflow-hidden transition-opacity duration-300 ${isMainEventsTransitioning ? 'pointer-events-none' : ''}`}>
                          {totalMainPages > 1 && windowWidth >= 1024 ? (
                            Array.from({ length: totalMainPages }, (_, pageIndex) => {
                              const startIndex = pageIndex * mainEventsPerPage;
                              const endIndex = (pageIndex + 1) * mainEventsPerPage;
                              const pageEvents = mainEvents.slice(startIndex, endIndex);
                              
                              return (
                                <div 
                                  key={pageIndex}
                                  className={`absolute inset-0 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start transition-all duration-700 ease-in-out ${
                                    pageIndex === mainEventsCurrentPage 
                                      ? 'opacity-100 translate-x-0' 
                                      : pageIndex < mainEventsCurrentPage 
                                        ? 'opacity-0 -translate-x-full'
                                        : 'opacity-0 translate-x-full'
                                  }`}
                                >
                                  {pageEvents.map((event, index) => renderMainEventCard(event, index))}
                                </div>
                              );
                            })
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                              {mainEvents.map((event, index) => renderMainEventCard(event, index))}
                            </div>
                          )}
                        </div>
                    </div>

                    {/* Pagination Controls for Main Events */}
                    {renderPaginationControls(
                      mainEventsCurrentPage,
                      totalMainPages,
                      handleMainEventsPrev,
                      handleMainEventsNext,
                      'main'
                    )}

                    {/* Bottom Info */}
                    <div className="mt-8 pt-6 border-t border-orange-200">
                      <div className="text-center">
                        {totalMainPages > 1 && (
                          <div className="flex items-center justify-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                            <span>Slide {mainEventsCurrentPage + 1} dari {totalMainPages}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Reguler - Modern Container */}
              {regularEvents.length > 0 && (
                <div className="mb-12">
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 border border-blue-200/50 shadow-lg">
                    {/* Header Section */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-3 mb-4 shadow-lg">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-lg font-bold text-white">EVENT TERSEDIA</span>
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">
                        📅 Event Reguler
                      </h2>
                      <p className="text-base text-gray-700 max-w-2xl mx-auto leading-relaxed">
                        Berbagai pilihan event menarik di Barito Selatan dan terbuka untuk semua peserta dengan beragam kategori dan aktivitas seru
                      </p>
                    </div>
                    
                    {/* Events Grid */}
                    <div className="relative">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(99,102,241,0.1)_0%,transparent_50%)] pointer-events-none"></div>
                      
                      {/* Responsive Grid with Smooth Transitions */}
                      <div className="relative">
                        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-500 ease-in-out">
                          {getCurrentRegularEvents().map((event, index) => renderRegularEventCard(event, index))}
                        </div>
                      </div>
                    </div>

                    {/* Pagination Controls for Regular Events */}
                    {renderPaginationControls(
                      regularEventsCurrentPage,
                      totalRegularPages,
                      handleRegularEventsPrev,
                      handleRegularEventsNext,
                      'regular'
                    )}

                    {/* Bottom Stats */}
                    {totalRegularPages > 1 && (
                      <div className="mt-6 pt-4 border-t border-blue-200">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            <span>Slide {regularEventsCurrentPage + 1} dari {totalRegularPages}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats Section */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Event</p>
                  <p className="text-2xl font-bold text-blue-900">{events.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-6 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Event Utama</p>
                  <p className="text-2xl font-bold text-yellow-900">{mainEvents.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Event Reguler</p>
                  <p className="text-2xl font-bold text-green-900">{regularEvents.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Peserta</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {events.reduce((sum, event) => sum + (event.participantsCount || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Events Section */}
        {events.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 border border-indigo-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">🔥 Event Trending</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Event yang sedang populer dan banyak diminati oleh peserta
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events
                  .sort((a, b) => (b.participantsCount || 0) - (a.participantsCount || 0))
                  .slice(0, 3)
                  .map((event, index) => (
                    <div key={event.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-600">#{index + 1} Trending</span>
                        </div>
                        {event.category === 'utama' && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1">
                            <SparklesIcon className="w-3 h-3 text-yellow-600" />
                            <span className="text-xs font-semibold text-yellow-700">UTAMA</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{event.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <UsersIcon className="w-4 h-4" />
                          <span className="font-medium">{event.participantsCount || 0} peserta</span>
                        </div>
                        <Link
                          to={`/events/${event.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Lihat Detail →
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Event System Info Section */}
        <div className="relative z-10">
          <EventSystemInfo />
        </div>
        
        {/* Call to Action Section */}
        <div className="relative z-10">
          <CallToAction />
        </div>
        
        {/* FAQ Section */}
        <div className="relative z-10">
          <FrequentlyAskedQuestions />
        </div>
      </main>
    </div>
  );
}; 