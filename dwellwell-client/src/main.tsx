// dwellwell-client/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";           // Tailwind preflight
import "./styles/global.css";   // Theme tokens + utilities + components
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeBridge from "./components/ThemeBridge";
import { restoreTheme } from "./theme/applyTheme";

restoreTheme();

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!clientId) console.error("VITE_GOOGLE_CLIENT_ID is not set");

createRoot(document.getElementById("root")!).render(
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
