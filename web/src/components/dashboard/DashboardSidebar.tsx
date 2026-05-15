import React from 'react';
import {
  Calendar,
  Users,
  Settings,
  Clock,
  Image,
  TrendingUp,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardSidebarProps {
  user: {
    fullName: string;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
  profilePictureUrl?: string | null;
  isSalonMember?: boolean;
}

export function DashboardSidebar({
  user,
  activeTab,
  onTabChange,
  profilePictureUrl,
  isSalonMember = false,
}: DashboardSidebarProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();

  const baseNavItems = [
    { id: 'calendar', icon: Calendar, label: t('dashboard.sidebar.calendar') },
    { id: 'bookings', icon: Clock, label: t('dashboard.sidebar.bookings') },
    { id: 'clients', icon: Users, label: t('dashboard.sidebar.clients') },
    { id: 'services', icon: Sparkles, label: t('dashboard.sidebar.services') },
    { id: 'portfolio', icon: Image, label: t('dashboard.sidebar.portfolio') },
  ];

  const proNavItems = [
    { id: 'analytics', icon: TrendingUp, label: t('dashboard.sidebar.analytics') },
    { id: 'payments', icon: CreditCard, label: t('dashboard.sidebar.payments') },
    { id: 'settings', icon: Settings, label: t('dashboard.sidebar.settings') },
  ];

  const navItems = isSalonMember
    ? [...baseNavItems, { id: 'settings', icon: Settings, label: t('dashboard.sidebar.settings') }]
    : [...baseNavItems, ...proNavItems];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-24 w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-6 p-3 bg-blue-50 rounded-xl">
        <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white overflow-hidden flex-shrink-0">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={user?.fullName || 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{user?.fullName.charAt(0).toUpperCase() || 'A'}</span>
          )}
        </div>
        <div>
          <div className="text-sm font-medium">{user?.fullName}</div>
          <div className="text-xs text-gray-600">
            {isSalonMember ? t('dashboard.sidebar.artist') : t('dashboard.sidebar.artist')}
          </div>
        </div>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
