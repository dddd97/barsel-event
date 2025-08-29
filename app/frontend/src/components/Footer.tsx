import { Link } from 'react-router-dom';
import { Mail, MapPin, Globe, Instagram, Youtube } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:20px_20px] opacity-20"></div>
      
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/images/barsel-event.png" 
                alt="Barsel Event Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Barsel Event
                </h3>
                <p className="text-sm text-slate-400">Platform Event Digital</p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6 max-w-md">
              Solusi digital terpercaya untuk pengelolaan event dan sistem doorprize yang modern dan transparan.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="h-4 w-4 text-blue-400" />
                <a href="mailto:diskominfo@baritoselatankab.go.id" className="hover:text-blue-400 transition-colors">
                  diskominfo@baritoselatankab.go.id
                </a>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                <span>Jl. Pahlawan No. 14, RT. 31, RW. 04, Buntok, Dusun Selatan, Barito Selatan</span>
              </div>
              
              {/* Social Media Links */}
              <div className="flex items-center gap-4 pt-2">
                <a href="https://diskominfo.baritoselatankab.go.id/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-blue-400 transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/diskominfosp_barsel/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-pink-400 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.youtube.com/channel/UCn7N03RTXdq99XB2faOr3UA/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-red-400 transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Menu</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-slate-400 hover:text-white transition-colors">
                  Daftar Event
                </Link>
              </li>
              <li>
                <a href="#check-registration" className="text-slate-400 hover:text-white transition-colors">
                  Cek Registrasi
                </a>
              </li>
              <li>
                <a href="#winners" className="text-slate-400 hover:text-white transition-colors">
                  Pemenang
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Bantuan</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#faq" className="text-slate-400 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#guide" className="text-slate-400 hover:text-white transition-colors">
                  Panduan
                </a>
              </li>
              <li>
                <a href="#terms" className="text-slate-400 hover:text-white transition-colors">
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-slate-400 hover:text-white transition-colors">
                  Privasi
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-1 text-sm text-slate-400 sm:flex-row sm:gap-2">
              <span>© {currentYear} Barsel Event.</span>
              <span>Platform didesain oleh DiskominfoSP Barsel</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>v1.1.0</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">SSL Secured</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};