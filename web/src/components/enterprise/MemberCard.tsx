import React from 'react';
import { Trash2, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useTranslation } from '../../hooks/useTranslation';

interface MemberCardProps {
  member: {
    artistId: string;
    fullName: string;
    role: 'owner' | 'artist';
    bookings: number;
    revenue: number;
    profileImageUrl?: string | null;
  };
  isOwner: boolean;
  onRemove: (artistId: string, fullName: string) => void;
}

export function MemberCard({ member, isOwner, onRemove }: MemberCardProps) {
  const { t } = useTranslation();
  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-sky-500 flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
            {member.profileImageUrl ? (
              <ImageWithFallback
                src={member.profileImageUrl}
                alt={member.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{member.fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 text-base mb-2">{member.fullName}</div>
            <div className="flex items-center gap-2">
              {member.role === 'owner' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-sky-600 text-sm font-medium">
                  <Crown size={14} />
                  {t('enterprise.team.owner')}
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                  {t('enterprise.team.artist')}
                </span>
              )}
            </div>
          </div>
        </div>
        {isOwner && member.role !== 'owner' && (
          <Button
            onClick={() => onRemove(member.artistId, member.fullName)}
            variant="ghost"
            size="sm"
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex-shrink-0"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-500 mb-1.5 font-medium">{t('enterprise.team.bookings')}</div>
          <div className="text-xl font-bold text-gray-900">{member.bookings}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1.5 font-medium">{t('enterprise.team.revenue')}</div>
          <div className="text-xl font-bold text-gray-900">{member.revenue.toLocaleString()} ден.</div>
        </div>
      </div>
    </div>
  );
}

