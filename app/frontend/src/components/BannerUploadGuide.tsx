import React, { useState } from 'react';
import {
  PhotoIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface BannerUploadGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const BannerUploadGuide: React.FC<BannerUploadGuideProps> = ({ 
  isOpen = true, 
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'requirements' | 'examples' | 'tips'>('requirements');

  if (!isOpen) return null;

  const renderRequirements = () => (
    <div className="space-y-6">
      {/* Dimensions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <PhotoIcon className="h-5 w-5" />
          Dimensi dan Ukuran Banner
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded p-3 border border-blue-100">
            <h5 className="font-medium text-blue-800 mb-2">Desktop (Recommended)</h5>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Dimensi:</strong> 1920 x 640 px</li>
              <li>• <strong>Aspect Ratio:</strong> 3:1</li>
              <li>• <strong>Format:</strong> JPG, PNG, WebP</li>
              <li>• <strong>Ukuran Max:</strong> 2MB</li>
            </ul>
          </div>
          <div className="bg-white rounded p-3 border border-blue-100">
            <h5 className="font-medium text-blue-800 mb-2">Mobile Friendly</h5>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Dimensi:</strong> 1200 x 800 px</li>
              <li>• <strong>Aspect Ratio:</strong> 3:2</li>
              <li>• <strong>Safe Area:</strong> 80% tengah</li>
              <li>• <strong>Text Size:</strong> Min 24px</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quality Guidelines */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5" />
          Panduan Kualitas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
          <div>
            <h5 className="font-medium mb-2">✅ Yang Direkomendasikan:</h5>
            <ul className="space-y-1">
              <li>• Resolusi tinggi (300 DPI untuk print)</li>
              <li>• Kontras yang baik antara text dan background</li>
              <li>• Fokus utama di center banner</li>
              <li>• Warna yang konsisten dengan brand</li>
              <li>• Text readable di semua device</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">❌ Yang Harus Dihindari:</h5>
            <ul className="space-y-1">
              <li>• Gambar blur atau pixelated</li>
              <li>• Text terlalu kecil (kurang dari 24px)</li>
              <li>• Element penting di tepi banner</li>
              <li>• Terlalu banyak text</li>
              <li>• Warna yang tidak kontras</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Safe Zone */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5" />
          Safe Zone untuk Mobile
        </h4>
        <p className="text-sm text-yellow-800 mb-3">
          Pastikan elemen penting (logo, text utama) berada dalam area aman untuk tampilan mobile.
        </p>
        <div className="bg-white border border-yellow-200 rounded p-3">
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 rounded h-24 overflow-hidden">
            <div className="absolute inset-0 border-4 border-dashed border-yellow-400 m-4">
              <div className="bg-yellow-200 bg-opacity-20 h-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">SAFE ZONE (80%)</span>
              </div>
            </div>
            <div className="absolute top-2 left-2 text-white text-xs">Logo</div>
            <div className="absolute bottom-2 right-2 text-white text-xs">CTA Button</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExamples = () => (
    <div className="space-y-6">
      {/* Good Example */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5" />
          Contoh Banner yang Baik
        </h4>
        <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 h-32 relative">
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute top-4 left-6">
              <div className="w-8 h-8 bg-white rounded opacity-90"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-lg font-bold">Event Digital Marketing 2025</h3>
                <p className="text-sm opacity-90">15 Januari 2025 | Banjarbaru</p>
              </div>
            </div>
            <div className="absolute bottom-4 right-6">
              <div className="bg-white text-primary-600 px-3 py-1 rounded text-sm font-medium">
                Daftar Sekarang
              </div>
            </div>
          </div>
          <div className="p-3 text-sm text-green-700">
            <strong>Mengapa bagus:</strong> Text terpusat, kontras baik, elemen UI di safe zone, 
            branding konsisten, CTA jelas.
          </div>
        </div>
      </div>

      {/* Bad Example */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
          <XCircleIcon className="h-5 w-5" />
          Contoh Banner yang Kurang Baik
        </h4>
        <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-32 relative">
            <div className="absolute top-1 left-1 text-xs text-gray-600">Logo kecil</div>
            <div className="absolute top-2 right-2 text-xs text-gray-600">
              Text terlalu kecil dan di pojok yang akan terpotong di mobile
            </div>
            <div className="absolute bottom-1 left-1 text-xs text-gray-600">
              Terlalu banyak informasi yang tidak terbaca dengan baik karena kontras rendah
            </div>
          </div>
          <div className="p-3 text-sm text-red-700">
            <strong>Masalah:</strong> Kontras rendah, text terlalu kecil, elemen di tepi, 
            terlalu banyak informasi, tidak ada hirarki visual.
          </div>
        </div>
      </div>

      {/* Mobile Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <DevicePhoneMobileIcon className="h-5 w-5" />
          Preview Mobile
        </h4>
        <div className="flex gap-4">
          <div className="flex-1">
            <h5 className="text-sm font-medium text-blue-800 mb-2">Desktop View</h5>
            <div className="bg-white border border-blue-200 rounded overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 h-20 relative">
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <span className="text-sm font-medium">Full Banner Visible</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-medium text-blue-800 mb-2">Mobile View</h5>
            <div className="bg-white border border-blue-200 rounded overflow-hidden max-w-48">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 h-20 relative">
                <div className="absolute inset-x-4 inset-y-0 flex items-center justify-center text-white">
                  <span className="text-xs font-medium text-center">Safe Zone Content</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTips = () => (
    <div className="space-y-6">
      {/* Design Tips */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5" />
          Tips Desain Professional
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
          <div>
            <h5 className="font-medium mb-2">🎨 Visual Design:</h5>
            <ul className="space-y-1">
              <li>• Gunakan maksimal 3 warna utama</li>
              <li>• Terapkan rule of thirds untuk komposisi</li>
              <li>• Pastikan hierarchy visual yang jelas</li>
              <li>• Gunakan white space secara efektif</li>
              <li>• Consistent dengan brand guidelines</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📝 Typography:</h5>
            <ul className="space-y-1">
              <li>• Gunakan maksimal 2 jenis font</li>
              <li>• Ukuran minimum 24px untuk mobile</li>
              <li>• Kontras minimum 4.5:1 (WCAG)</li>
              <li>• Avoid text pada area yang sibuk</li>
              <li>• Line height 1.4-1.6 untuk readability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Tips */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
          <ComputerDesktopIcon className="h-5 w-5" />
          Tips Teknis
        </h4>
        <div className="space-y-4 text-sm text-orange-800">
          <div>
            <h5 className="font-medium mb-2">🔧 Optimasi File:</h5>
            <ul className="space-y-1 ml-4">
              <li>• Compress gambar tanpa mengurangi kualitas</li>
              <li>• Gunakan format WebP untuk web (fallback JPG)</li>
              <li>• Export dalam multiple sizes (responsive)</li>
              <li>• Embed color profile sRGB</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📱 Responsive Design:</h5>
            <ul className="space-y-1 ml-4">
              <li>• Test pada berbagai ukuran layar</li>
              <li>• Pertimbangkan orientasi landscape/portrait</li>
              <li>• Ensure touch targets minimal 44px</li>
              <li>• Optimize loading speed untuk mobile</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tools Recommendation */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-medium text-indigo-900 mb-3">🛠️ Tools yang Direkomendasikan</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white border border-indigo-100 rounded p-3">
            <h5 className="font-medium text-indigo-800 mb-2">Design Tools</h5>
            <ul className="space-y-1 text-indigo-700">
              <li>• Figma (Free)</li>
              <li>• Canva Pro</li>
              <li>• Adobe Photoshop</li>
              <li>• Sketch (Mac)</li>
            </ul>
          </div>
          <div className="bg-white border border-indigo-100 rounded p-3">
            <h5 className="font-medium text-indigo-800 mb-2">Compression</h5>
            <ul className="space-y-1 text-indigo-700">
              <li>• TinyPNG</li>
              <li>• ImageOptim</li>
              <li>• Squoosh.app</li>
              <li>• OptiPNG</li>
            </ul>
          </div>
          <div className="bg-white border border-indigo-100 rounded p-3">
            <h5 className="font-medium text-indigo-800 mb-2">Testing</h5>
            <ul className="space-y-1 text-indigo-700">
              <li>• Chrome DevTools</li>
              <li>• ResponsivelyApp</li>
              <li>• BrowserStack</li>
              <li>• LambdaTest</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-blue-600" />
            Panduan Upload Banner Event
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('requirements')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'requirements'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Persyaratan
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'examples'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Contoh
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'tips'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tips & Tools
          </button>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'requirements' && renderRequirements()}
        {activeTab === 'examples' && renderExamples()}
        {activeTab === 'tips' && renderTips()}
      </div>

      {/* Quick Summary */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="text-xs text-gray-600">
          <strong>Quick Summary:</strong> Upload banner 1920x640px (3:1), max 2MB, 
          elemen penting di center 80%, kontras baik, readable di mobile.
        </div>
      </div>
    </div>
  );
};