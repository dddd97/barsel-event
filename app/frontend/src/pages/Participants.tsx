export const Participants = () => {
  return (
    <div className="py-4 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Participants
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Daftar peserta yang telah terdaftar dalam event.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Coming Soon
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Halaman ini sedang dalam pengembangan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 