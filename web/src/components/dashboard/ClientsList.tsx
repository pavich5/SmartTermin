import React, { useState, useEffect } from 'react';
import { Users, Ban, MoreVertical } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { blockClientForArtist, blockClientForSalon, unblockClient, getBlockedClientsForArtist, getBlockedClientsForSalon, BlockedClient } from '../../services/blockedClientService';
import { toast } from 'sonner';
import { BlockClientModal } from './modals/BlockClientModal';

interface Client {
  name: string;
  email: string;
  phone: string;
  bookings: number;
  clientId?: string;
  id?: string;
}

interface ClientsListProps {
  clients: Client[];
  showAllClients: boolean;
  onToggleShowAll: () => void;
  artistId?: string;
  salonId?: string;
  userType?: 'artist' | 'salon';
  onClientBlocked?: () => void;
}

export function ClientsList({ 
  clients, 
  showAllClients, 
  onToggleShowAll,
  artistId,
  salonId,
  userType,
  onClientBlocked
}: ClientsListProps) {
  const { t } = useTranslation();
  const [blockedClients, setBlockedClients] = useState<BlockedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const displayedClients = showAllClients ? clients : clients.slice(0, 3);

  // Debug: Log props to check if artistId/salonId are being passed
  useEffect(() => {
  }, [artistId, salonId, userType, clients.length]);

  // Load blocked clients on mount
  useEffect(() => {
    const loadBlockedClients = async () => {
      try {
        let response;
        if (userType === 'salon' && salonId) {
          response = await getBlockedClientsForSalon();
        } else if (artistId) {
          response = await getBlockedClientsForArtist();
        } else {
          return;
        }
        setBlockedClients(response.blockedClients || []);
      } catch (error) {
        console.error('Failed to load blocked clients:', error);
      }
    };

    if (artistId || salonId) {
      loadBlockedClients();
    }
  }, [artistId, salonId, userType]);

  const isClientBlocked = (client: Client): boolean => {
    const clientId = client.clientId || client.id;
    if (!clientId) return false;
    return blockedClients.some(bc => bc.clientId === clientId);
  };

  const getBlockedClientId = (client: Client): string | null => {
    const clientId = client.clientId || client.id;
    if (!clientId) return null;
    const blocked = blockedClients.find(bc => bc.clientId === clientId);
    return blocked?.id || null;
  };

  const handleOpenBlockModal = (client: Client) => {
    setSelectedClient(client);
    setShowBlockModal(true);
  };

  const handleBlockClient = async (client: Client, reason?: string) => {
    const clientId = client.clientId || client.id;
    if (!clientId) {
      toast.error(t('dashboard.clients.blockError'), {
        description: t('dashboard.clients.clientIdMissing'),
      });
      return;
    }

    setLoading(true);
    try {
      let response;
      if (salonId) {
        response = await blockClientForSalon(salonId, { clientId, reason });
      } else if (artistId) {
        response = await blockClientForArtist(artistId, { clientId, reason });
      } else {
        throw new Error('No artist or salon ID provided');
      }

      if (response.success) {
        toast.success(t('dashboard.clients.blockedSuccess'), {
          description: t('dashboard.clients.blockedDesc', { name: client.name }),
        });
        // Reload blocked clients
        if (userType === 'salon' && salonId) {
          const updated = await getBlockedClientsForSalon();
          setBlockedClients(updated.blockedClients || []);
        } else if (artistId) {
          const updated = await getBlockedClientsForArtist();
          setBlockedClients(updated.blockedClients || []);
        }
        onClientBlocked?.();
      } else {
        toast.error(t('dashboard.clients.blockError'), {
          description: response.message,
        });
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Failed to block client:', error);
      toast.error(t('dashboard.clients.blockError'), {
        description: error?.message || t('dashboard.clients.blockErrorDesc'),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockClient = async (client: Client) => {
    const blockedClientId = getBlockedClientId(client);
    if (!blockedClientId) {
      toast.error(t('dashboard.clients.unblockError'), {
        description: t('dashboard.clients.blockedClientIdMissing'),
      });
      throw new Error('Blocked client ID not found');
    }

    setLoading(true);
    try {
      const response = await unblockClient(blockedClientId);
      if (response.success) {
        toast.success(t('dashboard.clients.unblocked'), {
          description: t('dashboard.clients.unblockedDesc', { name: client.name }),
        });
        // Remove from blocked clients list
        setBlockedClients(prev => prev.filter(bc => bc.id !== blockedClientId));
        onClientBlocked?.();
      } else {
        toast.error(t('dashboard.clients.unblockError'), {
          description: response.message,
        });
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Failed to unblock client:', error);
      toast.error(t('dashboard.clients.unblockError'), {
        description: error?.message || t('dashboard.clients.unblockErrorDesc'),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl sm:text-2xl">
          {showAllClients ? t('dashboard.clients.all') : t('dashboard.clients.recent')}
        </h2>
        {clients.length > 0 && (
          <Button
            variant="outline"
            className="rounded-full flex-shrink-0"
            onClick={onToggleShowAll}
          >
            {showAllClients ? t('dashboard.clients.showRecent') : t('dashboard.clients.viewAll')}
          </Button>
        )}
      </div>
      <div className="space-y-4 w-full">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t('dashboard.clients.emptyTitle')}
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              {t('dashboard.clients.emptyDescription')}
            </p>
          </div>
        ) : (
          displayedClients.map((client, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl bg-blue-50 hover:shadow-md transition-shadow w-full overflow-hidden gap-3"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 truncate flex items-center gap-2">
                    {client.name}
                    {isClientBlocked(client) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 border border-red-200">
                        <Ban size={12} />
                        {t('dashboard.clients.blocked')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 truncate">{client.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-sm sm:text-base text-blue-600 whitespace-nowrap">
                    {client.bookings} {t('dashboard.clients.bookings')}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                    {client.phone}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 p-0 hover:bg-gray-200 flex-shrink-0 rounded-full border border-gray-200 bg-white cursor-pointer"
                  title={t('dashboard.clients.moreOptions') || 'More options'}
                  onClick={() => handleOpenBlockModal(client)}
                  disabled={(!artistId && !salonId) || loading}
                >
                  <MoreVertical size={20} className="text-gray-700" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <BlockClientModal
        show={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        isBlocked={selectedClient ? isClientBlocked(selectedClient) : false}
        onBlock={handleBlockClient}
        onUnblock={handleUnblockClient}
        loading={loading}
      />
    </div>
  );
}
