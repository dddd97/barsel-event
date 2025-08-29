import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'dots' | 'pulse' | 'waves' | 'modern';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = 'Loading...',
  fullScreen = false,
  variant = 'modern'
}) => {
  const sizeClasses = {
    small: { container: 'w-6 h-6', dot: 'w-1.5 h-1.5', wave: 'w-8', text: 'text-sm' },
    medium: { container: 'w-10 h-10', dot: 'w-2.5 h-2.5', wave: 'w-12', text: 'text-base' },
    large: { container: 'w-16 h-16', dot: 'w-4 h-4', wave: 'w-20', text: 'text-lg' }
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size].dot} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className="relative">
            <div className={`${sizeClasses[size].container} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping absolute`} />
            <div className={`${sizeClasses[size].container} bg-gradient-to-r from-blue-600 to-purple-700 rounded-full animate-pulse`} />
          </div>
        );

      case 'waves':
        return (
          <div className={`flex items-end space-x-1 ${sizeClasses[size].wave}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-pulse"
                style={{
                  height: `${20 + (i % 2) * 10}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'modern':
        return (
          <div className="relative">
            <div className={`${sizeClasses[size].container} relative`}>
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-400 border-l-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
            </div>
          </div>
        );

      default:
        return (
          <div className={`${sizeClasses[size].container} animate-spin text-blue-600`}>
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );
    }
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderSpinner()}
      {text && (
        <div className="text-center">
          <p className={`${sizeClasses[size].text} font-semibold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent`}>
            {text}
          </p>
          <div className="flex justify-center mt-2">
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)]"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
};

export default LoadingSpinner; 