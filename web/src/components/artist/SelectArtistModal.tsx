import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTranslateProfession } from '../../utils/translateProfession';
import { SalonMember } from '../../types/salon';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface SelectArtistModalProps {
  show: boolean;
  onClose: () => void;
  salonName: string;
  artists: SalonMember[];
  onSelectArtist: (artistId: string) => void;
}

export function SelectArtistModal({
  show,
  onClose,
  salonName,
  artists,
  onSelectArtist,
}: SelectArtistModalProps) {
  const { t } = useTranslation();
  const translateProfession = useTranslateProfession();
  const navigate = useNavigate();

  if (!show) return null;

  const handleSelect = (artistId: string) => {
    onSelectArtist(artistId);
    onClose();
  };

  const handleViewProfile = (e: React.MouseEvent, artistId: string) => {
    e.stopPropagation();
    navigate(`/artist/${artistId}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('artistProfile.selectArtist.title')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('artistProfile.selectArtist.subtitle', { salonName })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {artists.map((artist) => (
              <button
                key={artist.artistId}
                onClick={() => handleSelect(artist.artistId)}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-blue-100 flex-shrink-0 flex items-center justify-center">
                  {artist.profileImageUrl ? (
                    <ImageWithFallback
                      src={artist.profileImageUrl}
                      alt={artist.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sky-600 font-bold text-xl">
                      {artist.fullName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{artist.fullName}</h3>
                  <p className="text-sm text-gray-500">
                    {artist.profession
                      ? translateProfession(artist.profession)
                      : artist.role === 'owner'
                        ? t('enterprise.dashboard.role.owner')
                        : t('enterprise.dashboard.role.artist')}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={(e) => handleViewProfile(e, artist.artistId)}
                  >
                    {t('directory.artist.viewProfile')}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(artist.artistId);
                    }}
                  >
                    {t('artistProfile.selectArtist.select')}
                  </Button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
