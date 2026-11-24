import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { RouteSeo } from './components/RouteSeo';
import { AboutPage } from './pages/AboutPage';
import { CareersPage } from './pages/CareersPage';
import { ContactPage } from './pages/ContactPage';
import { EditorPage } from './pages/EditorPage';
import { ExplorePage } from './pages/ExplorePage';
import { ExportsPage } from './pages/ExportsPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PricingPage } from './pages/PricingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReferPage } from './pages/ReferPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudioPage } from './pages/StudioPage';
import { SupportPage } from './pages/SupportPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TermsPage } from './pages/TermsPage';
import { WaxSealPage } from './pages/WaxSealPage';
import { AtmospherePage } from './pages/AtmospherePage';
import { PremiumTemplatesPage } from './pages/PremiumTemplatesPage';
import { CardsPage } from './pages/CardsPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        Loading Patra Studio...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RouteSeo />
          <Routes>
            {/* Public Marketing & Legal Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Auth Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Authenticated Web Studio & App Dashboard */}
            <Route path="/app" element={<RequireAuth><ExplorePage /></RequireAuth>} />
            <Route path="/app/cards" element={<RequireAuth><CardsPage /></RequireAuth>} />
            <Route path="/app/studio" element={<RequireAuth><StudioPage /></RequireAuth>} />
            <Route path="/app/premium-templates" element={<RequireAuth><PremiumTemplatesPage /></RequireAuth>} />
            <Route path="/app/wax-seal" element={<RequireAuth><WaxSealPage /></RequireAuth>} />
            <Route path="/app/atmosphere" element={<RequireAuth><AtmospherePage /></RequireAuth>} />
            <Route path="/app/exports" element={<RequireAuth><ExportsPage /></RequireAuth>} />
            <Route path="/app/refer" element={<RequireAuth><ReferPage /></RequireAuth>} />
            <Route path="/app/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/app/support" element={<RequireAuth><SupportPage /></RequireAuth>} />
            <Route path="/app/editor/:id" element={<RequireAuth><EditorPage /></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
