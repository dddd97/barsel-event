import type { ReactNode } from 'react';

interface CategoryBadgeProps {
  category: 'main' | 'regular' | 'utama' | 'reguler';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}

export const CategoryBadge = ({ 
  category, 
  size = 'md',
  className = '',
  children 
}: CategoryBadgeProps) => {
  // Menentukan warna berdasarkan kategori
  const getColorsByCategory = () => {
    switch (category) {
      case 'main':
      case 'utama':
        return {
          bg: 'bg-primary-100',
          text: 'text-primary-800',
          ring: 'ring-primary-500/10'
        };
      default:
        return {
          bg: 'bg-secondary-100',
          text: 'text-secondary-800',
          ring: 'ring-secondary-500/10'
        };
    }
  };

  // Menentukan ukuran
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1.5 text-base';
      default:
        return 'px-2.5 py-1 text-sm';
    }
  };

  const colors = getColorsByCategory();
  const sizeClasses = getSizeClasses();

  return (
    <span
      className={`inline-flex items-center rounded-md ${colors.bg} ${sizeClasses} font-medium ${colors.text} shadow-sm ring-1 ring-inset ${colors.ring} ${className}`}
    >
      {children || (
        category === 'main' ? 'Event Utama' : 
        category === 'utama' ? 'Hadiah Utama' : 
        category === 'regular' ? 'Event Reguler' : 'Hadiah Reguler'
      )}
    </span>
  );
}; 