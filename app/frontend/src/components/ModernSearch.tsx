import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface ModernSearchProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: 'all' | 'utama' | 'reguler') => void;
  placeholder?: string;
  totalResults?: number;
}

export const ModernSearch: React.FC<ModernSearchProps> = ({
  onSearch,
  onCategoryFilter,
  placeholder = "Cari event...",
  totalResults
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'utama' | 'reguler'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, onSearch]);

  const handleCategoryChange = (category: 'all' | 'utama' | 'reguler') => {
    setSelectedCategory(category);
    onCategoryFilter(category);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const categories = [
    { value: 'all', label: 'Semua Event', count: 'All' },
    { value: 'utama', label: 'Event Utama', count: 'Main' },
    { value: 'reguler', label: 'Event Reguler', count: 'Regular' }
  ] as const;

  return (
    <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden backdrop-blur-sm">
      {/* Search Bar */}
      <div className="p-6 sm:p-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-12 py-4 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-gray-400 bg-gray-50/50"
            placeholder={placeholder}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-5 flex items-center hover:scale-110 transition-transform"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            </button>
          )}
        </div>

        {/* Filter Toggle and Results */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Filter Event</span>
            <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
              showFilters ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
          </button>
          
          {totalResults !== undefined && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-600">
                {totalResults} event ditemukan
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30 px-6 sm:px-8 py-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FunnelIcon className="w-4 h-4" />
              Kategori Event
            </h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryChange(category.value)}
                  className={`group relative px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.value
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:scale-105'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {category.label}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedCategory === category.value
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {category.count}
                    </span>
                  </span>
                  {selectedCategory === category.value && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {searchQuery && (
        <div className="border-t border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-6 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700">
                Mencari: "<span className="font-semibold">{searchQuery}</span>"
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-100"
            >
              Hapus pencarian
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!searchQuery && !showFilters && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 sm:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>💡 Tips: Gunakan filter untuk menemukan event yang tepat</span>
            <span>⌘K</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernSearch; 