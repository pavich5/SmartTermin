import React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, FilterX } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { getArtists, ArtistListItem } from '../services/artistService';
import { getAllSalons } from '../services/salonService';
import { Salon } from '../types/salon';
import { ArtistCard } from '../components/artist/ArtistCard';
import { ArtistCardSkeleton } from '../components/artist/ArtistCardSkeleton';
import { SearchFilters } from '../components/artist/SearchFilters';
import { Button } from '../components/ui/button';
import { PageContainer } from '../components/ui/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { SelectArtistModal } from '../components/artist/SelectArtistModal';
import { getSalon } from '../services/salonService';

const ITEMS_PER_PAGE = 10;

export function ArtistDirectory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [allArtists, setAllArtists] = useState<ArtistListItem[]>([]);
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<ArtistListItem[]>([]);
  const [displayedArtists, setDisplayedArtists] = useState<ArtistListItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreArtists, setHasMoreArtists] = useState(true);
  const [totalArtists, setTotalArtists] = useState(0);
  const [currentSalonPage, setCurrentSalonPage] = useState(1);
  const [hasMoreSalons, setHasMoreSalons] = useState(true);
  const [totalSalons, setTotalSalons] = useState(0);
  const [showSelectArtistModal, setShowSelectArtistModal] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const extractCity = (location: string): string => {
    if (!location) return '';
    const parts = location.split(',').map((s) => s.trim());
    // If location has comma (format: "Address, City"), take the last part (city)
    // If no comma, assume the whole string is the city
    return parts.length > 1 ? parts[parts.length - 1] : location;
  };

  // Map dropdown service values to actual profession values and search terms (for client-side filtering)
  const getServiceSearchTerms = (selectedService: string): string[] => {
    const mapping: Record<string, string[]> = {
      'barbers': [
        'barber', 'barbers', 'berber', 'berbers', 
        'бербер', 'бербери', // Macedonian
        'barbershop', 'barber shop'
      ],
      'Nail Technicians': [
        'nail', 'nails', 'nailtechnician', 'nail technician', 
        'nailtechnicians', 'nail technicians',
        'техничар за нокти', 'нокти', // Macedonian
        'manicure', 'pedicure'
      ],
      'lashes': [
        'lash', 'lashes', 'lashartist', 'lash artist',
        'lashartists', 'lash artists',
        'уметник за трепки', 'трепки', // Macedonian
        'eyelash', 'eyelashes'
      ],
      'makeup': [
        'makeup', 'makeupartist', 'makeup artist',
        'makeupartists', 'makeup artists',
        'шминкер', 'шминка', // Macedonian
        'cosmetics', 'cosmetic'
      ],
      'hair': [
        'hair', 'hairstylist', 'hair stylist',
        'hairstylists', 'hair stylists',
        'frizura', 'frizura i stiliziranje', // Macedonian
        'frizura i stiliziranje', 'haircut', 'hair cut', 'styling'
      ],
    };
    return mapping[selectedService] || [selectedService.toLowerCase()];
  };

  // Map dropdown service values to backend API filter values
  // Backend uses LIKE matching, so we use the primary search term
  const getServiceFilterForBackend = (selectedService: string): string | undefined => {
    if (selectedService === 'all') return undefined;
    
    const mapping: Record<string, string> = {
      'barbers': 'barber',
      'Nail Technicians': 'nail',
      'lashes': 'lash',
      'makeup': 'makeup',
      'hair': 'hair',
    };
    
    return mapping[selectedService] || selectedService.toLowerCase();
  };

  // Load data function that can be called with filters
  const loadData = useCallback(async (search?: string, service?: string, resetPagination = false) => {
    setIsLoading(true);
    try {
      // Map selectedService dropdown value to backend service filter
      const serviceFilter = service ? getServiceFilterForBackend(service) : undefined;
      
      const [salonsResponse, artistsResponse] = await Promise.all([
        getAllSalons(1, ITEMS_PER_PAGE).catch(() => ({ salons: [], total: 0, page: 1, limit: ITEMS_PER_PAGE })),
        getArtists({
          search: search && search.trim() ? search.trim() : undefined,
          service: serviceFilter,
          page: 1,
          limit: ITEMS_PER_PAGE,
        }).catch(() => ({ artists: [], total: 0, page: 1, limit: ITEMS_PER_PAGE })),
      ]);

      // Handle salons response (can be array or paginated object)
      let salons: Salon[] = [];
      let salonTotal = 0;
      if (Array.isArray(salonsResponse)) {
        salons = salonsResponse;
        salonTotal = salons.length;
      } else {
        salons = salonsResponse.salons || [];
        salonTotal = salonsResponse.total || 0;
      }

      const artistsList = artistsResponse.artists || [];
      const artistTotal = artistsResponse.total || 0;

      setAllSalons(salons);
      setAllArtists(artistsList);
      setTotalArtists(artistTotal);
      setTotalSalons(salonTotal);
      setHasMoreArtists(artistsList.length < artistTotal);
      setHasMoreSalons(salons.length < salonTotal);
      
      if (resetPagination) {
        setCurrentPage(1);
        setCurrentSalonPage(1);
      }

      // Extract cities from data
      const salonCities = salons.map((s) => s.city).filter(Boolean);
      const artistCities = artistsList
        .map((artist) => extractCity(artist.location))
        .filter((city) => city && city.trim() !== '');
      const uniqueCities = Array.from(new Set([...salonCities, ...artistCities])).sort();
      setCities(uniqueCities);
    } catch (error) {
      console.error('Failed to load data', error);
      toast.error(t('toast.genericError'), {
        description: t('toast.genericErrorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial data on mount and reload when filters change
  useEffect(() => {
    // Skip on initial mount to avoid duplicate calls
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadData();
      return;
    }

    // Debounce search query to avoid too many API calls
    const timeoutId = setTimeout(() => {
      loadData(
        searchQuery.trim() || undefined,
        selectedService,
        true // Reset pagination when filters change
      );
    }, searchQuery.trim() ? 500 : 0); // 500ms debounce for search, immediate for service

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedService, loadData]);

  // Load more artists and salons when scrolling
  const loadMoreArtists = useCallback(async () => {
    if (isLoadingMore || (!hasMoreArtists && !hasMoreSalons)) return;

    setIsLoadingMore(true);
    try {
      const promises: Promise<any>[] = [];
      
      // Load more artists if available (with current filters)
      if (hasMoreArtists) {
        const nextPage = currentPage + 1;
        const serviceFilter = getServiceFilterForBackend(selectedService);
        promises.push(
          getArtists({
            search: searchQuery.trim() || undefined,
            service: serviceFilter,
            page: nextPage,
            limit: ITEMS_PER_PAGE,
          }).then((response) => {
            const newArtists = response.artists || [];
            const total = response.total || 0;
            
            setAllArtists((prev) => [...prev, ...newArtists]);
            setTotalArtists(total);
            setCurrentPage(nextPage);
            setHasMoreArtists(newArtists.length === ITEMS_PER_PAGE && allArtists.length + newArtists.length < total);

            // Update cities with new artist cities
            const newArtistCities = newArtists
              .map((artist) => extractCity(artist.location))
              .filter((city) => city && city.trim() !== '');
            if (newArtistCities.length > 0) {
              setCities((prev) => {
                const combined = [...prev, ...newArtistCities];
                return Array.from(new Set(combined)).sort();
              });
            }
          })
        );
      }

      // Load more salons if available
      if (hasMoreSalons) {
        const nextSalonPage = currentSalonPage + 1;
        promises.push(
          getAllSalons(nextSalonPage, ITEMS_PER_PAGE).then((response) => {
            let newSalons: Salon[] = [];
            let salonTotal = 0;
            
            if (Array.isArray(response)) {
              newSalons = response;
              salonTotal = newSalons.length;
            } else {
              newSalons = response.salons || [];
              salonTotal = response.total || 0;
            }

            setAllSalons((prev) => [...prev, ...newSalons]);
            setTotalSalons(salonTotal);
            setCurrentSalonPage(nextSalonPage);
            setHasMoreSalons(newSalons.length === ITEMS_PER_PAGE && allSalons.length + newSalons.length < salonTotal);

            // Update cities with new salon cities
            const newSalonCities = newSalons.map((s) => s.city).filter(Boolean);
            if (newSalonCities.length > 0) {
              setCities((prev) => {
                const combined = [...prev, ...newSalonCities];
                return Array.from(new Set(combined)).sort();
              });
            }
          })
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to load more data', error);
      toast.error(t('toast.genericError'), {
        description: t('toast.genericErrorDesc'),
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, currentSalonPage, hasMoreArtists, hasMoreSalons, isLoadingMore, allArtists.length, allSalons.length, searchQuery, selectedService]);

  // Filter and combine artists and salons
  useEffect(() => {
    let filteredArtistsList = allArtists.filter((artist) => {
      const hasSalonId =
        artist.salonId && typeof artist.salonId === 'string' && artist.salonId.trim() !== '';
      return !hasSalonId;
    });

    const salonAsArtists: ArtistListItem[] = allSalons
      .map((salon) => {
        // Backend should already filter out owners who aren't artists, so use members.length directly
        const memberCount = salon.members?.length || 0;
        
        // Use ownerArtistId if available, otherwise use first member's artistId, or salon's customBookingLink, or salon id
        let displayId = salon.ownerArtistId;
        if (!displayId && salon.members && salon.members.length > 0) {
          // Find first artist member (not owner if owner is not an artist)
          const firstArtistMember = salon.members.find(m => m.role === 'artist') || salon.members[0];
          displayId = firstArtistMember?.artistId;
        }
        if (!displayId) {
          // Fallback to custom booking link or salon id
          displayId = salon.customBookingLink || salon.id;
        }
        
        return {
          id: displayId!,
          name: salon.name,
          profession: memberCount > 0
            ? `${memberCount} ${memberCount === 1 ? 'artist' : 'artists'}`
            : 'Salon',
          image: salon.profileImageUrl || salon.bannerImageUrl || '',
          services: salon.combinedServices || [],
          price: salon.minPrice || '',
          location: `${salon.city}, ${salon.country}`,
          rating: 0,
          salonId: salon.id,
          customBookingLink: salon.customBookingLink || undefined,
        };
      });

    let combinedList = [...filteredArtistsList, ...salonAsArtists];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      combinedList = combinedList.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.profession.toLowerCase().includes(query) ||
          item.services.some((service) => service.toLowerCase().includes(query))
      );
    }

    if (selectedService !== 'all') {
      const searchTerms = getServiceSearchTerms(selectedService);
      combinedList = combinedList.filter((item) => {
        const professionLower = item.profession.toLowerCase();
        const servicesLower = item.services.map((s) => s.toLowerCase());
        
        // Check if profession or any service matches any of the search terms
        return searchTerms.some((term) => 
          professionLower.includes(term.toLowerCase()) ||
          servicesLower.some((service) => service.includes(term.toLowerCase()))
        );
      });
    }

    if (selectedCity !== 'all') {
      combinedList = combinedList.filter((item) => {
        // For salons, check the city directly from the salon object
        if (item.salonId) {
          const salon = allSalons.find((s) => s.id === item.salonId);
          if (salon) {
            return salon.city === selectedCity;
          }
        }
        // For regular artists, extract city from location string
        const itemCity = extractCity(item.location);
        return itemCity === selectedCity;
      });
    }

    setFilteredArtists(combinedList);
    // Reset displayed items to first page when filters change
    setDisplayedArtists(combinedList.slice(0, ITEMS_PER_PAGE));
  }, [allArtists, allSalons, searchQuery, selectedService, selectedCity]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          // First, try to load more from the already filtered list
          if (displayedArtists.length < filteredArtists.length) {
            const nextBatch = filteredArtists.slice(
              displayedArtists.length,
              displayedArtists.length + ITEMS_PER_PAGE
            );
            if (nextBatch.length > 0) {
              setDisplayedArtists((prev) => [...prev, ...nextBatch]);
            }
          } else if (hasMoreArtists || hasMoreSalons) {
            // If we've shown all filtered items, fetch more artists/salons from API
            loadMoreArtists();
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [displayedArtists.length, filteredArtists.length, hasMoreArtists, hasMoreSalons, isLoadingMore, loadMoreArtists]);

  const handleBookNow = async (artistId: string, customBookingLink?: string) => {
    if (!isAuthenticated) {
      toast.error(t('toast.pleaseLogin'), {
        description: t('toast.pleaseLoginDesc'),
        duration: 3000,
      });
      const bookingPath = customBookingLink ? `/book/${customBookingLink}` : `/book/${artistId}`;
      navigate(`/auth?returnTo=${encodeURIComponent(bookingPath)}&signup=true&autoSelectClient=true`);
      return;
    }

    // Check if this is a salon (has salonId)
    const artist = filteredArtists.find((a) => a.id === artistId);
    if (artist?.salonId) {
      try {
        const salon = await getSalon(artist.salonId);
        // Backend should already filter out owners who aren't artists
        if (salon && salon.members && salon.members.length > 1) {
          setSelectedSalon(salon);
          setShowSelectArtistModal(true);
          return;
        }
      } catch (error) {
        console.error('Failed to load salon', error);
      }
    }

    // Use custom booking link if available, otherwise use ID
    if (customBookingLink) {
      navigate(`/book/${customBookingLink}`);
    } else {
      navigate(`/book/${artistId}`);
    }
  };

  const handleSelectArtist = (selectedArtistId: string) => {
    navigate(`/book/${selectedArtistId}`);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedService('all');
    setSelectedCity('all');
  };

  const hasActiveFilters =
    searchQuery !== '' || selectedService !== 'all' || selectedCity !== 'all';

  return (
    <div className="min-h-screen bg-blue-50 py-4">
      <PageContainer>
        <SearchFilters
          searchQuery={searchQuery}
          selectedService={selectedService}
          selectedCity={selectedCity}
          cities={cities}
          onSearchChange={setSearchQuery}
          onServiceChange={setSelectedService}
          onCityChange={setSelectedCity}
        />

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ArtistCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedArtists.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedArtists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={{
                    ...artist,
                    reviews: 0,
                  }}
                  onViewProfile={(link) => {
                    navigate(`/${link}`);
                  }}
                  onBookNow={(id) => handleBookNow(id, artist.customBookingLink)}
                />
              ))}
            </div>
            {/* Intersection Observer target for infinite scroll */}
            <div ref={observerTarget} className="mt-6">
              {isLoadingMore && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <ArtistCardSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="col-span-full">
            <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Search className="text-blue-500" size={32} />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {t('directory.noResultsTitle')}
                </h2>

                <p className="text-gray-600 mb-6 text-sm">{t('directory.noResultsDesc')}</p>

                {hasActiveFilters && (
                  <div className="w-full">
                    <Button
                      onClick={handleClearFilters}
                      className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <FilterX className="mr-2" size={16} />
                      {t('directory.clearFilters')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PageContainer>

      {selectedSalon && selectedSalon.members && selectedSalon.members.length > 1 && (
        <SelectArtistModal
          show={showSelectArtistModal}
          onClose={() => {
            setShowSelectArtistModal(false);
            setSelectedSalon(null);
          }}
          salonName={selectedSalon.name}
          artists={selectedSalon.members}
          onSelectArtist={handleSelectArtist}
        />
      )}
    </div>
  );
}
