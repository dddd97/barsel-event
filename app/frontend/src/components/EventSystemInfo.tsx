import { AccordionCard } from './AccordionCard';
import { 
  CalendarIcon, 
  TicketIcon, 
  GiftIcon, 
  UserGroupIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

const systemInfoItems = [
  {
    title: 'Sistem Pendaftaran Digital',
    icon: CalendarIcon,
    content: 'Sistem pendaftaran digital memudahkan peserta untuk mendaftar event tanpa perlu datang ke lokasi fisik. Pendaftaran dapat dilakukan kapan saja dan di mana saja melalui perangkat yang terhubung internet.'
  },
  {
    title: 'Kartu Peserta Virtual',
    icon: TicketIcon,
    content: 'Setiap peserta akan mendapatkan kartu peserta virtual yang dilengkapi dengan QR Code unik. Kartu ini berfungsi sebagai identifikasi peserta dan tiket masuk ke event.'
  },
  {
    title: 'Sistem Doorprize Terintegrasi',
    icon: GiftIcon,
    content: 'Sistem doorprize terintegrasi menjamin transparansi dan keadilan dalam proses pengundian. Hanya peserta yang terdaftar dan hadir yang memiliki kesempatan untuk memenangkan hadiah.'
  },
  {
    title: 'Manajemen Peserta',
    icon: UserGroupIcon,
    content: 'Penyelenggara dapat dengan mudah mengelola data peserta, melihat statistik pendaftaran, dan mengatur kapasitas event. Sistem ini juga mendukung ekspor data untuk keperluan analisis lebih lanjut.'
  },
  {
    title: 'Keamanan Data',
    icon: ShieldCheckIcon,
    content: 'Keamanan data peserta menjadi prioritas utama. Sistem menggunakan enkripsi untuk melindungi data sensitif dan hanya mengumpulkan informasi yang diperlukan untuk keperluan event.'
  }
];

export const EventSystemInfo = () => {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <span className="inline-block h-1 w-20 rounded-full bg-primary-500"></span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Sistem Event Digital</h2>
          <p className="mt-4 text-lg text-slate-600">
            Kenali lebih jauh tentang sistem event digital yang kami gunakan untuk memudahkan penyelenggaraan dan partisipasi event.
          </p>
        </div>
        
        <div className="mx-auto mt-12 max-w-4xl space-y-6">
          {systemInfoItems.map((item, index) => (
            <AccordionCard 
              key={index} 
              title={item.title}
              defaultOpen={index === 0}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 shadow-sm ring-4 ring-primary-50">
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-slate-600">{item.content}</p>
                  <div className="mt-3 flex items-center">
                    <span className="text-xs font-medium text-primary-600">Pelajari lebih lanjut</span>
                    <svg className="ml-1 h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </AccordionCard>
          ))}
        </div>
      </div>
    </div>
  );
}; 