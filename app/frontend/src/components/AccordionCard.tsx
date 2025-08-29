import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface AccordionCardProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const AccordionCard = ({ 
  title, 
  children, 
  defaultOpen = false,
  className = ''
}: AccordionCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md ${isOpen ? 'ring-1 ring-primary-100' : ''} ${className}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className={`text-lg font-medium ${isOpen ? 'text-primary-700' : 'text-slate-900 group-hover:text-primary-600'}`}>{title}</h3>
        <ChevronDownIcon 
          className={`h-5 w-5 transition-all duration-300 ${isOpen ? 'rotate-180 text-primary-600' : 'text-slate-500 group-hover:text-primary-500'}`} 
        />
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}; 