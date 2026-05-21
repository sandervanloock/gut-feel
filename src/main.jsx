import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import './styles/app.css';
import {AuthProvider, useAuth} from './auth/AuthContext.jsx';
import {LoginScreen} from './auth/LoginScreen.jsx';
import {App} from './App.jsx';

registerSW({ immediate: true });

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
          flex: 1, minHeight: '100vh', background: 'var(--bg)',
      }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontStyle: 'italic', color: 'var(--muted)', letterSpacing: '-0.02em' }}>
          Gut Feel
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  return <App />;
}

createRoot(document.getElementById('app-root')).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>
);
