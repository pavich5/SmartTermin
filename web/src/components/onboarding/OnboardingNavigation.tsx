import React from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { useMediaQuery } from '../ui/use-mobile';

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

export function OnboardingNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onComplete,
  isLoading = false,
}: OnboardingNavigationProps) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="flex justify-between items-center mt-8 pt-6">
      <Button
        onClick={onBack}
        variant="outline"
        className="rounded-full px-6"
        disabled={currentStep === 1}
      >
        {t('onboarding.navigation.back')}
      </Button>
      {!isMobile && (
        <div className="text-sm text-gray-500">
          {t('onboarding.navigation.step')} {currentStep} {t('onboarding.navigation.of')} {totalSteps}
        </div>
      )}
      {currentStep < totalSteps ? (
        <Button
          onClick={onNext}
          disabled={isLoading}
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6 disabled:opacity-50"
        >
          {isLoading ? t('onboarding.navigation.saving') : t('onboarding.navigation.next')}
          {!isLoading && <ChevronRight size={18} className="ml-2" />}
        </Button>
      ) : (
        <Button
          onClick={onComplete}
          disabled={isLoading}
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6 disabled:opacity-50"
        >
          {isLoading ? t('onboarding.navigation.saving') : t('onboarding.navigation.complete')}
          {!isLoading && <Check size={18} className="ml-2" />}
        </Button>
      )}
    </div>
  );
}
