import React from 'react';
import { MapPin, Star, Building2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTranslateProfession } from '../../utils/translateProfession';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Badge } from '../ui/badge';

interface Artist {
  id: string;
  name: string;
  profession: string;
  image: string;
  services: string[];
  price: string;
  location: string;
  rating: number;
  reviews?: number;
  customBookingLink?: string;
  salonId?: string;
}

interface ArtistCardProps {
  artist: Artist;
  onViewProfile: (link: string) => void;
  onBookNow: (id: string) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onViewProfile, onBookNow }) => {
  const { t } = useTranslation();
  const translateProfession = useTranslateProfession();

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative h-64">
        <ImageWithFallback
          src={artist.image}
          alt={artist.name}
          className="w-full h-full object-cover"
          width={400}
          height={256}
          loading="lazy"
        />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {artist.rating > 0 && (
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{artist.rating}</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-xl flex-1">{artist.name}</h3>
          {artist.salonId && (
            <Badge variant="secondary" className="bg-blue-50 text-sky-600 border-blue-200 hover:bg-blue-100 flex-shrink-0">
              <Building2 size={12} />
              <span className="ml-1">{t('directory.artist.salon')}</span>
            </Badge>
          )}
        </div>
        <p className="text-gray-600 mb-4">{translateProfession(artist.profession)}</p>
        <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
          <MapPin size={16} />
          <span>{artist.location}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {artist.services.slice(0, 3).map((service, idx) => (
            <span key={idx} className="bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-xs">
              {service}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                // Use custom booking link if available, otherwise use ID
                const profileLink = artist.customBookingLink || artist.id;
                onViewProfile(profileLink);
              }}
              variant="outline"
              className="rounded-full"
            >
              {t('directory.artist.viewProfile')}
            </Button>
            <Button
              onClick={() => {
                // Use custom booking link if available, otherwise use ID
                const bookingId = artist.customBookingLink || artist.id;
                onBookNow(bookingId);
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-full"
            >
              {t('directory.artist.bookNow')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
