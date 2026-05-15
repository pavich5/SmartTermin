import React from 'react';
import { LottieAnimation } from '../ui/LottieAnimation';
import heroAnimation from '../../assets/lottie/hero-dashboard.json';

export function HeroIllustration() {
  return (
    <div className="max-w-4xl mx-auto bg-transparent">
      <LottieAnimation
        animationData={heroAnimation}
        className="w-full max-h-[650px]"
        loop={true}
        autoplay={true}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
      />
    </div>
  );
}
