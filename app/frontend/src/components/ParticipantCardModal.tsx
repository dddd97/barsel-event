import React from 'react';
import { X, Download, Eye, EyeOff, FileText } from 'lucide-react';
import ParticipantCard from './ParticipantCard';
import { PDFViewer } from './PDFViewer';

interface ParticipantCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardData: {
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
  } | null;
  onDownload?: () => void;
  downloadLoading?: boolean;
  pdfUrl?: string;
}

export const ParticipantCardModal: React.FC<ParticipantCardModalProps> = ({
  isOpen,
  onClose,
  cardData,
  onDownload,
  downloadLoading = false,
  pdfUrl
}) => {
  const [showSensitiveData, setShowSensitiveData] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'preview' | 'pdf'>('preview');

  // Close modal on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !cardData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Preview Kartu Peserta</h2>
              <p className="text-sm text-gray-600">{cardData.participant.name} - {cardData.event.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'pdf'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                PDF View
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'preview' ? (
            /* Preview Mode */
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="max-w-md mx-auto">
                <ParticipantCard
                  event={cardData.event}
                  participant={cardData.participant}
                  qr_code_svg={cardData.qr_code_svg}
                  banner_data_uri={cardData.banner_data_uri}
                  variant="preview"
                  className="mx-auto"
                />
              </div>
            </div>
          ) : (
            /* PDF View Mode */
            <div className="h-[calc(90vh-120px)]">
              {pdfUrl ? (
                <PDFViewer
                  pdfUrl={pdfUrl}
                  title={`Kartu Peserta - ${cardData.participant.name}`}
                  className="h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">PDF Preview</h3>
                    <p className="text-gray-500 mb-4">Klik Download untuk melihat PDF</p>
                    {onDownload && (
                      <button
                        onClick={onDownload}
                        disabled={downloadLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Toggle Sensitive Data */}
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
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

              {/* Download Button */}
              {onDownload && (
                <button
                  onClick={onDownload}
                  disabled={downloadLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

            {/* Information */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Kartu ini adalah bukti pendaftaran yang sah</p>
              <p>• Simpan kartu ini untuk keperluan check-in di lokasi event</p>
              <p>• QR Code berisi informasi peserta untuk verifikasi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantCardModal; 