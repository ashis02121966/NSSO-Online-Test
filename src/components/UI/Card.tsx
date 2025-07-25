import React, { ReactNode } from 'react';
import { cn } from '../../utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ children, className, padding = 'md', onClick }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 shadow-sm',
      onClick && 'cursor-pointer hover:shadow-md transition-shadow',
      paddingClasses[padding],
      className
    )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}