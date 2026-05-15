import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
} from 'lucide-react';
import { useSalon } from '../contexts/SalonContext';
import { inviteArtist, removeMember, cancelInvitation } from '../services/salonService';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { formatPhoneNumber, formatPhoneNumberDisplay } from '../utils/phoneNumber';
import { useTranslation } from '../hooks/useTranslation';
import { PageContainer } from '../components/ui/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { TeamStats } from '../components/enterprise/TeamStats';
import { TrialBanner } from '../components/enterprise/TrialBanner';
import { InviteForm } from '../components/enterprise/InviteForm';
import { PendingInvitations } from '../components/enterprise/PendingInvitations';
import { TeamMembersList } from '../components/enterprise/TeamMembersList';
import { LoadingState } from '../components/ui/LoadingState';

export function TeamManagementPage() {
  const { t } = useTranslation();
  const { salon, members, refreshMembers, refresh, isOwner } = useSalon();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const [contact, setContact] = useState('+389');
  const [role, setRole] = useState<'owner' | 'artist'>('artist');
  const [message, setMessage] = useState("You've been invited to join our salon on Smart Termin.");
  const [memberToRemove, setMemberToRemove] = useState<{ artistId: string; fullName: string } | null>(null);

  useEffect(() => {
    refreshMembers();
  }, []);

  const handleInvite = async () => {
    if (!salon || !isOwner) return;

    if (salon.subscription?.status === 'trial') {
      const currentCount = salon.members?.length || 0;
      const trialLimit = salon.subscription.artistCount || 0;
      if (trialLimit > 0 && currentCount >= trialLimit) {
        toast.error(t('enterprise.team.trialLimitReached'), {
          description: t('enterprise.team.trialMaxArtists', { limit: trialLimit }),
          action: {
            label: t('enterprise.team.subscribe'),
            onClick: () => navigate('/enterprise'),
          },
        });
        return;
      }
    }

    setLoading(true);
    try {
      const invitation = await inviteArtist(salon.id, {
        email: method === 'email' ? contact : undefined,
        phone: method === 'phone' ? contact : undefined,
        role,
        message,
      });

      toast.success(t('enterprise.team.invitationSent'));

      setContact(method === 'phone' ? '+389' : '');
      await refresh();
      await refreshMembers();
    } catch (error) {
      toast.error(t('enterprise.team.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClick = (artistId: string, fullName: string) => {
    setMemberToRemove({ artistId, fullName });
  };

  const handleRemoveConfirm = async () => {
    if (!salon || !isOwner || !memberToRemove) return;
    setLoading(true);
    try {
      await removeMember(salon.id, memberToRemove.artistId);
      toast.success(t('enterprise.team.artistRemoved'));
      refreshMembers();
      setMemberToRemove(null);
    } catch (error) {
      toast.error(t('enterprise.team.removeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCancel = () => {
    setMemberToRemove(null);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!salon || !isOwner) return;
    setLoading(true);
    try {
      await cancelInvitation(salon.id, invitationId);
      toast.success(t('enterprise.team.invitationCancelled'));
      await refresh();
      await refreshMembers();
    } catch (error) {
      toast.error(t('enterprise.team.cancelFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!salon) {
    return <LoadingState message="Loading..." className="bg-blue-50" />;
  }

  const totalBookings = members.reduce((sum, m) => sum + m.bookings, 0);
  const totalRevenue = members.reduce((sum, m) => sum + m.revenue, 0);

  return (
    <div className="min-h-screen bg-blue-50">
      <PageContainer maxWidth="7xl" className="pt-8 sm:pt-16 pb-8 space-y-6">
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/enterprise')}
            variant="outline"
            className="md:hidden px-3 py-2 rounded-full border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-gray-50"
          >
            <ArrowLeft size={16} className="mr-1" />
            {t('enterprise.team.back')}
          </Button>
          <div className="flex items-start justify-between gap-4">
            <PageHeader
              title={t('enterprise.team.title')}
              subtitle={t('enterprise.team.description')}
              className="text-left mb-0 [&_p]:!mx-0 flex-1"
            />
            <Button
              onClick={() => navigate('/enterprise')}
              variant="outline"
              className="hidden md:flex px-3 py-2 rounded-full border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-gray-50 flex-shrink-0 mt-6"
            >
              <ArrowLeft size={16} className="mr-1" />
              {t('enterprise.team.back')}
            </Button>
          </div>
        </div>

        {salon.subscription?.status === 'trial' && (
          <TrialBanner
            daysRemaining={null}
            memberCount={members.length}
            limit={salon.subscription?.artistCount || null}
            limitReached={
              Boolean(salon.subscription?.artistCount) &&
              members.length >= (salon.subscription?.artistCount || 0)
            }
            onSubscribe={() => navigate('/enterprise')}
          />
        )}

        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-2 lg:p-8 space-y-6">
          <TeamStats
            memberCount={members.length}
            totalBookings={totalBookings}
            totalRevenue={totalRevenue}
          />

          <InviteForm
            method={method}
            contact={contact}
            role={role}
            message={message}
            loading={loading}
            onMethodChange={(method) => {
              setMethod(method);
              setContact(method === 'phone' ? '+389' : '');
            }}
            onContactChange={setContact}
            onRoleChange={setRole}
            onMessageChange={setMessage}
            onSubmit={handleInvite}
            formatPhoneNumberDisplay={formatPhoneNumberDisplay}
            formatPhoneNumber={formatPhoneNumber}
          />

          {salon.pendingInvitations && salon.pendingInvitations.length > 0 && (
            <PendingInvitations
              invitations={salon.pendingInvitations}
              isOwner={isOwner}
              loading={loading}
              onCancel={handleCancelInvitation}
              t={t}
            />
          )}

          <TeamMembersList members={members} isOwner={isOwner} onRemove={handleRemoveClick} t={t} />
        </div>
      </PageContainer>

      {memberToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleRemoveCancel}>
          <div 
            style={{ maxWidth: '448px' }}
            className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('enterprise.team.confirmRemove') || 'Remove Team Member?'}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('enterprise.team.confirmRemoveMessage', { name: memberToRemove.fullName || 'this member' }) ||
                  `Are you sure you want to remove ${memberToRemove.fullName || 'this member'} from your salon? This action cannot be undone.`}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={handleRemoveCancel}
                  variant="outline"
                  disabled={loading}
                  className="rounded-lg"
                >
                  {t('enterprise.team.cancel') || 'Cancel'}
                </Button>
                <Button
                  onClick={handleRemoveConfirm}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  {loading
                    ? t('enterprise.team.removing') || 'Removing...'
                    : t('enterprise.team.remove') || 'Remove'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
