import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AppRoutes from './router/AppRoutes';
import { Toaster } from "@/components/ui/toaster";
import { HomeProvider } from "@/context/HomeContext"; // ✅ make sure this path matches your setup

function App() {
  return (
    <Router>
      <HelmetProvider>
        <HomeProvider> {/* ✅ Wraps routing + toasts in Home context */}
          <AppRoutes />
          <Toaster />
        </HomeProvider>
      </HelmetProvider>
    </Router>
  );
}

export default App;
