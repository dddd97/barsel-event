import React, { useState, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarDaysIcon,

  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';


export interface FilterOptions {
  search: string;
  category: 'all' | 'utama' | 'reguler';
  status: 'all' | 'dibuka' | 'akan_dibuka' | 'ditutup';
  hasSlots: boolean | null;
  dateRange: {
    start: string;
    end: string;
  } | null;
  sortBy: 'date' | 'name' | 'participants' | 'newest';
  sortOrder: 'asc' | 'desc';
}

interface SearchAndFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  className?: string;
  totalEvents?: number;
  filteredCount?: number;
  floating?: boolean;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onFilterChange,
  className = '',
  totalEvents = 0,
  filteredCount = 0,
  floating = false,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'all',
    status: 'all',
    hasSlots: null,
    dateRange: null,
    sortBy: 'date',
    sortOrder: 'asc',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [filters, onFilterChange]);

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      search: '',
      category: 'all',
      status: 'all',
      hasSlots: null,
      dateRange: null,
      sortBy: 'date',
      sortOrder: 'asc',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.hasSlots !== null ||
    filters.dateRange !== null ||
    filters.sortBy !== 'date';

  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl shadow-2xl ${floating ? 'relative -mt-16 z-30 mx-auto max-w-3xl' : ''} ${className}`}
      style={floating ? { boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' } : {}}
    >
      {/* Search Bar */}
      <div className="p-6 pb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <MagnifyingGlassIcon className="h-6 w-6 text-primary-500" />
          </div>
          <input
            type="text"
            placeholder="Cari event berdasarkan nama, lokasi, atau deskripsi..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full pl-14 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-lg transition-all duration-200 ${
              isSearchFocused ? 'shadow-lg' : 'shadow-md'
            }`}
          />
          {filters.search && (
            <button
              onClick={() => updateFilters({ search: '' })}
              className="absolute inset-y-0 right-0 flex items-center pr-4"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>
      {/* Quick Filters */}
      <div className="px-6 pb-4 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-gray-500" />
            <select
              value={filters.category}
              onChange={(e) => updateFilters({ category: e.target.value as FilterOptions['category'] })}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
            >
              <option value="all">Semua Kategori</option>
              <option value="utama">Event Utama</option>
              <option value="reguler">Event Reguler</option>
            </select>
          </div>
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as FilterOptions['status'] })}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="dibuka">Pendaftaran Dibuka</option>
              <option value="akan_dibuka">Akan Dibuka</option>
              <option value="ditutup">Pendaftaran Ditutup</option>
            </select>
          </div>
          {/* Available Slots Filter */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.hasSlots === true}
              onChange={(e) => updateFilters({ hasSlots: e.target.checked ? true : null })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
            />
            <span className="text-gray-700">Masih ada slot</span>
          </label>
          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              showAdvanced
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filter Lanjutan
          </button>
          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
              Hapus Filter
            </button>
          )}
        </div>
      </div>
      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-100 p-6 bg-gray-50 rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarDaysIcon className="inline h-5 w-5 mr-1" />
                Rentang Tanggal Event
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => updateFilters({
                    dateRange: {
                      start: e.target.value,
                      end: filters.dateRange?.end || '',
                    }
                  })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
                />
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => updateFilters({
                    dateRange: {
                      start: filters.dateRange?.start || '',
                      end: e.target.value,
                    }
                  })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
                />
              </div>
            </div>
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutkan Berdasarkan
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value as FilterOptions['sortBy'] })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
              >
                <option value="date">Tanggal Event</option>
                <option value="name">Nama Event</option>
                <option value="participants">Jumlah Peserta</option>
                <option value="newest">Terbaru Dibuat</option>
              </select>
            </div>
            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutan
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilters({ sortOrder: e.target.value as FilterOptions['sortOrder'] })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
              >
                <option value="asc">Ascending (A-Z, Lama-Baru)</option>
                <option value="desc">Descending (Z-A, Baru-Lama)</option>
              </select>
            </div>
          </div>
        </div>
      )}
      {/* Results Summary */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 rounded-b-2xl">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {hasActiveFilters ? (
              <span>
                Menampilkan <strong>{filteredCount}</strong> dari <strong>{totalEvents}</strong> event
              </span>
            ) : (
              <span>
                Menampilkan <strong>{totalEvents}</strong> event
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs">Filter aktif:</span>
              <div className="flex gap-1">
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700">
                    "{filters.search}"
                  </span>
                )}
                {filters.category !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    {filters.category === 'utama' ? 'Event Utama' : 'Event Reguler'}
                  </span>
                )}
                {filters.status !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    {filters.status === 'dibuka' ? 'Dibuka' : filters.status === 'akan_dibuka' ? 'Akan Dibuka' : 'Ditutup'}
                  </span>
                )}
                {filters.hasSlots && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                    Ada Slot
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};