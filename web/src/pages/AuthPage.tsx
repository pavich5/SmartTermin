import React from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import SnowFall from 'react-snowfall';
import { useAuth } from '../contexts/AuthContext';
import { getOnboardingCompleted, setStoredAuth } from '../services/apiClient';
import { AuthPromoPanel } from '../components/auth/AuthPromoPanel';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { VerificationForm } from '../components/auth/VerificationForm';
import { DeactivatedAccountModal } from '../components/auth/DeactivatedAccountModal';
import { NotificationPermissionModal } from '../components/auth/NotificationPermissionModal';
import { handlePhoneNumberChange, isValidMacedonianPhoneNumber } from '../utils/phoneNumber';
import { reactivateAccount, deleteAccountPermanently } from '../services/authService';
import { PageContainer } from '../components/ui/PageContainer';

export function AuthPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, verifyPhone, setAuth } = useAuth();
  const [signupUserType, setSignupUserType] = useState<'artist' | 'client' | null>(null);

  const returnTo = searchParams.get('returnTo') || '/';
  const shouldCreateEnterprise = searchParams.get('createEnterprise') === 'true';
  const onboardingTarget = shouldCreateEnterprise ? '/onboarding?createEnterprise=true' : '/onboarding';
  const isSignupMode = searchParams.get('signup') === 'true';
  const autoSelectClient = searchParams.get('autoSelectClient') === 'true';
  const isInvitationFlow = returnTo.includes('/accept-invitation');

  React.useEffect(() => {
    if (isSignupMode) {
      setMode('signup');
    }
  }, [isSignupMode]);

  // Auto-select client type when coming from booking flow
  React.useEffect(() => {
    if (autoSelectClient && !isInvitationFlow) {
      setUserType('client');
      setMode('signup');
    }
  }, [autoSelectClient, isInvitationFlow]);

  const [loginPhone, setLoginPhone] = useState('+389');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('+389');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupDateOfBirth, setSignupDateOfBirth] = useState<string>('');
  const [userType, setUserType] = useState<'artist' | 'client'>('artist');

  // Lock user type to 'artist' for invitation flow
  React.useEffect(() => {
    if (isInvitationFlow && userType !== 'artist') {
      setUserType('artist');
    }
  }, [isInvitationFlow, userType]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [verificationCode, setVerificationCode] = useState('');
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [deactivatedUserId, setDeactivatedUserId] = useState<string | null>(null);
  const [isProcessingAccountAction, setIsProcessingAccountAction] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginPhone || !loginPassword) {
      setError(t('auth.errors.phonePasswordRequired'));
      return;
    }

    if (!isValidMacedonianPhoneNumber(loginPhone)) {
      setError(t('auth.errors.invalidPhoneNumber'));
      return;
    }

    setIsLoading(true);
    try {
      const authUser = await login(loginPhone, loginPassword);

      if (!authUser) {
        setError(t('auth.errors.invalidCredentials'));
        return;
      }

      if (authUser.isAccountDeactivated && authUser.userId) {
        setDeactivatedUserId(authUser.userId);
        setShowDeactivatedModal(true);
        setIsLoading(false);
        return;
      }

      if (returnTo.includes('/accept-invitation')) {
        navigate(returnTo);
        return;
      }

      // Determine where to navigate after notification modal
      let targetPath = returnTo;
      const onboardingCompleted =
        authUser.isOnboardingCompleted ?? authUser.onboardingCompleted ?? false;
      
      if (authUser.userType === 'artist' && !onboardingCompleted) {
        targetPath = onboardingTarget;
      } else if (authUser.userType === 'artist' && onboardingCompleted) {
        // Priority 1: If owner → /enterprise
        if (authUser.salonRole === 'owner') {
          targetPath = '/enterprise';
        } else if (authUser.salonRole === 'artist' && authUser.artistId) {
          // Priority 2: If part of salon (artist role) → /dashboard/:id
          targetPath = `/dashboard/${authUser.artistId}`;
        } else if (authUser.subscriptionPlan === 'pro') {
          // Priority 3: If on Pro plan → /dashboard
          targetPath = '/dashboard';
        } else {
          // Fallback: go to dashboard anyway
          targetPath = '/dashboard';
        }
      } else if (authUser.userType === 'client') {
        targetPath = '/profile';
      }

      // Check if notification permission should be requested
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        setPendingNavigation(targetPath);
        setShowNotificationModal(true);
      } else {
        navigate(targetPath);
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as any).status === 401) {
        setError(t('auth.errors.invalidCredentials'));
      } else if (
        err instanceof Error &&
        err.message &&
        !err.message.startsWith('Request failed with status')
      ) {
        setError(err.message);
      } else {
        setError(t('auth.errors.invalidCredentials'));
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateAccount = async () => {
    if (!deactivatedUserId) return;

    setIsProcessingAccountAction(true);
    try {
      const response = await reactivateAccount(deactivatedUserId);

      setAuth(response.token, response.user);

      const onboardingCompleted =
        response.user.isOnboardingCompleted ?? response.user.onboardingCompleted ?? false;
      if (response.user.userType === 'artist' && !onboardingCompleted) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }

      toast.success(t('auth.deactivatedAccount.reactivated'));
    } catch (error) {
      console.error('Failed to reactivate account:', error);
      toast.error(t('auth.deactivatedAccount.reactivateFailed'));
    } finally {
      setIsProcessingAccountAction(false);
      setShowDeactivatedModal(false);
    }
  };

  const handleCreateNewAccount = async () => {
    if (!deactivatedUserId) return;

    setIsProcessingAccountAction(true);
    try {
      await deleteAccountPermanently(deactivatedUserId);
      toast.success(t('auth.deactivatedAccount.accountDeleted'));

      setMode('signup');
      setShowDeactivatedModal(false);
      setDeactivatedUserId(null);
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(t('auth.deactivatedAccount.deleteFailed'));
    } finally {
      setIsProcessingAccountAction(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = signupName.trim();
    if (!trimmedName) {
      setError(t('auth.errors.nameRequired'));
      return;
    }

    if (trimmedName.length > 100) {
      setError(t('auth.errors.nameTooLong'));
      return;
    }

    if (!signupPhone || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setError(t('auth.errors.fillAllFields'));
      return;
    }

    if (!isValidMacedonianPhoneNumber(signupPhone)) {
      setError(t('auth.errors.invalidPhoneNumber'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    if (signupPassword.length < 6) {
      setError(t('auth.errors.passwordTooShort'));
      return;
    }

    if (!signupConfirmPassword) {
      setError(t('auth.errors.fillAllFields'));
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError(t('auth.errors.passwordsDontMatch'));
      return;
    }

    if (!agreedToTerms) {
      setError(t('auth.errors.agreeToTerms'));
      return;
    }

    setIsLoading(true);
    try {
      await signup(signupPhone, signupPassword, trimmedName, userType, signupEmail, signupDateOfBirth || undefined);
      setSignupUserType(userType);
      setShowVerification(true);
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as any).status === 401) {
        setError(t('auth.errors.signupFailed'));
      } else if (
        err instanceof Error &&
        err.message &&
        !err.message.startsWith('Request failed with status')
      ) {
        setError(err.message);
      } else {
        setError(t('auth.errors.signupFailed'));
      }
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationCode || verificationCode.length !== 6) {
      setError(t('auth.errors.codeRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const verifiedUser = await verifyPhone(signupPhone, verificationCode);
      if (!verifiedUser) {
        setError(t('auth.errors.invalidCode'));
        return;
      }
      const userTypeToCheck = signupUserType || verifiedUser.userType;

      if (returnTo.includes('/accept-invitation')) {
        navigate(returnTo);
        return;
      }

      // Determine where to navigate after notification modal
      let targetPath = returnTo;
      const onboardingCompleted =
        verifiedUser.isOnboardingCompleted ?? verifiedUser.onboardingCompleted ?? false;
      
      if (userTypeToCheck === 'artist' && !onboardingCompleted) {
        targetPath = onboardingTarget;
      } else if (userTypeToCheck === 'client') {
        // If coming from booking flow (returnTo is not default), redirect back to booking
        // Otherwise redirect to profile
        if (returnTo !== '/' && returnTo.startsWith('/book/')) {
          targetPath = returnTo;
        } else {
          targetPath = '/profile';
        }
      }

      // Check if notification permission should be requested
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        setPendingNavigation(targetPath);
        setShowNotificationModal(true);
      } else {
        navigate(targetPath);
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as any).status === 401) {
        setError(t('auth.errors.invalidCode'));
      } else if (
        err instanceof Error &&
        err.message &&
        !err.message.startsWith('Request failed with status')
      ) {
        setError(err.message);
      } else {
        setError(t('auth.errors.invalidCode'));
      }
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setVerificationCode('');
    if (!signupPhone || !signupPassword || !signupName || !signupUserType) return;
    try {
      await signup(signupPhone, signupPassword, signupName, signupUserType, signupEmail, signupDateOfBirth || undefined);
      toast.success(t('toast.verificationCodeSent'), {
        description: t('toast.verificationCodeSentDesc'),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.errors.signupFailed');
      setError(message || t('auth.errors.signupFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 py-12 flex items-center">
      <SnowFall 
        color="white" 
        snowflakeCount={200}
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <PageContainer maxWidth="6xl" className="w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AuthPromoPanel mode={mode} />

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            {!showVerification ? (
              <>
                {mode === 'login' && (
                  <LoginForm
                    loginPhone={loginPhone}
                    loginPassword={loginPassword}
                    isLoading={isLoading}
                    error={error}
                    onPhoneChange={(value) =>
                      handlePhoneNumberChange(loginPhone, value, setLoginPhone)
                    }
                    onPasswordChange={setLoginPassword}
                    onSubmit={handleLogin}
                    onSwitchToSignup={() => {
                      setMode('signup');
                      setError(null);
                    }}
                  />
                )}

                {mode === 'signup' && (
                  <SignupForm
                    signupName={signupName}
                    signupPhone={signupPhone}
                    signupEmail={signupEmail}
                    signupPassword={signupPassword}
                    signupConfirmPassword={signupConfirmPassword}
                    signupDateOfBirth={signupDateOfBirth}
                    userType={userType}
                    agreedToTerms={agreedToTerms}
                    isLoading={isLoading}
                    error={error}
                    userTypeLocked={isInvitationFlow}
                    onNameChange={setSignupName}
                    onPhoneChange={(value) =>
                      handlePhoneNumberChange(signupPhone, value, setSignupPhone)
                    }
                    onEmailChange={setSignupEmail}
                    onPasswordChange={setSignupPassword}
                    onConfirmPasswordChange={setSignupConfirmPassword}
                    onDateOfBirthChange={setSignupDateOfBirth}
                    onUserTypeChange={(type) => {
                      // Prevent changing user type if locked (invitation flow)
                      if (!isInvitationFlow) {
                        setUserType(type);
                      }
                    }}
                    onAgreedToTermsChange={setAgreedToTerms}
                    onSubmit={handleSignup}
                    onSwitchToLogin={() => {
                      setMode('login');
                      setError(null);
                    }}
                  />
                )}
              </>
            ) : (
              <VerificationForm
                phoneNumber={signupPhone}
                verificationCode={verificationCode}
                isLoading={isLoading}
                error={error}
                onCodeChange={setVerificationCode}
                onSubmit={handleVerification}
                onResendCode={handleResendCode}
              />
            )}
          </div>
        </div>
      </PageContainer>

      <DeactivatedAccountModal
        show={showDeactivatedModal}
        userId={deactivatedUserId || ''}
        onReactivate={handleReactivateAccount}
        onCreateNew={handleCreateNewAccount}
        isProcessing={isProcessingAccountAction}
      />

      <NotificationPermissionModal
        show={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          if (pendingNavigation) {
            navigate(pendingNavigation);
            setPendingNavigation(null);
          }
        }}
        onComplete={() => {
          setShowNotificationModal(false);
          if (pendingNavigation) {
            navigate(pendingNavigation);
            setPendingNavigation(null);
          }
        }}
      />
    </div>
  );
}
