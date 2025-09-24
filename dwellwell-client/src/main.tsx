// dwellwell-client/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';           // Tailwind + tiny base reset (no tokens)
import './styles/global.css';   // ✅ all theme variables + families
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import ThemeBridge from './components/ThemeBridge';

// .env: VITE_GOOGLE_CLIENT_ID=...
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!clientId) console.error('VITE_GOOGLE_CLIENT_ID is not set');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId!}>
      <AuthProvider>
        <ThemeProvider>
          <ThemeBridge />
          <App />
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
