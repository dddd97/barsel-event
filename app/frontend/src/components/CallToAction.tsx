import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export const CallToAction = () => {
  return (
    <div className="bg-primary-700">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary-600 px-6 py-16 shadow-xl sm:px-12 sm:py-20 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-16">
          <div className="absolute inset-0 opacity-20">
            <svg
              className="h-full w-full"
              fill="none"
              viewBox="0 0 800 800"
            >
              <defs>
                <pattern
                  id="pattern-squares"
                  x="50"
                  y="50"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="50" height="50" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="800" height="800" fill="url(#pattern-squares)" />
            </svg>
          </div>
          
          <div className="relative lg:col-span-1">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Siap Bergabung dengan Event Kami?
            </h2>
            <p className="mt-6 text-lg text-white/80">
              Daftarkan diri Anda sekarang untuk mengikuti event menarik dan berkesempatan memenangkan hadiah doorprize.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-all hover:bg-primary-50"
              >
                Lihat Semua Event
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="relative mt-12 sm:mt-16 lg:mt-0">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-primary-800/40 blur-3xl"></div>
            <div className="relative rounded-2xl bg-white/5 p-8 shadow-lg backdrop-blur-sm">
              <blockquote>
                <div className="font-medium text-white">
                  <svg
                    className="absolute -top-6 left-1 h-12 w-12 -translate-x-1/2 -translate-y-1/2 transform text-primary-400"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                  >
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                  <p className="relative text-lg">
                    Sistem doorprize digital ini sangat memudahkan kami dalam menyelenggarakan event. Proses pendaftaran dan pengundian menjadi lebih transparan dan efisien.
                  </p>
                </div>
                <footer className="mt-4">
                  <p className="text-base font-semibold text-white">Panitia Event Barsel</p>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 