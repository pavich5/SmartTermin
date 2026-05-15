import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Modal } from './Modal';
import { format } from 'date-fns';
import { getAvailableSlots, getWalkInClients, WalkInClient } from '../../../services/bookingService';
import { formatPriceInMKDInt } from '../../../utils/priceFormat';

interface Service {
  id: string | number;
  name: string;
  price: number;
}

interface WalkInModalProps {
  show: boolean;
  onClose: () => void;
  services: Service[];
  artistId: string;
  onSave: (data: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceId: string;
    date: string;
    time: string;
  }) => void;
  isLoading?: boolean;
}

export function WalkInModal({ show, onClose, services, artistId, onSave, isLoading = false }: WalkInModalProps) {
  const { t } = useTranslation();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');
  const [timeSlots, setTimeSlots] = useState<
    Array<{
      time: string;
      available: boolean;
      nextAvailableTime?: string | null;
      isBreak?: boolean;
    }>
  >([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  
  // Autocomplete state
  const [walkInClients, setWalkInClients] = useState<WalkInClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<WalkInClient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load walk-in clients when modal opens
  useEffect(() => {
    if (show) {
      const loadWalkInClients = async () => {
        try {
          const response = await getWalkInClients();
          setWalkInClients(response.walkInClients || []);
        } catch (error) {
          console.error('Failed to load walk-in clients', error);
          setWalkInClients([]);
        }
      };
      loadWalkInClients();
      
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setServiceId('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime('');
      setTimeSlots([]);
      setSlotError(null);
      setFilteredClients([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [show]);

  // Filter clients based on input
  useEffect(() => {
    if (clientName.trim().length > 0) {
      const filtered = walkInClients.filter(client =>
        client.clientName.toLowerCase().includes(clientName.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setFilteredClients([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [clientName, walkInClients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  useEffect(() => {
    const fetchSlots = async () => {
      // Don't fetch if modal is closed, date is missing, service is not selected, or artistId is missing
      if (!show || !date || !serviceId || serviceId === '' || !artistId) {
        setTimeSlots([]);
        setTime('');
        setSlotError(null);
        return;
      }

      setIsLoadingSlots(true);
      setSlotError(null);
      try {
        const response = await getAvailableSlots({
          artistId,
          serviceIds: serviceId, // Pass as serviceIds (the API expects this parameter name)
          date,
        });

        if (!response || !response.slots || !Array.isArray(response.slots)) {
          console.error('Invalid response from getAvailableSlots:', response);
          setTimeSlots([]);
          setSlotError('Invalid response from server');
          setIsLoadingSlots(false);
          return;
        }

        const slots = response.slots
          .map((slot) => {
            const timeStr = slot.time.trim();
            const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            let formattedTime = timeStr;

            if (timeMatch) {
              let hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              const period = timeMatch[3]?.toUpperCase();

              if (period === 'PM' && hours !== 12) {
                hours += 12;
              } else if (period === 'AM' && hours === 12) {
                hours = 0;
              }

              formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }

            return {
              time: formattedTime,
              available: slot.available,
              nextAvailableTime: slot.nextAvailableTime,
              isBreak: slot.isBreak ?? false,
            };
          })
          .filter((slot) => {
            if (!slot.time) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDateOnly = new Date(date);
            selectedDateOnly.setHours(0, 0, 0, 0);
            const isToday = selectedDateOnly.getTime() === today.getTime();

            if (isToday) {
              const [hours, minutes] = slot.time.split(':').map(Number);
              const slotTime = new Date();
              slotTime.setHours(hours, minutes, 0, 0);
              const now = new Date();

              if (slotTime < now) {
                return false;
              }
            }

            return true;
          })
          .map((slot) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDateOnly = new Date(date);
            selectedDateOnly.setHours(0, 0, 0, 0);
            const isToday = selectedDateOnly.getTime() === today.getTime();

            let isAvailable = slot.available;
            if (isToday && slot.time) {
              const [hours, minutes] = slot.time.split(':').map(Number);
              const slotTime = new Date();
              slotTime.setHours(hours, minutes, 0, 0);
              const now = new Date();

              if (slotTime < now) {
                isAvailable = false;
              }
            }

            return {
              ...slot,
              available: isAvailable,
            };
          })
          .sort((a, b) => a.time.localeCompare(b.time));

        setTimeSlots(slots);

        if (time && !slots.some((slot) => slot.time === time && slot.available)) {
          setTime('');
        }
      } catch (error: any) {
        console.error('Failed to fetch available slots', error);
        setTimeSlots([]);
        
        // Log more details for debugging
        if (error?.status) {
          console.error('API Error Status:', error.status);
        }
        if (error?.message) {
          console.error('API Error Message:', error.message);
        }
        
        // Set user-friendly error message
        let errorMessage = 'Failed to load available slots';
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.status === 404) {
          errorMessage = 'Artist or service not found';
        } else if (error?.status === 400) {
          errorMessage = 'Invalid request. Please check service and date selection';
        }
        setSlotError(errorMessage);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [show, date, serviceId, artistId]);

  const handleClientSelect = (client: WalkInClient) => {
    // Close dropdown first
    setShowSuggestions(false);
    // Populate fields
    setClientName(client.clientName);
    setClientEmail(client.clientEmail || '');
    setClientPhone(client.clientPhone || '');
    setSelectedIndex(-1);
    // Remove focus from input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredClients.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredClients.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleClientSelect(filteredClients[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSave = () => {
    if (!clientName || !serviceId) {
      return;
    }
    onSave({ clientName, clientEmail, clientPhone, serviceId, date, time });
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title={t('modals.walkIn.title')}>
      <div className="space-y-4">
        <div className="relative" ref={containerRef}>
          <Label>{t('modals.walkIn.clientName')}</Label>
          <Input
            ref={inputRef}
            type="text"
            placeholder={t('modals.walkIn.clientNamePlaceholder')}
            className="mt-2 h-12 rounded-xl"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onFocus={() => {
              if (filteredClients.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
          />
          {showSuggestions && filteredClients.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredClients.map((client, index) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    handleClientSelect(client);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  } ${index === 0 ? 'rounded-t-xl' : ''} ${
                    index === filteredClients.length - 1 ? 'rounded-b-xl' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{client.clientName}</div>
                  {(client.clientEmail || client.clientPhone) && (
                    <div className="text-sm text-gray-500 mt-1">
                      {client.clientEmail && <span>{client.clientEmail}</span>}
                      {client.clientEmail && client.clientPhone && <span> • </span>}
                      {client.clientPhone && <span>{client.clientPhone}</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>
            {t('modals.walkIn.clientEmail')}{' '}
            <span className="text-gray-400 text-sm font-normal">
              ({t('modals.walkIn.optional')})
            </span>
          </Label>
          <Input
            type="email"
            placeholder={t('modals.walkIn.clientEmailPlaceholder')}
            className="mt-2 h-12 rounded-xl"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
        </div>
        <div>
          <Label>
            {t('modals.walkIn.clientPhone')}{' '}
            <span className="text-gray-400 text-sm font-normal">
              ({t('modals.walkIn.optional')})
            </span>
          </Label>
          <Input
            type="tel"
            placeholder={t('modals.walkIn.clientPhonePlaceholder')}
            className="mt-2 h-12 rounded-xl"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>
        <div>
          <Label>{t('modals.walkIn.selectService')}</Label>
          <select
            className="w-full mt-2 h-12 rounded-xl border border-gray-200 px-4"
            required
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">{t('modals.walkIn.selectServicePlaceholder')}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id.toString()}>
                {service.name} - {formatPriceInMKDInt(service.price)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{t('modals.walkIn.date')}</Label>
          <Input
            type="date"
            className="mt-2 h-12 rounded-xl"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime('');
            }}
            min={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
        {date && serviceId && (
          <div>
            <Label>{t('modals.walkIn.time')}</Label>
            {isLoadingSlots ? (
              <div className="mt-2 p-4 text-center text-gray-500">
                {t('modals.walkIn.loadingSlots') || 'Loading available times...'}
              </div>
            ) : slotError ? (
              <div className="mt-2 p-4 text-center text-red-500 text-sm bg-red-50 rounded-lg">
                {slotError}
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto overflow-x-hidden p-2 bg-gray-50 rounded-xl w-full">
                {timeSlots.map((slot) => {
                  const isDisabled = !slot.available;
                  const isBreak = slot.isBreak ?? false;
                  const isSelected = time === slot.time && slot.available;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => {
                        if (!isDisabled) {
                          setTime(slot.time);
                        }
                      }}
                      disabled={isDisabled}
                      title={
                        isBreak
                          ? 'Break time'
                          : isDisabled && slot.nextAvailableTime
                            ? `Next available: ${slot.nextAvailableTime}`
                            : undefined
                      }
                      className={`p-2 rounded-lg text-xs sm:text-sm transition-all whitespace-nowrap font-medium relative ${
                        isSelected
                          ? 'bg-blue-600 border-2 border-sky-500 text-white'
                          : isBreak
                            ? 'border-orange-200 bg-orange-50 text-orange-600 cursor-not-allowed opacity-75'
                            : isDisabled
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                              : 'bg-white border border-gray-200 hover:border-blue-300 text-gray-700'
                      }`}
                    >
                      {slot.time}
                      {isBreak && (
                        <span className="absolute top-0.5 right-0.5 text-[10px]">☕</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 p-4 text-center text-gray-500 text-sm">
                {t('modals.walkIn.noSlotsAvailable') || 'No available time slots for this date'}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !clientName || !serviceId || !time}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full disabled:opacity-50"
          >
            {isLoading ? t('modals.walkIn.adding') || 'Adding...' : t('modals.walkIn.addButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
