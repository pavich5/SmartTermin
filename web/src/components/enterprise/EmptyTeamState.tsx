import React from 'react';
import { Users } from 'lucide-react';

interface EmptyTeamStateProps {
  t: ReturnType<typeof import('../../hooks/useTranslation').useTranslation>['t'];
}

export function EmptyTeamState({ t }: EmptyTeamStateProps) {
  return (
    <div className="text-center py-12">
      <Users size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500">{t('enterprise.team.noTeamMembers')}</p>
      <p className="text-sm text-gray-400 mt-1">{t('enterprise.team.inviteToStart')}</p>
    </div>
  );
}

