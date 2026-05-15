import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className = '' }: PageHeaderProps) {
  const hasNoMxAuto = className.includes('[&_p]:!mx-0') || className.includes('[&_p]:mx-0');
  return (
    <div className={`text-center ${className}`}>
      <h3 className="text-5xl md:text-2xl lg:text-3xl tracking-tight mb-6 text-sky-700">
        {title}
      </h3>
      {subtitle && <p className={`text-xl text-gray-600 max-w-3xl ${hasNoMxAuto ? '' : 'mx-auto'}`}>{subtitle}</p>}
    </div>
  );
}


