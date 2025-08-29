import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  PencilIcon,
  UserGroupIcon,
  GiftIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import type { Event } from '../../types/event';
import { CategoryBadge } from '../../components/CategoryBadge';
import AdminLayout from '../../components/AdminLayout';

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'Pendaftaran dibuka':
      return {
        text: 'Pendaftaran Dibuka',
        Icon: CheckCircleIcon,
        className: 'bg-green-100 text-green-700',
      };
    case 'Pendaftaran akan dibuka':
      return {
        text: 'Akan Datang',
        Icon: ClockIcon,
        className: 'bg-yellow-100 text-yellow-700',
      };
    case 'Pendaftaran sudah ditutup':
      return {
        text: 'Pendaftaran Ditutup',
        Icon: XCircleIcon,
        className: 'bg-red-100 text-red-700',
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

export const AdminEventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setError(null);
      const response = await api.get(`/api/admin/events/${eventId}`);
      setEvent(response.data);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Gagal memuat detail event');
      toast.error('Gagal memuat detail event');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="mt-4 text-slate-600">Memuat detail event...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !event) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">Event tidak ditemukan</h3>
            <p className="mt-2 text-slate-600">{error || 'Event yang Anda cari tidak ditemukan.'}</p>
            <div className="mt-6">
              <Link
                to="/admin/events"
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Kembali ke Daftar Event
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const status = getStatusInfo(event.registrationStatus);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/events"
                className="inline-flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-primary-600"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Kembali ke Daftar Event
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/admin/events?edit=${event.id}`}
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Event
              </Link>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{event.name}</h1>
                <div className="mt-2 flex items-center space-x-4">
                  <div className={`inline-flex items-center gap-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${status.className}`}>
                    <status.Icon className="h-4 w-4" />
                    {status.text}
                  </div>
                  {event.category && (
                    <CategoryBadge category={event.category === 'utama' ? 'main' : 'regular'} size="sm">
                      {event.category === 'utama' ? 'EVENT UTAMA' : 'EVENT REGULER'}
                    </CategoryBadge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <div>
                <h2 className="text-lg font-medium text-slate-900 mb-4">Detail Event</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Tanggal Event</p>
                      <p className="text-sm text-slate-600">
                        {event.eventDate ? format(new Date(event.eventDate), 'EEEE, dd MMMM yyyy', { locale: idLocale }) : 'Belum ditentukan'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPinIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Lokasi</p>
                      <p className="text-sm text-slate-600">{event.location || 'Belum ditentukan'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <UsersIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Kapasitas Peserta</p>
                      <p className="text-sm text-slate-600">
                        {event.participantsCount || 0} / {event.maxParticipants || 0} peserta
                      </p>
                    </div>
                  </div>

                  {event.description && (
                    <div className="flex items-start space-x-3">
                      <div className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Deskripsi</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{event.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Registration Period */}
                  {(event.registrationStart || event.registrationEnd) && (
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Periode Pendaftaran</p>
                        <p className="text-sm text-slate-600">
                          {event.registrationStart && event.registrationEnd
                            ? `${format(new Date(event.registrationStart), 'dd MMM yyyy', { locale: idLocale })} - ${format(new Date(event.registrationEnd), 'dd MMM yyyy', { locale: idLocale })}`
                            : event.registrationStart
                            ? `Dari ${format(new Date(event.registrationStart), 'dd MMM yyyy', { locale: idLocale })}`
                            : event.registrationEnd
                            ? `Sampai ${format(new Date(event.registrationEnd), 'dd MMM yyyy', { locale: idLocale })}`
                            : 'Belum ditentukan'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Contact Person */}
                  {(event.contactPerson1Name || event.contactPerson2Name) && (
                    <div className="flex items-start space-x-3">
                      <UserGroupIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Kontak Person</p>
                        <div className="mt-1 space-y-1">
                          {event.contactPerson1Name && (
                            <p className="text-sm text-slate-600">
                              {event.contactPerson1Name} {event.contactPerson1Phone && `(${event.contactPerson1Phone})`}
                            </p>
                          )}
                          {event.contactPerson2Name && (
                            <p className="text-sm text-slate-600">
                              {event.contactPerson2Name} {event.contactPerson2Phone && `(${event.contactPerson2Phone})`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Aksi Cepat</h3>
                <div className="space-y-3">
                  <Link
                    to={`/admin/events/${event.id}/participants`}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-primary-600"
                  >
                    <div className="flex items-center">
                      <UserGroupIcon className="mr-3 h-5 w-5" />
                      Kelola Peserta
                    </div>
                    <span className="text-xs text-slate-500">{event.participantsCount || 0} peserta</span>
                  </Link>

                  <Link
                    to={`/admin/events/${event.id}/prizes`}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-primary-600"
                  >
                    <div className="flex items-center">
                      <GiftIcon className="mr-3 h-5 w-5" />
                      Kelola Hadiah
                    </div>
                  </Link>

                  <Link
                    to={`/admin/events/${event.id}/draw`}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-primary-600"
                  >
                    <div className="flex items-center">
                      <TrophyIcon className="mr-3 h-5 w-5" />
                      Undian Hadiah
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Event Stats */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Statistik Event</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Peserta</span>
                    <span className="text-sm font-medium text-slate-900">{event.participantsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Kapasitas</span>
                    <span className="text-sm font-medium text-slate-900">{event.maxParticipants || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sisa Kuota</span>
                    <span className="text-sm font-medium text-slate-900">
                      {Math.max(0, (event.maxParticipants || 0) - (event.participantsCount || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}; 