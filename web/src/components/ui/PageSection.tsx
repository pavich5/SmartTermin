import React from 'react';

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gradient' | 'gray';
}

const backgroundClasses = {
  white: 'bg-white',
  gradient: 'bg-blue-50',
  gray: 'bg-gray-50',
};

export function PageSection({
  children,
  className = '',
  background = 'white',
}: PageSectionProps) {
  return (
    <section className={`${backgroundClasses[background]} ${className}`}>
      {children}
    </section>
  );
}


