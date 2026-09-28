import { useState, useEffect } from 'react';
import OceanGlobeView from './components/OceanGlobeView';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { checkBackendHealth } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    // Ping backend to wake it up from sleep (e.g. Render free tier)
    checkBackendHealth().then((isAwake) => {
      if (isAwake) console.log('Backend is awake!');
    });

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage 
          onLogin={() => setIsAuthenticated(true)} 
          onNavigateToSignup={() => setAuthView('signup')}
        />
      );
    } else {
      return (
        <SignupPage 
          onSignup={() => setIsAuthenticated(true)}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <OceanGlobeView />
    </div>
  );
}

export default App;
