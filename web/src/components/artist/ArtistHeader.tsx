import React from 'react';
import { MapPin, Star, Calendar } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTranslateProfession } from '../../utils/translateProfession';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useMediaQuery } from '../ui/use-mobile';

interface ArtistHeaderProps {
  bannerImage: string;
  profileImage: string;
  name: string;
  profession: string;
  rating: number;
  reviews: number;
  location: string;
  onBookNow: () => void;
  showBookNow?: boolean;
}

export function ArtistHeader({
  bannerImage,
  profileImage,
  name,
  profession,
  rating,
  reviews,
  location,
  onBookNow,
  showBookNow = true,
}: ArtistHeaderProps) {
  const { t } = useTranslation();
  const translateProfession = useTranslateProfession();
  const isMobile = useMediaQuery('(max-width: 768px)');
  return (
    <>
      <div className="relative h-80">
        <ImageWithFallback
          src={bannerImage}
          alt={t('artistProfile.bannerAlt')}
          className="w-full h-full object-cover"
          width={1920}
          height={320}
          priority={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-8" style={{ marginTop: isMobile ? '-150px' : '-100px' }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                  <ImageWithFallback
                    src={profileImage}
                    alt={name}
                    className="w-full h-full object-cover"
                    width={128}
                    height={128}
                    priority={true}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl mb-2">{name}</h1>
                <p className="text-gray-600 text-lg mb-3">{translateProfession(profession)}</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="fill-yellow-400 text-yellow-400" size={20} />
                    <span className="text-lg">{rating}</span>
                    <span className="text-gray-600">
                      ({reviews} {t('artistProfile.reviews')})
                    </span>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} />
                    <span className="text-sm">{location}</span>
                  </div>
                </div>
              </div>
              {showBookNow && (
                <Button
                  onClick={onBookNow}
                  className="hidden md:flex bg-sky-500 hover:bg-sky-600 text-white px-8 py-6 rounded-full shadow-lg whitespace-nowrap"
                >
                  <Calendar className="mr-2" size={20} />
                  {t('artistProfile.bookNow')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
