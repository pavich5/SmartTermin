import { useEffect, useState } from 'react';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Image as ImageIcon, Scissors, Clock, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import { OnboardingSteps } from '../components/onboarding/OnboardingSteps';
import { BasicInfoStep } from '../components/onboarding/BasicInfoStep';
import { ImagesStep } from '../components/onboarding/ImagesStep';
import { ServiceStep } from '../components/onboarding/ServiceStep';
import { WorkingHoursStep } from '../components/onboarding/WorkingHoursStep';
import { BookingSettingsStep } from '../components/onboarding/BookingSettingsStep';
import { OnboardingNavigation } from '../components/onboarding/OnboardingNavigation';
import { updateArtistProfile } from '../services/authService';
import { uploadPortfolioImage } from '../services/portfolioService';
import { createService } from '../services/serviceService';
import {
  updateWorkingHours as updateWorkingHoursAPI,
  WorkingHoursResponse,
} from '../services/settingsService';
import { setOnboardingCompleted } from '../services/apiClient';
import { PageContainer } from '../components/ui/PageContainer';
import { useMediaQuery } from '../components/ui/use-mobile';

type Break = {
  start: string;
  end: string;
};

type WorkingHours = {
  start: string;
  end: string;
  closed: boolean;
  breaks?: Break[];
};

type WorkingHoursData = {
  monday: WorkingHours;
  tuesday: WorkingHours;
  wednesday: WorkingHours;
  thursday: WorkingHours;
  friday: WorkingHours;
  saturday: WorkingHours;
  sunday: WorkingHours;
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser, refreshUser, isAuthenticated, token } = useAuth();
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const shouldCreateEnterprise = searchParams.get('createEnterprise') === 'true';
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [basicInfo, setBasicInfo] = useState({
    profession: '',
    businessName: '',
    address: '',
    city: '',
    about: '',
    customBookingLink: '',
  });

  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [bannerImageId, setBannerImageId] = useState<string | null>(null);
  const [profileImageId, setProfileImageId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [service, setService] = useState({
    name: '',
    duration: '',
    price: '',
    description: '',
  });

  const [workingHours, setWorkingHours] = useState<WorkingHoursData>({
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '20:00', closed: false },
    friday: { start: '09:00', end: '20:00', closed: false },
    saturday: { start: '10:00', end: '17:00', closed: false },
    sunday: { start: '09:00', end: '18:00', closed: true },
  });

  const [maxCancellationHours, setMaxCancellationHours] = useState<number>(24);

  useEffect(() => {
    if (!user || user.userType !== 'artist') {
      navigate('/');
      return;
    }

    if (!isAuthenticated || !token) {
      console.error('No authentication token available in OnboardingPage');
      navigate('/auth');
    }
  }, [user, navigate, isAuthenticated, token]);

  if (!user || user.userType !== 'artist') {
    return null;
  }

  const handleImageUpload = (
    file: File | null,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void,
    type: 'banner' | 'profile'
  ) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    const isValidType = allowedTypes.includes(file.type.toLowerCase());
    const isValidExtension = allowedExtensions.includes(fileExtension);

    if (!isValidType || !isValidExtension) {
      toast.error(t('toast.onboarding.invalidFileType'), {
        description:
          t('toast.onboarding.invalidFileTypeDesc') || 'Please select a JPG or PNG image file.',
      });
      return;
    }

    if (type === 'banner' && file.size > 5 * 1024 * 1024) {
      toast.error(t('toast.onboarding.bannerTooLarge'), {
        description: t('toast.onboarding.bannerTooLargeDesc'),
      });
      return;
    }

    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    setFile(null);
    setPreview(null);
  };

  const updateWorkingHours = (
    day: keyof WorkingHoursData,
    field: keyof WorkingHours,
    value: string | boolean
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleBreakAdd = (day: keyof WorkingHoursData, breakData: { start: string; end: string }) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: [...(prev[day].breaks || []), { start: breakData.start, end: breakData.end }],
      },
    }));
  };

  const handleBreakAddToAll = (breakData: { start: string; end: string }) => {
    setWorkingHours((prev) => {
      const updated = { ...prev };
      const dayKeys: Array<keyof WorkingHoursData> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      dayKeys.forEach((dayKey) => {
        const dayHours = updated[dayKey];
        if (!dayHours.closed) {
          updated[dayKey] = {
            ...dayHours,
            breaks: [
              ...(dayHours.breaks || []),
              { start: breakData.start, end: breakData.end },
            ],
          };
        }
      });
      
      return updated;
    });
  };

  const handleBreakRemove = (day: keyof WorkingHoursData, breakIndex: number) => {
    setWorkingHours((prev) => {
      const dayData = prev[day];
      const breaks = dayData.breaks || [];
      return {
        ...prev,
        [day]: {
          ...dayData,
          breaks: breaks.filter((_, index) => index !== breakIndex),
        },
      };
    });
  };

  const handleBreakChange = (
    day: keyof WorkingHoursData,
    breakIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setWorkingHours((prev) => {
      const dayData = prev[day];
      const breaks = [...(dayData.breaks || [])];
      breaks[breakIndex] = {
        ...breaks[breakIndex],
        [field]: value,
      };
      return {
        ...prev,
        [day]: {
          ...dayData,
          breaks,
        },
      };
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!basicInfo.profession.trim()) {
          toast.error(t('toast.onboarding.professionRequired'));
          return false;
        }
        if (!user?.salonId && !basicInfo.businessName.trim()) {
          toast.error(t('toast.onboarding.businessNameRequired'));
          return false;
        }
        if (!basicInfo.address.trim()) {
          toast.error(t('toast.onboarding.addressRequired'));
          return false;
        }
        if (!basicInfo.city.trim()) {
          toast.error(t('toast.onboarding.cityRequired'));
          return false;
        }
        return true;
      case 2:
        if (!bannerImage) {
          toast.error(t('toast.onboarding.bannerRequired'));
          return false;
        }
        if (!profileImage) {
          toast.error(t('toast.onboarding.profileRequired'));
          return false;
        }
        return true;
      case 3:
        if (!service.name.trim()) {
          toast.error(t('toast.onboarding.serviceNameRequired'));
          return false;
        }
        if (!service.duration || parseInt(service.duration) <= 0) {
          toast.error(t('toast.onboarding.durationRequired'));
          return false;
        }
        if (!service.price || parseFloat(service.price) <= 0) {
          toast.error(t('toast.onboarding.priceRequired'));
          return false;
        }
        return true;
      case 4:
        const hoursArray = Object.values(workingHours) as WorkingHours[];
        const hasOpenDay = hoursArray.some((day) => !day.closed);
        if (!hasOpenDay) {
          toast.error(t('toast.onboarding.openDayRequired'));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSaving(true);
    try {
      switch (currentStep) {
        case 1:
          await updateArtistProfile({
            profession: basicInfo.profession,
            ...(user?.salonId ? {} : { businessName: basicInfo.businessName }),
            address: basicInfo.address,
            city: basicInfo.city,
            country: 'Macedonia',
            about: basicInfo.about || undefined,
            customBookingLink: basicInfo.customBookingLink || undefined,
          });
          toast.success(t('toast.onboarding.stepSaved'));
          break;

        case 2:
          if (!bannerImage || !profileImage) {
            toast.error(t('toast.onboarding.imagesMissing'));
            setIsSaving(false);
            return;
          }

          const bannerResult = await uploadPortfolioImage(bannerImage, true, false);
          setBannerImageId(bannerResult.id);

          const profileResult = await uploadPortfolioImage(profileImage, false, true);
          setProfileImageId(profileResult.id);

          toast.success(t('toast.onboarding.stepSaved'));
          break;

        case 3:
          await createService({
            name: service.name,
            duration: parseInt(service.duration, 10),
            price: parseFloat(service.price),
            description: service.description || '',
          });
          toast.success(t('toast.onboarding.stepSaved'));
          break;

        case 4:
          const workingHoursPayload: WorkingHoursResponse = {
            monday: {
              start: workingHours.monday.start,
              end: workingHours.monday.end,
              closed: workingHours.monday.closed,
              breaks: workingHours.monday.breaks,
            },
            tuesday: {
              start: workingHours.tuesday.start,
              end: workingHours.tuesday.end,
              closed: workingHours.tuesday.closed,
              breaks: workingHours.tuesday.breaks,
            },
            wednesday: {
              start: workingHours.wednesday.start,
              end: workingHours.wednesday.end,
              closed: workingHours.wednesday.closed,
              breaks: workingHours.wednesday.breaks,
            },
            thursday: {
              start: workingHours.thursday.start,
              end: workingHours.thursday.end,
              closed: workingHours.thursday.closed,
              breaks: workingHours.thursday.breaks,
            },
            friday: {
              start: workingHours.friday.start,
              end: workingHours.friday.end,
              closed: workingHours.friday.closed,
              breaks: workingHours.friday.breaks,
            },
            saturday: {
              start: workingHours.saturday.start,
              end: workingHours.saturday.end,
              closed: workingHours.saturday.closed,
              breaks: workingHours.saturday.breaks,
            },
            sunday: {
              start: workingHours.sunday.start,
              end: workingHours.sunday.end,
              closed: workingHours.sunday.closed,
              breaks: workingHours.sunday.breaks,
            },
          };
          await updateWorkingHoursAPI(workingHoursPayload);
          toast.success(t('toast.onboarding.stepSaved'));
          break;

        case 5:
          await updateArtistProfile({
            maximumCancellationHours: maxCancellationHours,
          });

          setOnboardingCompleted(true);

          updateUser({ onboardingCompleted: true, isOnboardingCompleted: true });

          await new Promise((resolve) => setTimeout(resolve, 200));

          await refreshUser();

          toast.success(t('toast.onboarding.completed'), {
            description: t('toast.onboarding.completedDesc'),
            duration: 2000,
          });

          if (shouldCreateEnterprise) {
            navigate('/enterprise/create', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
          setIsSaving(false);
          return;
      }

      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        if (isMobile) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        await updateArtistProfile({
          maximumCancellationHours: maxCancellationHours,
        });

        updateUser({ onboardingCompleted: true, isOnboardingCompleted: true });
        setOnboardingCompleted(true);

        await refreshUser();

        toast.success(t('toast.onboarding.completed'), {
          description: t('toast.onboarding.completedDesc'),
          duration: 3000,
        });

        if (shouldCreateEnterprise) {
          navigate('/enterprise/create', { replace: true });
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error saving step:', error);
      toast.error(t('toast.onboarding.stepSaveFailed'), {
        description:
          error instanceof Error ? error.message : t('toast.onboarding.stepSaveFailedDesc'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (currentStep === 5) {
      try {
        await updateArtistProfile({
          maximumCancellationHours: maxCancellationHours,
        });
        updateUser({ onboardingCompleted: true });
        setOnboardingCompleted(true);
        toast.success(t('toast.onboarding.completed'), {
          description: t('toast.onboarding.completedDesc'),
          duration: 3000,
        });
        if (shouldCreateEnterprise) {
          navigate('/enterprise/create', { replace: true });
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error saving cancellation time:', error);
        toast.error(t('toast.onboarding.stepSaveFailed'), {
          description: t('toast.onboarding.stepSaveFailedDesc'),
        });
      }
    }
  };

  const steps = [
    { number: 1, title: t('onboarding.steps.basicInfo'), icon: User },
    { number: 2, title: t('onboarding.steps.images'), icon: ImageIcon },
    { number: 3, title: t('onboarding.steps.service'), icon: Scissors },
    { number: 4, title: t('onboarding.steps.workingHours'), icon: Clock },
    { number: 5, title: t('onboarding.steps.bookingSettings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-blue-50 py-12">
      <PageContainer maxWidth="4xl">
        <OnboardingSteps steps={steps} currentStep={currentStep} />

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className={currentStep === 4 ? 'p-6 md:p-12' : 'p-8 md:p-12'}>
            {currentStep === 1 && (
              <BasicInfoStep
                basicInfo={basicInfo}
                onBasicInfoChange={(field, value) => setBasicInfo({ ...basicInfo, [field]: value })}
                hideBusinessName={!!user?.salonId}
                hideCustomBookingLink={!!user?.salonId}
              />
            )}

            {currentStep === 2 && (
              <ImagesStep
                bannerPreview={bannerPreview}
                profilePreview={profilePreview}
                onBannerUpload={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleImageUpload(file, setBannerImage, setBannerPreview, 'banner');
                }}
                onProfileUpload={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleImageUpload(file, setProfileImage, setProfilePreview, 'profile');
                }}
                onRemoveBanner={() => removeImage(setBannerImage, setBannerPreview)}
                onRemoveProfile={() => removeImage(setProfileImage, setProfilePreview)}
              />
            )}

            {currentStep === 3 && (
              <ServiceStep
                service={service}
                onServiceChange={(field, value) => setService({ ...service, [field]: value })}
              />
            )}

            {currentStep === 4 && (
              <WorkingHoursStep
                workingHours={workingHours}
                onWorkingHoursChange={updateWorkingHours}
                onBreakAdd={handleBreakAdd}
                onBreakAddToAll={handleBreakAddToAll}
                onBreakRemove={handleBreakRemove}
                onBreakChange={handleBreakChange}
              />
            )}

            {currentStep === 5 && (
              <BookingSettingsStep
                maxCancellationHours={maxCancellationHours}
                onMaxCancellationHoursChange={setMaxCancellationHours}
              />
            )}

            <OnboardingNavigation
              currentStep={currentStep}
              totalSteps={totalSteps}
              onBack={handleBack}
              onNext={handleNext}
              onComplete={handleComplete}
              isLoading={isSaving}
            />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
