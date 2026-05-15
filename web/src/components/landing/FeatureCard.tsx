import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}

export function FeatureCard({ icon: Icon, title, desc, color }: FeatureCardProps) {
  const isLightBg = color.includes('blue-100') || color.includes('blue-200') || color.includes('sky-100');
  const iconColorClass = isLightBg ? 'text-blue-600' : 'text-white';
  
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
      <div
        className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 shadow-md`}
      >
        <Icon className={iconColorClass} size={24} />
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  );
}
