import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { PaddleProvider } from './components/PaddleProvider';
import { AuthProvider } from './contexts/AuthContext';
import { SalonProvider } from './contexts/SalonContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LandingPage } from './pages/LandingPage';
import { ArtistDirectory } from './pages/ArtistDirectory';
import { ArtistProfile } from './pages/ArtistProfile';
import { PricingPage } from './pages/PricingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPreview } from './pages/DashboardPreview';
import { DashboardPage } from './pages/DashboardPage';
import { SalonMemberDashboardPage } from './pages/SalonMemberDashboardPage';
import { BookingPage } from './pages/BookingPage';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailure } from './pages/PaymentFailure';
import { ProfilePage } from './pages/ProfilePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ChangePhonePage } from './pages/ChangePhonePage';
import { AboutUs } from './pages/AboutUs';
import { CreateSalonPage } from './pages/CreateSalonPage';
import { Contact } from './pages/Contact';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { RefundPolicy } from './pages/RefundPolicy';
import { EnterpriseDashboard } from './pages/EnterpriseDashboard';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SalonProvider>
          <PaddleProvider>
            <BrowserRouter>
              <ScrollToTop />
              <div className="min-h-screen bg-white">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/features" element={<FeaturesPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/directory" element={<ArtistDirectory />} />
                    <Route path="/artist/:id" element={<ArtistProfile />} />
                    <Route path="/book/:id" element={<BookingPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/dashboard/:artistId" element={<SalonMemberDashboardPage />} />
                    <Route path="/dashboard/settings/change-phone" element={<ChangePhonePage />} />
                    <Route path="/enterprise/create" element={<CreateSalonPage />} />
                    <Route path="/demo" element={<DashboardPreview />} />
                    <Route path="/enterprise" element={<EnterpriseDashboard />} />
                    <Route path="/enterprise/team" element={<TeamManagementPage />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/failure" element={<PaymentFailure />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/:id" element={<ArtistProfile />} />
                  </Routes>
                </main>
                <Footer />
              </div>
              <NotificationPermissionPrompt />
            </BrowserRouter>
            <Toaster position="top-center" />
          </PaddleProvider>
        </SalonProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
