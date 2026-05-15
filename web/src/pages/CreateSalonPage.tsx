import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { useSalon } from '../contexts/SalonContext';
import { createSalon } from '../services/salonService';
import { updateArtistProfile } from '../services/authService';
import { uploadSalonPortfolioImage, setBannerImage, setProfilePicture } from '../services/portfolioService';
import { enterprisePriceIds } from '../constants/paddle';
import { openPaddleCheckout, isPaddleInitialized, isPaddleLoaded } from '../utils/paddle';
import { isCurrentUserEnterpriseAllowed } from '../constants/enterprise';
import { PageContainer } from '../components/ui/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { PageSection } from '../components/ui/PageSection';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Upload, X, Edit2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function CreateSalonPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { refresh } = useSalon();
  const hasCreatedAfterPayment = useRef(false);
  const restoringPaidFlow = useRef(false);

  const PERSIST_KEY = 'enterprise_create_payload';


  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [customBookingLink, setCustomBookingLink] = useState('');
  const [artistCount, setArtistCount] = useState<number>(3);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; address?: string; city?: string; bannerImage?: string; profilePicture?: string }>({});
  
  // Image upload states
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Check if user's artist ID is allowed to create Enterprise salon
  const isEnterpriseAllowed = useMemo(
    () => isCurrentUserEnterpriseAllowed(user?.artistId),
    [user?.artistId]
  );

  // For Enterprise, always use free creation (no payment)
  // For legacy users, check trial eligibility
  const trialEligible = useMemo(
    () =>
      isEnterpriseAllowed ||
      (isAuthenticated &&
        user?.userType === 'artist' &&
        user?.hasCreatedSalon !== true &&
        user?.hasUsedEnterpriseTrial !== true),
    [isEnterpriseAllowed, isAuthenticated, user?.userType, user?.hasCreatedSalon, user?.hasUsedEnterpriseTrial]
  );

  useEffect(() => {
    if (user?.salonId) {
      navigate('/enterprise', { replace: true });
    }
  }, [navigate, user?.salonId]);

  // Prefill form fields with existing artist/user data to speed up creation
  useEffect(() => {
    const prefill = async () => {
      if (!isAuthenticated) return;

      try {
        const artistProfile = await updateArtistProfile({}).catch(() => null);

        if (!name && artistProfile?.businessName) setName(artistProfile.businessName);
        if (!address && artistProfile?.address) setAddress(artistProfile.address);
        if (!city && artistProfile?.city) setCity(artistProfile.city);
        if (!country && artistProfile?.country) setCountry(artistProfile.country);
        if (!about && artistProfile?.about) setAbout(artistProfile.about);
        if (!customBookingLink && (artistProfile as any)?.customBookingLink) {
          setCustomBookingLink((artistProfile as any).customBookingLink);
        }
      } catch (error) {
        console.warn('Failed to prefill artist profile data', error);
      }

      if (user) {
        if (!name && user.fullName) setName(user.fullName);
        if (!phone && user.phone) setPhone(user.phone);
        if (!email && user.email) setEmail(user.email);
      }
    };

    prefill();
  }, [isAuthenticated, user?.id]);

  const pricePerSeatEUR = 15;
  const normalizedSeatCount = Math.max(3, Number.isFinite(artistCount) ? artistCount : 3);
  const estimatedMonthlyCost = normalizedSeatCount * pricePerSeatEUR;

  const validate = (): boolean => {
    const nextErrors: { name?: string; address?: string; city?: string; bannerImage?: string; profilePicture?: string } = {};

    if (!name.trim()) {
      nextErrors.name = t('enterprise.createSalon.nameRequired') || 'Salon name is required';
    }
    if (!address.trim()) {
      nextErrors.address = t('enterprise.createSalon.addressRequired') || 'Address is required';
    }
    if (!city.trim()) {
      nextErrors.city = t('enterprise.createSalon.cityRequired') || 'City is required';
    }
    if (!bannerFile) {
      nextErrors.bannerImage = t('enterprise.createSalon.bannerImageRequired') || 'Banner image is required';
    }
    if (!profilePictureFile) {
      nextErrors.profilePicture = t('enterprise.createSalon.profilePictureRequired') || 'Profile picture is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const ensurePaymentReady = () => {
    if (!isPaddleLoaded()) {
      toast.error(t('toast.paymentSystemNotReady'));
      return false;
    }
    if (!isPaddleInitialized()) {
      toast.error(t('toast.paymentSystemInitializing'));
      return false;
    }
    return true;
  };

  const handleImageUpload = (
    file: File | null,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void,
    type: 'banner' | 'profile'
  ) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    const isValidType = allowedTypes.includes(file.type.toLowerCase());
    const isValidExtension = allowedExtensions.includes(fileExtension);

    if (!isValidType || !isValidExtension) {
      toast.error(t('toast.invalidFileType'), {
        description: t('toast.invalidFileTypeDesc'),
      });
      return;
    }

    if (type === 'banner' && file.size > 5 * 1024 * 1024) {
      toast.error(t('toast.fileTooLarge'), {
        description: t('toast.fileTooLargeBannerDesc'),
      });
      return;
    }

    if (type === 'profile' && file.size > 5 * 1024 * 1024) {
      toast.error(t('toast.fileTooLarge'), {
        description: t('toast.fileTooLargeProfileDesc'),
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

  const uploadImagesToSalon = async (salonId: string): Promise<void> => {
    if (!bannerFile || !profilePictureFile) {
      throw new Error('Both banner image and profile picture are required');
    }

    setIsUploadingImages(true);
    try {
      // Upload images to salon portfolio
      const [bannerUpload, profileUpload] = await Promise.all([
        uploadSalonPortfolioImage(salonId, bannerFile),
        uploadSalonPortfolioImage(salonId, profilePictureFile),
      ]);

      // Set banner and profile picture - do sequentially to ensure both are set
      await setBannerImage(bannerUpload.id);
      await setProfilePicture(profileUpload.id);

      setIsUploadingImages(false);
    } catch (error: any) {
      setIsUploadingImages(false);
      throw error;
    }
  };

  const buildPayload = (startWithTrial: boolean) => {
    return {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      about: about.trim() || undefined,
      customBookingLink: customBookingLink.trim() || undefined,
      artistCount: normalizedSeatCount,
      billingCycle: isEnterpriseAllowed ? undefined : billingCycle, // No billing cycle for Enterprise
      startWithTrial: isEnterpriseAllowed ? false : startWithTrial, // No trial for Enterprise (free creation)
    };
  };

  const afterCreateSuccess = async () => {
    await refreshUser();
    await refresh();
    navigate('/enterprise', { replace: true });
  };

  // Handle redirect from payment success page - create salon if not already created
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paid = params.get('paid') === '1';
    if (!paid || restoringPaidFlow.current || hasCreatedAfterPayment.current) return;

    restoringPaidFlow.current = true;
    
      // Check if we have stored salon payload
      const storedPayload = localStorage.getItem(PERSIST_KEY);
      if (storedPayload) {
        const salonPayload = JSON.parse(storedPayload);
        const { _hasFiles, ...cleanPayload } = salonPayload;
        
        // Create salon if not already created
        createSalon(cleanPayload)
        .then(async (salon) => {
          // Upload images to salon portfolio if we have files
          if (salon?.id && bannerFile && profilePictureFile) {
            try {
              await uploadImagesToSalon(salon.id);
              // Refresh salon to get updated profileImageUrl and bannerImageUrl
              await refresh();
            } catch (error: any) {
              console.error('Failed to upload images after salon creation', error);
              // Don't fail the whole flow if image upload fails
              toast.warning(t('toast.salonCreatedButImages'));
            }
          }
          
          localStorage.removeItem(PERSIST_KEY);
          hasCreatedAfterPayment.current = true;
          toast.success(t('enterprise.createSalon.success') || 'Salon created successfully!');
          afterCreateSuccess();
        })
        .catch((error: any) => {
          console.error('Failed to create salon after payment redirect', error);
          toast.error(
            error?.message ||
              t('enterprise.createSalon.error') ||
              'Payment successful but failed to create salon. Please contact support.'
          );
        });
    } else {
      // No stored payload - salon might already be created, just refresh
      afterCreateSuccess();
    }
  }, [location.search]);

  const handleTrialCreate = async () => {
    if (!isAuthenticated) {
      navigate('/auth?returnTo=/enterprise/create&signup=true&createEnterprise=true');
      return;
    }

    // Check Enterprise access
    if (!isEnterpriseAllowed && !trialEligible) {
      toast.error(t('enterprise.createSalon.notAllowed') || 'You are not authorized to create an Enterprise salon. Please contact us.');
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Create salon first (free for Enterprise, trial for legacy users)
      const payload = buildPayload(!isEnterpriseAllowed); // true for trial, false for Enterprise
      const createdSalon = await createSalon(payload);
      
      // Then upload images to salon portfolio
      if (createdSalon?.id) {
        try {
          await uploadImagesToSalon(createdSalon.id);
          // Refresh salon to get updated profileImageUrl and bannerImageUrl
          await refresh();
        } catch (imageError: any) {
          console.error('Failed to upload images to salon portfolio', imageError);
          // Don't fail the whole flow if image upload fails, but show a warning
          toast.warning(t('toast.salonCreatedButImages'));
        }
      }
      
      toast.success(t('enterprise.createSalon.success') || 'Salon created successfully!');
      await afterCreateSuccess();
    } catch (error: any) {
      console.error('Failed to create salon on trial', error);
      toast.error(
        error?.message ||
          t('enterprise.createSalon.error') ||
          'Failed to create salon. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  const handlePaidCreate = async () => {
    if (!isAuthenticated) {
      navigate('/auth?returnTo=/enterprise/create&signup=true&createEnterprise=true');
      return;
    }

    if (!validate()) return;

    const priceId =
      billingCycle === 'monthly' ? enterprisePriceIds.monthly : enterprisePriceIds.yearly;
    if (!priceId || !priceId.startsWith('pri_') || priceId.includes('ENTERPRISE')) {
      toast.error(t('toast.enterprisePriceNotConfigured'));
      return;
    }

    if (!ensurePaymentReady()) {
      return;
    }

    setIsCheckoutLoading(true);
    hasCreatedAfterPayment.current = false;

    try {
      // Store salon payload temporarily to create after payment succeeds
      const salonPayload = buildPayload(false);
      
      // Store files and payload in localStorage as backup in case callback doesn't fire
      const payloadWithFiles = {
        ...salonPayload,
        _hasFiles: true, // Flag to indicate we need to upload images
      };
      localStorage.setItem(PERSIST_KEY, JSON.stringify(payloadWithFiles));
      
      // Open checkout FIRST - pass salon data in customData so we can create salon after payment
      await openPaddleCheckout(
        priceId,
        normalizedSeatCount,
        user?.email,
        {
          subscriptionType: 'enterprise',
          userId: user?.id, // Pass userId so webhook can find user
          artistCount: normalizedSeatCount,
          billingCycle,
          // Store salon data in customData to create salon after payment
          salonData: salonPayload,
        },
        async (checkoutData: any) => {
          // Payment successful - now create the salon
          if (hasCreatedAfterPayment.current) {
            // Already created, just refresh and navigate
            await refreshUser();
            await refresh();
            navigate('/enterprise', { replace: true });
            return;
          }
          
          try {
            hasCreatedAfterPayment.current = true;
            const salon = await createSalon(salonPayload);
            
            // Upload images to salon portfolio if we have files
            if (salon?.id && bannerFile && profilePictureFile) {
              try {
                await uploadImagesToSalon(salon.id);
                // Refresh salon to get updated profileImageUrl and bannerImageUrl
                await refresh();
              } catch (imageError: any) {
                console.error('Failed to upload images to salon portfolio', imageError);
                // Don't fail the whole flow if image upload fails
                toast.warning(t('toast.salonCreatedButImages'));
              }
            }
            
            localStorage.removeItem(PERSIST_KEY); // Clear stored payload
            toast.success(t('enterprise.createSalon.success') || 'Salon created successfully!');
            
            // Refresh to get updated subscription with paddleSubscriptionId
            // The webhook will link the subscription to the salon
            await refreshUser();
            await refresh();
            // Navigate to enterprise dashboard
            navigate('/enterprise', { replace: true });
          } catch (error: any) {
            console.error('Failed to create salon after payment', error);
            hasCreatedAfterPayment.current = false; // Reset on error
            toast.error(
              error?.message ||
                t('enterprise.createSalon.error') ||
                'Payment successful but failed to create salon. Please contact support.'
            );
          }
        },
        `${window.location.origin}/enterprise/create?paid=1`
      );
    } catch (error: any) {
      console.error('Failed to start checkout', error);
      toast.error(
        error?.message ||
          t('enterprise.createSalon.error') ||
          'Failed to start checkout. Please try again.'
      );
      setIsCheckoutLoading(false);
      setIsUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <PageContainer className="pt-8 sm:pt-16 pb-10 space-y-6">
        <PageHeader
          title={t('enterprise.createSalon.title') || 'Create your salon workspace'}
          subtitle={
            isEnterpriseAllowed
              ? t('enterprise.createSalon.description') ||
                'Launch your team and invite as many artists as you need.'
              : trialEligible
              ? t('enterprise.createSalon.description') ||
                'Launch your team with a free trial and invite as many artists as you need.'
              : t('enterprise.createSalon.paidDescription') ||
                'Set up your salon and confirm seats with a paid subscription.'
          }
        />

        <PageSection className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg border border-gray-100">
            <CardContent className="space-y-6 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('enterprise.createSalon.name') || 'Salon Name'} *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('enterprise.createSalon.namePlaceholder') || 'Enter salon name'}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customBookingLink">
                    {t('enterprise.createSalon.customBookingLink') || 'Custom Booking Link'}
                  </Label>
                  <Input
                    id="customBookingLink"
                    value={customBookingLink}
                    onChange={(e) => setCustomBookingLink(e.target.value)}
                    placeholder={
                      t('enterprise.createSalon.customBookingLinkPlaceholder') || 'your-custom-link'
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('enterprise.createSalon.address') || 'Address'} *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('enterprise.createSalon.addressPlaceholder') || 'Enter address'}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('enterprise.createSalon.city') || 'City'} *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('enterprise.createSalon.cityPlaceholder') || 'Enter city'}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('enterprise.createSalon.country') || 'Country'}</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={t('enterprise.createSalon.countryPlaceholder') || 'Enter country'}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('enterprise.createSalon.phone') || 'Phone'}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('enterprise.createSalon.phonePlaceholder') || 'Enter phone number'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('enterprise.createSalon.email') || 'Email'}</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('enterprise.createSalon.emailPlaceholder') || 'Enter email'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">{t('enterprise.createSalon.about') || 'About'}</Label>
                <textarea
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder={
                    t('enterprise.createSalon.aboutPlaceholder') || 'Tell us about your salon...'
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Image Upload Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label className="mb-2">{t('enterprise.createSalon.profilePicture') || 'Profile Picture'} *</Label>
                    <div className="mt-2 flex justify-start">
                      {profilePicturePreview ? (
                        <div className="relative inline-block">
                          <div
                            className={`profile-image-container w-32 h-32 rounded-full overflow-hidden border-4 flex-shrink-0 cursor-pointer hover:border-blue-400 transition-all relative ${errors.profilePicture ? 'border-red-500' : 'border-blue-200'}`}
                            style={{ width: '128px', height: '128px' }}
                            onClick={() => profileInputRef.current?.click()}
                            onMouseEnter={(e) => {
                              const img = e.currentTarget.querySelector('img');
                              const overlay = e.currentTarget.querySelector('.overlay');
                              const text = e.currentTarget.querySelector('.overlay-text');
                              if (img) {
                                img.style.opacity = '0.6';
                                img.style.filter = 'blur(4px)';
                              }
                              if (overlay) overlay.style.opacity = '0.5';
                              if (text) text.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              const img = e.currentTarget.querySelector('img');
                              const overlay = e.currentTarget.querySelector('.overlay');
                              const text = e.currentTarget.querySelector('.overlay-text');
                              if (img) {
                                img.style.opacity = '1';
                                img.style.filter = 'blur(0px)';
                              }
                              if (overlay) overlay.style.opacity = '0';
                              if (text) text.style.opacity = '0';
                            }}
                          >
                            <ImageWithFallback
                              src={profilePicturePreview}
                              alt={t('common.profilePreview')}
                              className="w-full h-full object-cover rounded-full transition-all duration-300"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                opacity: 1,
                                filter: 'blur(0px)',
                              }}
                            />
                            <div
                              className="overlay absolute inset-0 bg-black transition-opacity duration-300 rounded-full flex items-center justify-center pointer-events-none"
                              style={{ opacity: 0 }}
                            >
                              <div
                                className="overlay-text transition-opacity duration-300"
                                style={{ opacity: 0.9 }}
                              >
                                <Edit2 size={18} style={{ color: 'white' }} />
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(setProfilePictureFile, setProfilePicturePreview);
                              setErrors((prev) => ({ ...prev, profilePicture: undefined }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10"
                            title={t('common.removeImage')}
                          >
                            <X size={16} />
                          </button>
                          <input
                            ref={profileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => {
                              handleImageUpload(e.target.files?.[0] || null, setProfilePictureFile, setProfilePicturePreview, 'profile');
                              setErrors((prev) => ({ ...prev, profilePicture: undefined }));
                            }}
                          />
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-full cursor-pointer hover:border-blue-500 transition-colors ${errors.profilePicture ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                          <div className="flex flex-col items-center justify-center">
                            <Upload size={24} className="mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500 text-center px-2">
                              {t('enterprise.createSalon.uploadProfile') || 'Upload profile picture'}
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => {
                              handleImageUpload(e.target.files?.[0] || null, setProfilePictureFile, setProfilePicturePreview, 'profile');
                              setErrors((prev) => ({ ...prev, profilePicture: undefined }));
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {errors.profilePicture && <p className="text-sm text-red-500 mt-1">{errors.profilePicture}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label className="mb-2">{t('enterprise.createSalon.bannerImage') || 'Banner Image'} *</Label>
                    <div className="mt-2">
                      {bannerPreview ? (
                        <div className="relative w-full">
                          <div
                            className={`banner-image-container w-full h-48 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer hover:border-blue-500 transition-all relative ${errors.bannerImage ? 'border-red-500' : 'border-gray-200'}`}
                            style={{ maxWidth: '100%', height: '192px' }}
                            onClick={() => bannerInputRef.current?.click()}
                            onMouseEnter={(e) => {
                              const img = e.currentTarget.querySelector('img');
                              const overlay = e.currentTarget.querySelector('.overlay');
                              const text = e.currentTarget.querySelector('.overlay-text');
                              if (img) {
                                img.style.opacity = '0.9';
                                img.style.filter = 'blur(4px)';
                              }
                              if (overlay) overlay.style.opacity = '0.5';
                              if (text) text.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              const img = e.currentTarget.querySelector('img');
                              const overlay = e.currentTarget.querySelector('.overlay');
                              const text = e.currentTarget.querySelector('.overlay-text');
                              if (img) {
                                img.style.opacity = '1';
                                img.style.filter = 'blur(0px)';
                              }
                              if (overlay) overlay.style.opacity = '0';
                              if (text) text.style.opacity = '0';
                            }}
                          >
                            <ImageWithFallback
                              src={bannerPreview}
                              alt={t('common.bannerPreview')}
                              className="w-full h-full object-cover transition-all duration-300"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                opacity: 1,
                                filter: 'blur(0px)',
                              }}
                            />
                            <div
                              className="overlay absolute inset-0 bg-black transition-opacity duration-300 flex items-center justify-center pointer-events-none"
                              style={{ opacity: 0 }}
                            >
                              <div
                                className="overlay-text transition-opacity duration-300 flex items-center gap-2"
                                style={{ opacity: 0, color: '#fbbf24' }}
                              >
                                <Edit2 size={20} style={{ color: 'white' }} />
                                <span className="text-sm font-medium" style={{ color: 'white' }}>
                                  {t('enterprise.createSalon.clickToReplace') || 'Click to replace'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(setBannerFile, setBannerPreview);
                              setErrors((prev) => ({ ...prev, bannerImage: undefined }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10"
                            title={t('common.removeImage')}
                          >
                            <X size={16} />
                          </button>
                          <input
                            ref={bannerInputRef}
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => {
                              handleImageUpload(e.target.files?.[0] || null, setBannerFile, setBannerPreview, 'banner');
                              setErrors((prev) => ({ ...prev, bannerImage: undefined }));
                            }}
                          />
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-500 transition-colors ${errors.bannerImage ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                          <div className="flex flex-col items-center justify-center p-4">
                            <Upload size={32} className="mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              {t('enterprise.createSalon.uploadBanner') || 'Upload banner image'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('enterprise.createSalon.bannerHint') || 'JPG or PNG, max 5MB'}
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => {
                              handleImageUpload(e.target.files?.[0] || null, setBannerFile, setBannerPreview, 'banner');
                              setErrors((prev) => ({ ...prev, bannerImage: undefined }));
                            }}
                          />
                        </label>
                      )}
                      {errors.bannerImage && <p className="text-sm text-red-500 mt-1">{errors.bannerImage}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <Label htmlFor="artistCount">{t('enterprise.createSalon.numberOfArtists') || 'Number of artists'}</Label>
                  <Input
                    id="artistCount"
                    type="number"
                    min={3}
                    value={artistCount}
                    onChange={(e) => setArtistCount(parseInt(e.target.value, 10) || 3)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('enterprise.createSalon.artistHint') ||
                      'Free trial supports the full team size you set here.'}
                  </p>
                </div>

                {!isEnterpriseAllowed && !trialEligible && (
                  <div>
                    <Label>{t('enterprise.billing.billingCycle') || 'Billing cycle'}</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                        onClick={() => setBillingCycle('monthly')}
                        className="flex-1"
                      >
                        {t('pricing.monthly') || 'Monthly'}
                      </Button>
                      <Button
                        type="button"
                        variant={billingCycle === 'yearly' ? 'default' : 'outline'}
                        onClick={() => setBillingCycle('yearly')}
                        className="flex-1"
                      >
                        {t('pricing.yearly') || 'Yearly'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-gray-100">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('enterprise.createSalon.seatSummary') || 'Seat summary'}</p>
                <p className="text-2xl font-semibold">
                  {normalizedSeatCount} {t('enterprise.billing.artists') || (normalizedSeatCount === 1 ? 'artist' : 'artists')}
                </p>
                {!isEnterpriseAllowed && (
                  <p className="text-sm text-gray-500">
                    ~ €{pricePerSeatEUR} / уметник / месец
                  </p>
                )}
              </div>

              {isEnterpriseAllowed ? (
                <>
                  <div className="p-3 rounded-lg bg-green-50 text-green-900 border border-green-100">
                    <p className="font-semibold">{t('enterprise.createSalon.enterpriseActive') || 'Enterprise Plan'}</p>
                    <p className="text-sm">
                      {t('enterprise.createSalon.enterpriseDescription') ||
                        'Create your salon with custom pricing. No payment required - billing handled offline.'}
                    </p>
                  </div>
                  <Button
                    onClick={handleTrialCreate}
                    disabled={isSubmitting || isUploadingImages}
                    className="w-full"
                  >
                    {isSubmitting || isUploadingImages
                      ? t('enterprise.createSalon.creating') || 'Creating...'
                      : t('enterprise.createSalon.button') || 'Create Salon'}
                  </Button>
                </>
              ) : trialEligible ? (
                <>
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-100">
                    <p className="font-semibold">{t('enterprise.trial.active') || 'Free trial'}</p>
                    <p className="text-sm">
                      {t('enterprise.createSalon.trialSeats') ||
                        'No payment needed now. Invite up to the seats you set and explore the full dashboard.'}
                    </p>
                  </div>
                  <Button
                    onClick={handleTrialCreate}
                    disabled={isSubmitting || isUploadingImages}
                    className="w-full"
                  >
                    {isSubmitting || isUploadingImages
                      ? t('enterprise.createSalon.creating') || 'Creating...'
                      : t('enterprise.createSalon.button') || 'Create Salon'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-100">
                    <p className="font-semibold">
                      {t('enterprise.createSalon.paidTitle') || 'Start with a paid plan'}
                    </p>
                    <p className="text-sm">
                      {t('enterprise.createSalon.paidCopy') ||
                        'Choose seats and billing cycle, then complete checkout to activate.'}
                    </p>
                  </div>
                  <Button
                    onClick={handlePaidCreate}
                    disabled={isCheckoutLoading || isUploadingImages}
                    className="w-full"
                  >
                    {isCheckoutLoading || isUploadingImages
                      ? t('enterprise.createSalon.preparingCheckout') || 'Preparing checkout...'
                      : t('enterprise.createSalon.createAndPay') || 'Create & Pay'}
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/enterprise')}
              >
                {t('enterprise.billing.back') || 'Back to dashboard'}
              </Button>
            </CardContent>
          </Card>
        </PageSection>
      </PageContainer>
    </div>
  );
}


