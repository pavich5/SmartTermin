import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useTranslation } from '../../hooks/useTranslation';

interface ArtistHeaderProps {
  artistId: string | undefined;
  profileImage: string;
  name: string;
  profession: string;
  onBack: () => void;
}

export function ArtistHeader({
  artistId,
  profileImage,
  name,
  profession,
  onBack,
}: ArtistHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2" size={20} />
        {t('booking.back')}
      </Button>
      <div className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 md:border-4 border-white shadow-lg flex-shrink-0">
          <ImageWithFallback src={profileImage} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">{name}</h1>
          <p className="text-sm md:text-base text-gray-600 truncate">{profession}</p>
        </div>
      </div>
    </div>
  );
}
