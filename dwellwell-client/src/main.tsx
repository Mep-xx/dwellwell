// dwellwell-client/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// .env:
// VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!clientId) {
  // Optional: fail fast in dev if missing
  console.error('VITE_GOOGLE_CLIENT_ID is not set');
}

console.log('GIS clientId:', import.meta.env.VITE_GOOGLE_CLIENT_ID, 'origin:', window.location.origin);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId!}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
