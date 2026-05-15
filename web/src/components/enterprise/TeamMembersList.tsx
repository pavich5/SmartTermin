import React from 'react';
import { MemberCard } from './MemberCard';
import { EmptyTeamState } from './EmptyTeamState';

interface Member {
  artistId: string;
  fullName: string;
  role: 'owner' | 'artist';
  bookings: number;
  revenue: number;
  profileImageUrl?: string | null;
}

interface TeamMembersListProps {
  members: Member[];
  isOwner: boolean;
  onRemove: (artistId: string, fullName: string) => void;
  t: ReturnType<typeof import('../../hooks/useTranslation').useTranslation>['t'];
}

export function TeamMembersList({ members, isOwner, onRemove, t }: TeamMembersListProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{t('enterprise.team.teamMembers')}</h2>
        <span className="text-sm text-gray-500">
          {members.length} {t('enterprise.team.active')}
        </span>
      </div>
      {members.length === 0 ? (
        <EmptyTeamState t={t} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <MemberCard
              key={member.artistId}
              member={member}
              isOwner={isOwner}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

