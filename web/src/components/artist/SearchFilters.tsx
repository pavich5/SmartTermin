import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin } from 'lucide-react';
import { FilterOutlined } from '@ant-design/icons';
import { useTranslation } from '../../hooks/useTranslation';
import { Input } from '../ui/input';

interface SearchFiltersProps {
  searchQuery: string;
  selectedService: string;
  selectedCity: string;
  cities: string[];
  onSearchChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onCityChange: (value: string) => void;
}

export function SearchFilters({
  searchQuery,
  selectedService,
  selectedCity,
  cities,
  onSearchChange,
  onServiceChange,
  onCityChange,
}: SearchFiltersProps) {
  const { t } = useTranslation();
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const serviceContainerRef = useRef<HTMLDivElement>(null);
  const cityContainerRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const serviceButtonRef = useRef<HTMLButtonElement>(null);
  const cityButtonRef = useRef<HTMLButtonElement>(null);
  const [serviceDropdownPosition, setServiceDropdownPosition] = useState({ top: 0, right: 0 });
  const [cityDropdownPosition, setCityDropdownPosition] = useState({ top: 0, right: 0 });

  const services = [
    { value: 'all', label: t('directory.search.allServices') },
    { value: 'barbers', label: t('directory.search.barbers') },
    { value: 'Nail Technicians', label: t('directory.search.nails') },
    { value: 'lashes', label: t('directory.search.lashes') },
    { value: 'makeup', label: t('directory.search.makeup') },
    { value: 'hair', label: t('directory.search.hair') },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        showServiceDropdown &&
        serviceButtonRef.current &&
        !serviceButtonRef.current.contains(target) &&
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(target)
      ) {
        setShowServiceDropdown(false);
      }
      if (
        showCityDropdown &&
        cityButtonRef.current &&
        !cityButtonRef.current.contains(target) &&
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(target)
      ) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showServiceDropdown, showCityDropdown]);

  const updateServiceDropdownPosition = () => {
    if (serviceButtonRef.current) {
      const rect = serviceButtonRef.current.getBoundingClientRect();
      setServiceDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const updateCityDropdownPosition = () => {
    if (cityButtonRef.current) {
      const rect = cityButtonRef.current.getBoundingClientRect();
      setCityDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  useEffect(() => {
    if (showServiceDropdown) {
      updateServiceDropdownPosition();
      const handleScroll = () => updateServiceDropdownPosition();
      const handleResize = () => updateServiceDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showServiceDropdown]);

  useEffect(() => {
    if (showCityDropdown) {
      updateCityDropdownPosition();
      const handleScroll = () => updateCityDropdownPosition();
      const handleResize = () => updateCityDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showCityDropdown]);

  const hasActiveService = selectedService !== 'all';
  const hasActiveCity = selectedCity !== 'all';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4 overflow-visible">
      <div className="relative overflow-visible">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={20} />
        <div
          className="absolute flex items-center z-10"
          style={{
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <div className="relative" ref={serviceContainerRef}>
            <button
              ref={serviceButtonRef}
              type="button"
              onClick={() => {
                setShowServiceDropdown(!showServiceDropdown);
                setShowCityDropdown(false);
              }}
              className={`p-2 rounded-lg transition-colors ${
                hasActiveService
                  ? 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
              title={t('directory.search.allServices')}
            >
              <FilterOutlined style={{ fontSize: '20px', marginTop: '4px' }} />
            </button>
            {showServiceDropdown &&
              createPortal(
                <div
                  ref={serviceDropdownRef}
                  className="fixed bg-white rounded-xl shadow-lg border border-gray-200 z-[9999] max-h-60 overflow-y-auto"
                  style={{
                    width: '250px',
                    top: `${serviceDropdownPosition.top}px`,
                    right: `${serviceDropdownPosition.right}px`,
                  }}
                >
                  {services.map((service) => (
                    <button
                      key={service.value}
                      type="button"
                      onClick={() => {
                        onServiceChange(service.value);
                        setShowServiceDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm ${
                        selectedService === service.value ? 'bg-sky-50 text-sky-600 font-medium' : 'text-gray-700'
                      } ${service.value === 'all' ? 'border-b border-gray-200' : ''}`}
                    >
                      {service.label}
                    </button>
                  ))}
                </div>,
                document.body
              )}
          </div>

          <div className="relative" ref={cityContainerRef}>
            <button
              ref={cityButtonRef}
              type="button"
              onClick={() => {
                setShowCityDropdown(!showCityDropdown);
                setShowServiceDropdown(false);
              }}
              className={`p-2 rounded-lg transition-colors ${
                hasActiveCity
                  ? 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
              title={t('directory.search.allCities')}
            >
              <MapPin size={20} />
            </button>
            {showCityDropdown &&
              createPortal(
                <div
                  ref={cityDropdownRef}
                  className="fixed bg-white rounded-xl shadow-lg border border-gray-200 z-[9999] max-h-60 overflow-y-auto"
                  style={{
                    width: '250px',
                    top: `${cityDropdownPosition.top}px`,
                    right: `${cityDropdownPosition.right}px`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onCityChange('all');
                      setShowCityDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm border-b border-gray-200 ${
                      selectedCity === 'all' ? 'bg-sky-50 text-sky-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {t('directory.search.allCities')}
                  </button>
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        onCityChange(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm ${
                        selectedCity === city ? 'bg-sky-50 text-sky-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>,
                document.body
              )}
          </div>
        </div>
        <Input
          type="text"
          placeholder={t('directory.search.placeholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-12 rounded-xl border-gray-200"
          style={{ paddingRight: '100px' }}
        />
      </div>
    </div>
  );
}
