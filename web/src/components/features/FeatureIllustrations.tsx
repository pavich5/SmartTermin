import React from 'react';
import { LottieAnimation } from '../ui/LottieAnimation';
import seamlessBookingAnimation from '../../assets/lottie/seamless-booking.json';
import walkInAnimation from '../../assets/lottie/walk-in.json';
import professionalToolsAnimation from '../../assets/lottie/professional-tools.json';
import analyticsAnimation from '../../assets/lottie/analytics.json';
import secureAccountsAnimation from '../../assets/lottie/secure-accounts.json';
import securityAnimation from '../../assets/lottie/security.json';
import phoneVerifyAnimation from '../../assets/lottie/phone-verify.json';
import emailNotificationsAnimation from '../../assets/lottie/email-notifications.json';

interface SeamlessBookingIllustrationProps {
  isMobile?: boolean;
}

export function SeamlessBookingIllustration({
  isMobile = false,
}: SeamlessBookingIllustrationProps = {}) {
  return (
    <div className="w-full h-auto max-w-full flex items-center justify-center">
      <LottieAnimation
        animationData={seamlessBookingAnimation}
        className="w-full h-auto"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', minHeight: isMobile ? '300px' : '500px' }}
      />
    </div>
  );
}

export function WalkInIllustration() {
  return (
    <div className="w-full h-auto max-w-full">
      <LottieAnimation
        animationData={walkInAnimation}
        className="w-full h-auto"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
      />
    </div>
  );
}

export function ProfessionalToolsIllustration() {
  return (
    <div className="w-full h-auto max-w-full">
      <LottieAnimation
        animationData={professionalToolsAnimation}
        className="w-full h-auto"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
      />
    </div>
  );
}

export function AnalyticsIllustration() {
  return (
    <div className="w-full h-auto max-w-full">
      <LottieAnimation
        animationData={analyticsAnimation}
        className="w-full h-auto"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
      />
    </div>
  );
}

export function SecureAccountsIllustration() {
  return (
    <div className="w-full h-auto max-w-full">
      <LottieAnimation
        animationData={secureAccountsAnimation}
        className="w-full h-auto"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
      />
    </div>
  );
}

export function SecurityIllustration() {
  return (
    <div className="w-full h-auto max-w-full">
      <LottieAnimation
        animationData={securityAnimation}
        className="w-full h-auto"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
      />
    </div>
  );
}

export function PhoneVerifyIllustration() {
  return (
    <div className="w-full h-auto max-w-full">
      <LottieAnimation
        animationData={phoneVerifyAnimation}
        className="w-full h-auto"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
      />
    </div>
  );
}

export function EmailNotificationsIllustration() {
  return (
    <div className="w-full h-auto max-w-full">
      <LottieAnimation
        animationData={emailNotificationsAnimation}
        className="w-full h-auto"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
      />
    </div>
  );
}
