import React from 'react';
import { Download, Eye, EyeOff } from 'lucide-react';

interface ParticipantCardProps {
  event: {
    id: number;
    name: string;
    location: string;
    event_date: string;
  };
  participant: {
    id: number;
    name: string;
    nik: string;
    phone_number: string;
    institution: string;
    email: string | null;
    registration_number: string;
  };
  qr_code_svg: string;
  banner_data_uri?: string | null;
  onDownload?: () => void;
  downloadLoading?: boolean;
  className?: string;
  variant?: 'preview' | 'full' | 'compact';
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  event,
  participant,
  qr_code_svg,
  banner_data_uri,
  onDownload,
  downloadLoading = false,
  className = '',
  variant = 'full'
}) => {
  const [showSensitiveData, setShowSensitiveData] = React.useState(false);

  const formatIndonesianDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const censorNIK = (nik: string) => {
    if (nik.length <= 8) return nik;
    return nik.substring(0, 4) + '****' + nik.substring(nik.length - 4);
  };

  const isCompact = variant === 'compact';
  // const isPreview = variant === 'preview'; // Unused variable

  return (
    <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 ${className}`}>
      {/* Card Header */}
      <div
        className="relative h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden"
        style={banner_data_uri ? {
          backgroundImage: `url('${banner_data_uri}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500"></div>

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-6">
          <h1 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
            {event.name}
          </h1>
          <p className="text-sm font-semibold tracking-widest uppercase opacity-90 mb-4">
            Kartu Peserta
          </p>
          
          {/* Registration Number Badge */}
          <div className="bg-white/95 text-gray-900 px-6 py-3 rounded-full font-black text-lg md:text-xl tracking-wider shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            {participant.registration_number}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 md:p-8">
        {/* Participant Info Section */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 border border-gray-200">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 min-w-[80px]">Nama:</span>
              <span className="font-semibold text-gray-900 text-lg">{participant.name}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 min-w-[80px]">NIK:</span>
              <span className="font-mono font-semibold text-red-600">
                {showSensitiveData ? participant.nik : censorNIK(participant.nik)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 min-w-[80px]">Telepon:</span>
              <span className="font-mono font-medium">{participant.phone_number}</span>
            </div>

            {participant.institution && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm font-semibold text-gray-600 min-w-[80px]">Instansi:</span>
                <span className="font-medium">{participant.institution}</span>
              </div>
            )}

            {participant.email && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm font-semibold text-gray-600 min-w-[80px]">Email:</span>
                <span className="font-medium text-blue-600">{participant.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Event Info & QR Code */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-t border-gray-200 pt-6">
          <div className="flex-1 space-y-2">
            <div className="text-sm text-gray-600">
              <p><strong className="text-gray-800">Tanggal:</strong> {event.event_date ? formatIndonesianDate(event.event_date) : '-'}</p>
              <p><strong className="text-gray-800">Lokasi:</strong> {event.location || '-'}</p>
            </div>
            <p className="text-xs text-gray-500 italic">
              Kartu ini adalah bukti pendaftaran yang sah
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200">
              <div className="w-20 h-20 flex items-center justify-center">
                <div dangerouslySetInnerHTML={{ __html: qr_code_svg }} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">QR Code</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isCompact && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Toggle Sensitive Data */}
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
            >
              {showSensitiveData ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Sembunyikan Data
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Tampilkan Data Lengkap
                </>
              )}
            </button>

            {/* Download Button */}
            {onDownload && (
              <button
                onClick={onDownload}
                disabled={downloadLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {downloadLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download PDF
              </button>
            )}
          </div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
        Generated by Barsel Event
      </div>
    </div>
  );
};

export default ParticipantCard; 