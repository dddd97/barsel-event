import React from 'react';
import { Download, Eye, EyeOff } from 'lucide-react';

interface ParticipantCardResponsiveProps {
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
  variant?: 'compact' | 'full' | 'preview';
}

export const ParticipantCardResponsive: React.FC<ParticipantCardResponsiveProps> = ({
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
    
    const hari = [
      'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
    ];
    
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
  };

  const censorNIK = (nik: string) => {
    if (nik.length <= 8) return nik;
    return nik.substring(0, 4) + '****' + nik.substring(nik.length - 4);
  };

  const isCompact = variant === 'compact';
  const isPreview = variant === 'preview';

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 ${className}`}>
      {/* Card Header */}
      <div 
        className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center relative ${
          isCompact ? 'p-3' : 'p-5'
        }`}
        style={banner_data_uri ? {
          backgroundImage: `url('${banner_data_uri}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        {/* Overlay for better text readability over image */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <div className="relative z-10">
          <h1 className={`font-bold mb-1 ${isCompact ? 'text-sm' : 'text-xl'}`}>
            {event.name}
          </h1>
          <p className={`font-semibold tracking-wider ${isCompact ? 'text-xs' : 'text-sm'}`}>
            KARTU PESERTA
          </p>
        </div>
      </div>
      
      {/* Card Body */}
      <div className={isCompact ? 'p-3' : 'p-5'}>
        {/* Registration Number */}
        <div className="text-center mb-4">
          <span className={`text-gray-500 block uppercase tracking-wider ${
            isCompact ? 'text-xs' : 'text-xs'
          }`}>
            Nomor Registrasi
          </span>
          <div className={`inline-block bg-yellow-300 px-3 py-1 font-bold rounded border-2 border-dashed border-yellow-500 transform -rotate-2 mt-1 ${
            isCompact ? 'text-lg' : 'text-xl'
          }`}>
            {participant.registration_number}
          </div>
        </div>
        
        {/* Participant Info */}
        <div className={`bg-gray-50 rounded-lg mb-4 ${
          isCompact ? 'p-2' : 'p-3'
        }`}>
          <div className={`grid gap-2 ${
            isCompact ? 'text-xs' : 'text-sm'
          }`}>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-600 font-medium">Nama:</span>
              <span className="col-span-2 font-medium">{participant.name}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-600 font-medium">NIK:</span>
              <span className="col-span-2 font-mono">
                {showSensitiveData ? participant.nik : censorNIK(participant.nik)}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-600 font-medium">No. Telepon:</span>
              <span className="col-span-2 font-mono">{participant.phone_number}</span>
            </div>
            
            {participant.institution && (
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-600 font-medium">Instansi:</span>
                <span className="col-span-2">{participant.institution}</span>
              </div>
            )}
            
            {participant.email && (
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="col-span-2">{participant.email}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Event Info & QR Code */}
        <div className="flex justify-between items-end border-t border-gray-200 pt-3">
          <div className={`text-gray-600 ${isCompact ? 'text-xs' : 'text-xs'}`}>
            <p><strong>Tanggal:</strong> {event.event_date ? formatIndonesianDate(event.event_date) : '-'}</p>
            <p><strong>Lokasi:</strong> {event.location || '-'}</p>
            {!isCompact && <p className="italic mt-1">Kartu ini adalah bukti pendaftaran yang sah.</p>}
          </div>
          
          <div className={`bg-white p-1 border border-gray-200 rounded-lg shadow-sm flex items-center justify-center ${
            isCompact ? 'w-16 h-16' : 'w-20 h-20'
          }`}>
            <div dangerouslySetInnerHTML={{ __html: qr_code_svg }} />
          </div>
        </div>
      </div>
      
      {/* Download Button */}
      {onDownload && !isPreview && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onDownload}
            disabled={downloadLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {downloadLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Kartu Peserta
          </button>
        </div>
      )}

      {/* Toggle Sensitive Data Button (only for preview mode) */}
      {isPreview && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
          >
            {showSensitiveData ? (
              <>
                <EyeOff className="w-4 h-4" />
                Sembunyikan Data Sensitif
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Tampilkan Data Lengkap
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantCardResponsive; 