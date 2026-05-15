import React from 'react';
import { XCircle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  className?: string;
}

export function ErrorState({ message, className = '' }: ErrorStateProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}







