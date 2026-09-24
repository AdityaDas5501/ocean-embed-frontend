import { useState } from 'react';
import OceanGlobeView from './components/OceanGlobeView';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

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
