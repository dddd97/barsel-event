import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { Event } from '../types/event';

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const [isClicking, setIsClicking] = useState(false);

  const handleClick = () => {
    setIsClicking(true);
    // Reset after navigation (timeout fallback)
    setTimeout(() => setIsClicking(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendaftaran dibuka':
        return 'green';
      case 'Pendaftaran ditutup':
        return 'red';
      case 'Pendaftaran akan dibuka':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <Link
      to={`/events/${event.id}`}
      onClick={handleClick}
      className={`group block transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl active:scale-95 active:translate-y-0 ${isClicking ? 'cursor-wait opacity-80' : ''}`}
    >
      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-lg border bg-white group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-blue-50 ${
          event.category === 'utama'
            ? 'border-blue-500 border-2 lg:scale-[1.02] shadow-md group-hover:border-blue-600'
            : 'border-gray-200 group-hover:border-blue-300'
        }`}
      >
        <div className="relative h-32 sm:h-40">
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl.startsWith('http') ? event.bannerUrl : `${window.location.origin}${event.bannerUrl}`}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-50">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {event.category === 'utama' && (
            <div className="absolute right-2 top-2">
              <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Event Utama
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="flex-1 min-h-0">
            <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 sm:text-lg line-clamp-2">
              {event.name}
            </h3>
            <div className="mt-1 space-y-1 text-sm text-gray-500">
              <div className="flex items-center space-x-1.5">
                <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">
                  {format(new Date(event.eventDate), 'PPP', { locale: id })}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center space-x-1.5">
                  <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{event.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-2 sm:space-y-3">
            <div>
              <span
                className={`inline-flex items-center rounded-md bg-${getStatusColor(
                  event.registrationStatus
                )}-50 px-2 py-0.5 text-xs font-medium text-${getStatusColor(
                  event.registrationStatus
                )}-700`}
              >
                {event.registrationStatus}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <div className="flex items-center space-x-1.5">
                  <UsersIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    {event.participantsCount} Peserta
                    {event.maxParticipants && (
                      <span className="text-gray-400">
                        {' '}
                        / {event.maxParticipants}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {event.maxParticipants && (
              <div>
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-1.5 rounded-full ${
                      event.participantsCount / event.maxParticipants > 0.8
                        ? 'bg-red-500'
                        : event.participantsCount / event.maxParticipants > 0.5
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        (event.participantsCount / event.maxParticipants) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500">
                {event.availableSlots !== null && event.availableSlots > 0
                  ? `Tersisa ${event.availableSlots} slot`
                  : 'Tidak ada slot tersisa'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}; 