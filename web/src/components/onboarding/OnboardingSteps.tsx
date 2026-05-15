import React from 'react';
import { Check } from 'lucide-react';
import { useMediaQuery } from '../ui/use-mobile';

interface Step {
  number: number;
  title: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface OnboardingStepsProps {
  steps: Step[];
  currentStep: number;
}

export function OnboardingSteps({ steps, currentStep }: OnboardingStepsProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1 min-w-0 relative">
                <div
                  className={`w-12 h-12 min-w-[3rem] min-h-[3rem] max-w-[3rem] max-h-[3rem] rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 z-10 ${
                    isActive
                      ? 'bg-sky-500 border-transparent text-white'
                      : isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                {!isMobile && (
                  <span
                    className={`mt-2 text-xs sm:text-sm font-medium text-center leading-tight px-1 ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded -mt-6 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
