import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import { useTranslateProfession } from '../utils/translateProfession';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { ArtistHeader } from '../components/artist/ArtistHeader';
import { AboutSection } from '../components/artist/AboutSection';
import { ServicesSection } from '../components/artist/ServicesSection';
import { PortfolioSection } from '../components/artist/PortfolioSection';
import { ReviewsSection } from '../components/artist/ReviewsSection';
import { ContactSidebar } from '../components/artist/ContactSidebar';
import { ArtistProfileResponse, getArtistById } from '../services/artistService';
import { getSalon } from '../services/salonService';
import { Salon } from '../types/salon';
import { getSalonPortfolioImages } from '../services/portfolioService';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { SelectArtistModal } from '../components/artist/SelectArtistModal';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ArtistProfileSkeleton } from '../components/artist/ArtistProfileSkeleton';
import { PageContainer } from '../components/ui/PageContainer';
import { formatPriceInMKDInt } from '../utils/priceFormat';

export function ArtistProfile() {
  const { t } = useTranslation();
  const translateProfession = useTranslateProfession();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [artist, setArtist] = useState<ArtistProfileResponse | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSalon, setIsLoadingSalon] = useState(false);
  const [showSelectArtistModal, setShowSelectArtistModal] = useState(false);
  const [salonPortfolio, setSalonPortfolio] = useState<string[]>([]);
  const [allSalonServices, setAllSalonServices] = useState<Array<{
    name: string;
    duration: number;
    price: number;
    artistName?: string;
  }>>([]);

  useEffect(() => {
    const loadArtist = async () => {
      if (!id) return;
      
      // Clear previous data when ID changes - do this synchronously before any async operations
      setArtist(null);
      setSalon(null);
      setSalonPortfolio([]);
      setAllSalonServices([]);
      setIsLoading(true);
      try {
        const result = await getArtistById(id);
        setArtist(result);

        if (result.salonId) {
          setIsLoadingSalon(true);
          try {
            const salonData = await getSalon(result.salonId);
            setSalon(salonData);
            
            // Fetch salon portfolio images
            try {
              const portfolioResponse = await getSalonPortfolioImages(salonData.id);
              const portfolioUrls = (portfolioResponse.images || [])
                .filter(img => !img.isBannerImage && !img.isProfilePicture)
                .map(img => img.url);
              setSalonPortfolio(portfolioUrls);
            } catch (portfolioError) {
              console.error('Failed to load salon portfolio', portfolioError);
              setSalonPortfolio([]);
            }
            
            // Fetch services from all salon members
            if (salonData.members && salonData.members.length > 0) {
              const allServices: Array<{
                name: string;
                duration: number;
                price: number;
                artistName?: string;
              }> = [];
              
              // Fetch services for each member
              for (const member of salonData.members) {
                try {
                  const memberArtist = await getArtistById(member.artistId);
                  if (memberArtist.services && memberArtist.services.length > 0) {
                    memberArtist.services.forEach((service) => {
                      allServices.push({
                        name: service.name,
                        duration: service.duration,
                        price: service.price,
                        artistName: member.fullName,
                      });
                    });
                  }
                } catch (error) {
                  console.error(`Failed to load services for member ${member.artistId}`, error);
                }
              }
              
              setAllSalonServices(allServices);
            }
          } catch (error) {
            console.error('Failed to load salon', error);
          } finally {
            setIsLoadingSalon(false);
          }
        }
        } catch (error) {
          // If artist not found, try loading as salon by custom booking link
          try {
            const salonData = await getSalon(id);
            setSalon(salonData);
            
            // Fetch salon portfolio images
            try {
              const portfolioResponse = await getSalonPortfolioImages(salonData.id);
              const portfolioUrls = (portfolioResponse.images || [])
                .filter(img => !img.isBannerImage && !img.isProfilePicture)
                .map(img => img.url);
              setSalonPortfolio(portfolioUrls);
            } catch (portfolioError) {
              console.error('Failed to load salon portfolio', portfolioError);
              setSalonPortfolio([]);
            }
            
            // Fetch services from all salon members
            if (salonData.members && salonData.members.length > 0) {
              const allServices: Array<{
                name: string;
                duration: number;
                price: number;
                artistName?: string;
              }> = [];
              
              // Fetch services for each member
              for (const member of salonData.members) {
                try {
                  const memberArtist = await getArtistById(member.artistId);
                  if (memberArtist.services && memberArtist.services.length > 0) {
                    memberArtist.services.forEach((service) => {
                      allServices.push({
                        name: service.name,
                        duration: service.duration,
                        price: service.price,
                        artistName: member.fullName,
                      });
                    });
                  }
                } catch (error) {
                  console.error(`Failed to load services for member ${member.artistId}`, error);
                }
              }
              
              setAllSalonServices(allServices);
              
              // Try to find owner first, otherwise use first member
              const ownerMember = salonData.members.find(m => m.role === 'owner');
              const memberToShow = ownerMember || salonData.members[0];
              
              if (memberToShow.artistId) {
                try {
                  const artistResult = await getArtistById(memberToShow.artistId);
                  setArtist(artistResult);
                } catch (artistError) {
                  console.error('Failed to load salon member artist', artistError);
                  // If we can't load the artist, we still have salon data, so don't show error
                }
              }
            }
          } catch (salonError) {
            console.error('Failed to load salon', salonError);
            toast.error(t('toast.genericError'), {
              description: t('toast.genericErrorDesc'),
            });
          }
        } finally {
        setIsLoading(false);
      }
    };

    loadArtist();
  }, [id]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error(t('toast.pleaseLogin'), {
        description: t('toast.pleaseLoginDesc'),
        duration: 3000,
      });
      const bookingPath = id ? `/book/${id}` : location.pathname;
      navigate(`/auth?returnTo=${encodeURIComponent(bookingPath)}&signup=true&autoSelectClient=true`);
      return;
    }

    if (user?.userType === 'artist' && user?.artistId && id && user.artistId === id) {
      toast.error(t('artistProfile.cannotBookSelf') || 'You cannot book your own services', {
        description:
          t('artistProfile.cannotBookSelfDesc') ||
          'Artists cannot create bookings for their own services.',
        duration: 4000,
      });
      return;
    }

    // Backend should already filter out owners who aren't artists
    if (salon && salon.members && salon.members.length > 1) {
      setShowSelectArtistModal(true);
      return;
    }

    if (id) {
      navigate(`/book/${id}`);
    }
  };

  const handleSelectArtist = (artistId: string) => {
    navigate(`/book/${artistId}`);
  };

  const handleOpenMap = () => {
    if (!artist) return;
    const encodedAddress = encodeURIComponent(artist.location);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const salonArtists = useMemo(() => {
    if (!salon || !salon.members || !id) return [];

    // Backend should already filter out owners who aren't artists
    // Only show members list if there are multiple artists (excluding the current one being viewed)
    const otherArtists = salon.members.filter(m => m.artistId !== id);
    
    if (otherArtists.length > 0) {
      return salon.members;
    }
    return [];
  }, [salon, id]);

  if (isLoading) {
    return <ArtistProfileSkeleton />;
  }

  if (!artist && !salon) {
    return <ErrorState message={t('artistProfile.notFound')} />;
  }

  // If we have salon but no artist yet, show loading
  if (salon && !artist && salon.members && salon.members.length > 0) {
    return <ArtistProfileSkeleton />;
  }

  // If we have salon but no artist and no members, show error
  if (salon && !artist) {
    return <ErrorState message={t('artistProfile.notFound')} />;
  }

  if (!artist) {
    return <ErrorState message={t('artistProfile.notFound')} />;
  }

  const isArtistRoute = location.pathname.startsWith('/artist/');
  const belongsToSalon = !!artist.salonId || !!salon;
  const shouldHideBookNow = belongsToSalon && isArtistRoute;
  
  // When viewing an artist profile via /artist/{id}, ALWAYS use artist's own data
  // Only use salon data when viewing salon directly via /{salonId}
  const displayName = isArtistRoute ? artist.name : ((salon && salon.name) ? salon.name : artist.name);
  
  // When viewing an artist profile, use artist's own images
  // Only use salon images when viewing salon directly (not via /artist/{id})
  const bannerImage = isArtistRoute 
    ? (artist.bannerImage || artist.profileImage)
    : (salon?.bannerImageUrl || salon?.profileImageUrl || artist.bannerImage || artist.profileImage);
  
  const profileImage = isArtistRoute
    ? artist.profileImage
    : (salon?.profileImageUrl || artist.profileImage);

  return (
    <div className="min-h-screen bg-white pb-24">
      <ArtistHeader
        bannerImage={bannerImage}
        profileImage={profileImage}
        name={displayName}
        profession={artist.profession}
        rating={artist.rating}
        reviews={artist.reviews_total}
        location={artist.location}
        onBookNow={handleBookNow}
        showBookNow={!shouldHideBookNow}
      />

      <PageContainer>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AboutSection about={isArtistRoute ? artist.about : (salon?.about || artist.about)} />

            {salon && salon.members && salon.members.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                {isArtistRoute ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-sky-500 flex-shrink-0 flex items-center justify-center shadow-lg">
                        {salon.profileImageUrl ? (
                          <ImageWithFallback
                            src={salon.profileImageUrl}
                            alt={salon.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                            {salon.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed break-words">
                          {t('artistProfile.salonDescription', {
                            salonName: salon.name || t('artistProfile.aSalon') || 'a salon',
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleBookNow}
                      className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6 py-3 w-full sm:w-auto flex-shrink-0 justify-center whitespace-nowrap"
                    >
                      <Calendar className="mr-2" size={18} />
                      {t('artistProfile.bookNow')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-100 flex-shrink-0 flex items-center justify-center shadow-lg">
                          {salon.profileImageUrl ? (
                            <ImageWithFallback
                              src={salon.profileImageUrl}
                              alt={salon.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sky-600 font-bold text-xl">
                              {salon.name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {t('artistProfile.allArtists')}
                          </h2>
                          <p className="text-sm text-gray-500">{salon.name}</p>
                        </div>
                      </div>
                      {isAuthenticated &&
                        user?.salonId === salon.id &&
                        user?.salonRole === 'owner' && (
                          <Button
                            onClick={() => navigate('/enterprise/team')}
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                          >
                            {t('artistProfile.manage')}
                          </Button>
                        )}
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">
                      {t('artistProfile.salonDescription', {
                        salonName: salon.name || t('artistProfile.aSalon') || 'a salon',
                      })}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {salonArtists.map((member) => {
                        const isCurrentArtist = member.artistId === id;
                        const isOwner = member.role === 'owner';
                        return (
                          <div
                            key={member.artistId}
                            className={`border rounded-xl p-4 transition-all relative ${
                              isCurrentArtist
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                            }`}
                            onClick={() =>
                              !isCurrentArtist && navigate(`/artist/${member.artistId}`)
                            }
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-sky-500 flex-shrink-0 flex items-center justify-center shadow-lg">
                                {member.profileImageUrl ? (
                                  <ImageWithFallback
                                    src={member.profileImageUrl}
                                    alt={member.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                                    {member.fullName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                                    {member.fullName}
                                    {isOwner && <Crown size={14} className="text-blue-600 flex-shrink-0" />}
                                  </h3>
                                  {isAuthenticated && user?.artistId === member.artistId && (
                                    <span className="text-xs bg-blue-200 text-sky-700 px-2 py-0.5 rounded-full">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {member.profession
                                    ? translateProfession(member.profession)
                                    : member.role === 'owner'
                                      ? t('enterprise.dashboard.role.owner')
                                      : t('enterprise.dashboard.role.artist')}
                                </p>
                                {/* Only show bookings and revenue to the artist themselves or salon owners */}
                                {(user?.artistId === member.artistId || 
                                  (user?.salonId === salon?.id && user?.salonRole === 'owner')) && (
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>
                                      {member.bookings === 0
                                        ? t('enterprise.dashboard.zeroBookings')
                                        : t('enterprise.dashboard.bookingsCount', {
                                            count: member.bookings,
                                          })}
                                    </span>
                                    {member.revenue > 0 && (
                                      <span>
                                        {t('enterprise.dashboard.revenueAmount', {
                                          amount: member.revenue.toFixed(0),
                                        })}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {(!isCurrentArtist || isOwner) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/artist/${member.artistId}`);
                                  }}
                                >
                                  View Profile
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            <ServicesSection
              services={
                // When viewing an artist profile via /artist/{id}, always show only that artist's services
                // Only show all salon services when viewing salon directly (not via /artist/{id})
                (isArtistRoute || !salon || !salon.members || salon.members.length === 0 || allSalonServices.length === 0)
                  ? artist.services.map((service) => ({
                      name: service.name,
                      duration: `${service.duration} min`,
                      price: formatPriceInMKDInt(service.price),
                    }))
                  : allSalonServices.map((service) => ({
                      name: service.name,
                      duration: `${service.duration} min`,
                      price: formatPriceInMKDInt(service.price),
                    }))
              }
            />
            <PortfolioSection 
              portfolio={
                salon && !isArtistRoute 
                  ? salonPortfolio 
                  : (artist.portfolio || [])
              } 
            />
            <ReviewsSection
              artistId={artist.id}
              services={artist.services.map((service) => ({
                id: String(service.id),
                name: service.name,
              }))}
            />
          </div>

          <ContactSidebar
            phone={artist.phone}
            email={artist.email}
            location={artist.location}
            workingHours={artist.workingHours}
            onOpenMap={handleOpenMap}
            onBookNow={handleBookNow}
            showBookNow={!shouldHideBookNow}
          />
        </div>
      </PageContainer>

      {!shouldHideBookNow && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <Button
            onClick={handleBookNow}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-6 rounded-full"
          >
            <Calendar className="mr-2" size={20} />
            {t('artistProfile.bookNow')}
          </Button>
        </div>
      )}

      {salon && salon.members && salon.members.length > 1 && (
        <SelectArtistModal
          show={showSelectArtistModal}
          onClose={() => setShowSelectArtistModal(false)}
          salonName={salon.name}
          artists={salon.members}
          onSelectArtist={handleSelectArtist}
        />
      )}
    </div>
  );
}
