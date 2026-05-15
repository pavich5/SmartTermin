import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useMediaQuery } from '../ui/use-mobile';

interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  color: string;
  image: string | React.ComponentType<{ isMobile?: boolean }>;
  isReversed: boolean;
}

export function FeatureItem({
  icon: Icon,
  title,
  description,
  features,
  color,
  image,
  isReversed,
}: FeatureItemProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const ImageComponent = typeof image === 'string' ? null : image;
  const imageUrl = typeof image === 'string' ? image : null;

  return (
    <div
      className={`grid lg:grid-cols-2 gap-12 items-center ${
        isReversed ? 'lg:flex-row-reverse' : ''
      }`}
    >
      <div className={isReversed ? 'lg:order-2' : ''}>
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${color} mb-6 shadow-lg`}
        >
          <Icon className={color.includes('blue-200') ? 'text-blue-600' : 'text-white'} size={32} />
        </div>
        <h2 className="text-3xl mb-4">{title}</h2>
        <p className="text-gray-600 text-lg mb-6 leading-relaxed">{description}</p>
        <ul className="space-y-3">
          {features.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full ${color} flex items-center justify-center flex-shrink-0`}
              >
                <span className={color.includes('blue-200') ? 'text-blue-600 text-xs' : 'text-white text-xs'}>✓</span>
              </div>
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={isReversed ? 'lg:order-1' : ''}>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
          {ImageComponent ? (
            <ImageComponent isMobile={isMobile} />
          ) : (
            <>
              <ImageWithFallback src={imageUrl!} alt={title} className="w-full h-auto" />
              <div className={`absolute inset-0 ${color} opacity-10`} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
