import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import { User, AppRoute } from './types';

import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading, signOut } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0F172A]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={() => setIsAuthOpen(false)}
      />

      <Routes>
        {/* Public Landing */}
        <Route
          path={AppRoute.LANDING}
          element={
            user ? (
              <Navigate to={AppRoute.DASHBOARD} replace />
            ) : (
              <LandingPage
                onGetStarted={() => setIsAuthOpen(true)}
                onLogin={() => setIsAuthOpen(true)}
              />
            )
          }
        />

        {/* Protected Dashboard */}
        <Route
          path={`${AppRoute.DASHBOARD}/*`}
          element={
            <Dashboard user={user} onLogout={signOut} />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={AppRoute.LANDING} replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;