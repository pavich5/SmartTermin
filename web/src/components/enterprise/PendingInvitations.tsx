import React from 'react';
import { Mail, Phone, X } from 'lucide-react';
import { Button } from '../ui/button';

interface PendingInvitation {
  id: string;
  email?: string;
  phone?: string;
  expiresAt: string;
}

interface PendingInvitationsProps {
  invitations: PendingInvitation[];
  isOwner: boolean;
  loading: boolean;
  onCancel: (id: string) => void;
  t: ReturnType<typeof import('../../hooks/useTranslation').useTranslation>['t'];
}

export function PendingInvitations({
  invitations,
  isOwner,
  loading,
  onCancel,
  t,
}: PendingInvitationsProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t('enterprise.team.pendingInvitations')}
      </h2>
      <div className="space-y-3">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div className="flex items-center gap-3">
              {inv.email ? (
                <Mail size={18} className="text-gray-400" />
              ) : (
                <Phone size={18} className="text-gray-400" />
              )}
              <div>
                <div className="font-medium text-gray-900">{inv.email || inv.phone}</div>
                <div className="text-sm text-gray-500">
                  {t('enterprise.team.expires')} {new Date(inv.expiresAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                {t('enterprise.team.pending')}
              </span>
              {isOwner && (
                <Button
                  onClick={() => onCancel(inv.id)}
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  disabled={loading}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

