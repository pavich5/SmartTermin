import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { Salon, SalonMember, SalonSubscription } from '../types/salon';
import { getSalon, getSalonMembers, getSalonSubscription } from '../services/salonService';

interface SalonContextValue {
  salon: Salon | null;
  isOwner: boolean;
  isMember: boolean;
  members: SalonMember[];
  subscription: SalonSubscription | null;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  setSubscription: (sub: SalonSubscription | null) => void;
}

const SalonContext = createContext<SalonContextValue | undefined>(undefined);

export function SalonProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [members, setMembers] = useState<SalonMember[]>([]);
  const [subscription, setSubscription] = useState<SalonSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSalon = async () => {
    if (!isAuthenticated || !user?.salonId) {
      setSalon(null);
      setMembers([]);
      setSubscription(null);
      return;
    }

    setLoading(true);
    try {
      const salonResponse = await getSalon(user.salonId);
      setSalon(salonResponse);
      setMembers(salonResponse.members || []);
      if (salonResponse.subscription) {
        setSubscription(salonResponse.subscription);
      } else {
        const sub = await getSalonSubscription(salonResponse.id);
        setSubscription(sub);
      }
    } catch (error) {
      console.error('Failed to load salon context', error);
      setSalon(null);
      setMembers([]);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalon();
  }, [isAuthenticated, user?.salonId]);

  const refreshMembers = async () => {
    if (!salon) return;
    try {
      const res = await getSalonMembers(salon.id);
      setMembers(res.members);
      setSalon((prev) =>
        prev
          ? {
              ...prev,
              members: res.members,
              pendingInvitations: res.pendingInvitations,
              memberCount: res.members.length,
            }
          : prev
      );
    } catch (error) {
      console.error('Failed to refresh members', error);
    }
  };

  const contextValue = useMemo<SalonContextValue>(
    () => ({
      salon,
      isOwner: Boolean(salon && (salon.ownerId === user?.id || user?.salonRole === 'owner')),
      isMember: Boolean(salon && user?.salonId === salon.id),
      members,
      subscription,
      loading,
      refresh: loadSalon,
      refreshMembers,
      setSubscription,
    }),
    [salon, members, subscription, loading, user?.id, user?.salonId, user?.salonRole]
  );

  return <SalonContext.Provider value={contextValue}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  const ctx = useContext(SalonContext);
  if (!ctx) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return ctx;
}
