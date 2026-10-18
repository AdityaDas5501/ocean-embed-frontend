import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { checkBackendHealth } from './services/api';
import { onAuthChange } from './services/firebase';
import { useAuth } from './context/AuthContext';

/**
 * Inner component so we have access to AuthContext (AuthProvider is in main.tsx).
 * Handles the Firebase auth listener that keeps isAuthenticated in sync with
 * real Firebase session state (Google OAuth / verified email).
 */
function AppRoutes() {
  const { login } = useAuth();

  useEffect(() => {
    // Wake the backend from sleep (e.g. Render free tier)
    checkBackendHealth().then((isAwake) => {
      if (isAwake) console.log('Backend is awake!');
    });

    // Sync Firebase auth state into our AuthContext.
    // Covers Google OAuth and verified-email sessions.
    const unsubscribe = onAuthChange((user) => {
      if (
        user &&
        (user.emailVerified || user.providerData.some((p) => p.providerId === 'google.com'))
      ) {
        login({
          name: user.displayName || 'Research Scientist',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          role: 'Ocean Explorer',
        });
      }
      // Signed-out or unverified users are handled by LoginPage / SignupPage themselves.
    });

    return () => unsubscribe();
  }, [login]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
