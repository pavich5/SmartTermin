import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getInvitationByToken, acceptSalonInvitation } from '../services/salonService';
import { apiRequest } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser } from '../services/authService';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { PageContainer } from '../components/ui/PageContainer';

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkingUser, setCheckingUser] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const acceptanceTriggeredRef = useRef(false);

  useEffect(() => {
    if (!token) {
      toast.error(t('toast.invalidInvitationLink'));
      navigate('/');
      return;
    }

    loadInvitation();
  }, [token]);

  useEffect(() => {
    if (
      invitation &&
      isAuthenticated &&
      user &&
      !hasAccepted &&
      !accepting &&
      !acceptanceTriggeredRef.current
    ) {
      acceptanceTriggeredRef.current = true;
      handleAcceptInvitation();
    } else if (invitation && !isAuthenticated && !checkingUser) {
      checkIfUserExists();
    }
  }, [invitation, isAuthenticated, user]);

  const loadInvitation = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const inv = await getInvitationByToken(token);
      setInvitation(inv);
    } catch (error: any) {
      console.error('Failed to load invitation', error);
      toast.error(error?.message || t('toast.invalidInvitationLink'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserExists = async () => {
    if (!invitation) return;

    setCheckingUser(true);
    try {
      const email = invitation.email;
      const phone = invitation.phone;

      let exists = false;
      if (email) {
        const response = await apiRequest<{ exists: boolean }>(
          `/auth/check-exists?email=${encodeURIComponent(email)}`,
          { method: 'GET', auth: false }
        );
        exists = response.exists;
      } else if (phone) {
        const response = await apiRequest<{ exists: boolean }>(
          `/auth/check-exists?phone=${encodeURIComponent(phone)}`,
          { method: 'GET', auth: false }
        );
        exists = response.exists;
      }

      setUserExists(exists);

      if (exists) {
        const returnTo = `/accept-invitation?token=${token}`;
        navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
      } else {
        const returnTo = `/accept-invitation?token=${token}`;
        navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}&signup=true`);
      }
    } catch (error) {
      console.error('Failed to check if user exists', error);

      const returnTo = `/accept-invitation?token=${token}`;
      navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}&signup=true`);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token || !isAuthenticated || !user || hasAccepted || accepting) return;

    setAccepting(true);
    try {
      await acceptSalonInvitation(token);
      await refreshUser();
      // Get the fresh user data after refresh
      const updatedUser = await getCurrentUser();
      setHasAccepted(true);
      toast.success(t('toast.invitationAccepted'));

      // If user is a salon member (not owner) and has artistId, redirect to their dashboard
      if (updatedUser?.salonId && updatedUser?.salonRole === 'artist' && updatedUser?.artistId) {
        navigate(`/dashboard/${updatedUser.artistId}`);
      } else if (updatedUser?.salonId && updatedUser?.salonRole === 'owner') {
        // Owner should go to enterprise dashboard
        navigate('/enterprise');
      } else if (updatedUser?.artistId) {
        // Fallback: if they have artistId, go to their dashboard
        navigate(`/dashboard/${updatedUser.artistId}`);
      } else {
        // Default fallback
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Failed to accept invitation', error);
      toast.error(error?.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading || checkingUser) {
    return <LoadingState message="Loading invitation..." className="bg-blue-50" />;
  }

  if (!invitation) {
    return <ErrorState message="Invalid or expired invitation" className="bg-blue-50" />;
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <PageContainer maxWidth="md" padding={false}>
          <div className="w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept Invitation</h1>
            <p className="text-gray-600 mb-6">
              You've been invited to join a salon. Click below to accept.
            </p>
            <Button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="w-full px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl bg-sky-500 hover:bg-sky-600 text-white border-none"
            >
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }

  return <LoadingState message="Redirecting..." className="bg-blue-50" />;
}
