import React, { useState } from 'react';
import { Menu, X, LogOut, User, LayoutDashboard, Globe, Crown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { useSalon } from '../contexts/SalonContext';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { isOwner, salon, subscription } = useSalon();
  const hasActiveSalon = salon && subscription && subscription.status !== 'cancelled' && subscription.status !== 'expired';

  const handleLogout = async () => {
    await logout();
    toast.success(t('auth.logoutSuccess') || 'Successfully logged out');
    navigate('/');
  };

  const handleStartFreeTrial = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated && user?.userType === 'artist' && user?.isFreeTrialActive) {
      toast.info(t('toast.freeTrialActive'), {
        description: t('toast.freeTrialActiveDesc'),
        duration: 4000,
      });
      return;
    }

    if (isAuthenticated && user?.userType !== 'artist') {
      toast.info(t('toast.createArtistAccount'), {
        description: t('toast.createArtistAccountDesc'),
        duration: 4000,
      });
      return;
    }
    toast.info(t('toast.createArtistAccount'), {
      description: t('toast.createArtistAccountDesc'),
      duration: 4000,
    });
    navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center cursor-pointer">
            <img 
              src="/SmartTermin_Vector.png" 
              alt={t('brand.name') || 'SmartTermin'} 
              className="h-10 w-auto rounded-lg"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/features"
              className={`transition-colors ${
                location.pathname === '/features'
                  ? 'text-sky-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.features')}
            </Link>
            <Link
              to="/pricing"
              className={`transition-colors ${
                location.pathname === '/pricing'
                  ? 'text-sky-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.pricing')}
            </Link>
            <Link
              to="/directory"
              className={`transition-colors ${
                location.pathname === '/directory'
                  ? 'text-sky-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.artists')}
            </Link>

            {isAuthenticated ? (
              <>
                {user?.userType === 'artist' ? (
                  <>
                    {hasActiveSalon && isOwner && user?.isArtistInSalon && user?.artistId ? (
                      <>
                        <button
                          onClick={() => navigate(`/dashboard/${user.artistId}`)}
                          className={`flex items-center gap-2 transition-colors ${
                            location.pathname.startsWith(`/dashboard/${user.artistId}`)
                              ? 'text-sky-600'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <LayoutDashboard size={18} />
                          <span>{t('nav.dashboard')}</span>
                        </button>
                        <button
                          onClick={() => navigate('/enterprise')}
                          className={`flex items-center gap-2 transition-colors ${
                            location.pathname.startsWith('/enterprise')
                              ? 'text-sky-600'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Crown size={18} />
                          <span>{t('nav.salon')}</span>
                        </button>
                      </>
                    ) : hasActiveSalon && isOwner && !user?.isArtistInSalon ? (
                      <>
                        <button
                          onClick={() => navigate('/enterprise')}
                          className={`flex items-center gap-2 transition-colors ${
                            location.pathname.startsWith('/enterprise')
                              ? 'text-sky-600'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Crown size={18} />
                          <span>{t('nav.salon')}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate('/dashboard')}
                          className={`transition-colors ${
                            location.pathname.startsWith('/dashboard')
                              ? 'text-sky-600'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {t('nav.dashboard')}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <User size={18} />
                    <span className="text-sm">{t('nav.profile')}</span>
                  </Link>
                )}

                <div className="relative">
                  <button
                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Globe size={18} />
                    <span className="text-sm">{language === 'en' ? 'EN' : 'MK'}</span>
                  </button>
                  {languageMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setLanguageMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-20">
                        <button
                          onClick={() => {
                            setLanguage('en');
                            setLanguageMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            language === 'en'
                              ? 'bg-sky-50 text-sky-600 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {t('nav.language.en')}
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('mk');
                            setLanguageMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            language === 'mk'
                              ? 'bg-sky-50 text-sky-600 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {t('nav.language.mk')}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900 rounded-full px-4"
                >
                  <LogOut size={18} className="mr-2" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <div className="relative">
                  <button
                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Globe size={18} />
                    <span className="text-sm">{language === 'en' ? 'EN' : 'MK'}</span>
                  </button>
                  {languageMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setLanguageMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-20">
                        <button
                          onClick={() => {
                            setLanguage('en');
                            setLanguageMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            language === 'en'
                              ? 'bg-sky-50 text-sky-600 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {t('nav.language.en')}
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('mk');
                            setLanguageMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            language === 'mk'
                              ? 'bg-sky-50 text-sky-600 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {t('nav.language.mk')}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <Link to="/auth" className="text-gray-600 hover:text-gray-900 transition-colors">
                  {t('nav.login')}
                </Link>
              </>
            )}
          </nav>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed top-16 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50 md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col gap-4">
                <Link
                  to="/features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left text-gray-600 hover:text-gray-900"
                >
                  {t('nav.features')}
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left text-gray-600 hover:text-gray-900"
                >
                  {t('nav.pricing')}
                </Link>
                <Link
                  to="/directory"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left text-gray-600 hover:text-gray-900"
                >
                  {t('nav.artists')}
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left text-gray-600 hover:text-gray-900"
                >
                  {t('nav.contact')}
                </Link>

                {isAuthenticated ? (
                  <>
                    {user?.userType === 'artist' ? (
                      <>
                        {hasActiveSalon && isOwner && user?.isArtistInSalon && user?.artistId ? (
                          <>
                            <button
                              onClick={() => {
                                navigate(`/dashboard/${user.artistId}`);
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-2 text-left text-gray-600 hover:text-gray-900 w-full"
                            >
                              <LayoutDashboard size={18} />
                              <span>{t('nav.dashboard')}</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/enterprise');
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-2 text-left text-gray-600 hover:text-gray-900 w-full"
                            >
                              <Crown size={18} />
                              <span>{t('nav.salon')}</span>
                            </button>
                          </>
                        ) : hasActiveSalon && isOwner && !user?.isArtistInSalon ? (
                          <>
                            <button
                              onClick={() => {
                                navigate('/enterprise');
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-2 text-left text-gray-600 hover:text-gray-900 w-full"
                            >
                              <Crown size={18} />
                              <span>{t('nav.salon')}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                navigate('/dashboard');
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-2 text-left text-gray-600 hover:text-gray-900 w-full"
                            >
                              <span>{t('nav.dashboard')}</span>
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-left text-gray-600 hover:text-gray-900"
                      >
                        <User size={18} />
                        <span>{t('nav.profile')}</span>
                      </Link>
                    )}
                    <Button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full text-left text-gray-600 hover:text-gray-900"
                    >
                      <LogOut size={18} className="mr-2 inline" />
                      {t('nav.logout')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-left text-gray-600 hover:text-gray-900"
                    >
                      {t('nav.login')}
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-2 text-left text-gray-600 hover:text-gray-900">
                  <Globe size={18} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        language === 'en' ? 'bg-sky-100 text-sky-600 font-medium' : ''
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('mk');
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        language === 'mk' ? 'bg-sky-100 text-sky-600 font-medium' : ''
                      }`}
                    >
                      MK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
