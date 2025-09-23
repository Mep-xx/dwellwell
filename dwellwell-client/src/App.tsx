//dwellwell-client/src/App.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AppRoutes from './router/AppRoutes';
import { Toaster } from '@/components/ui/toaster';
import { HomeProvider } from '@/context/HomeContext';

function App() {
  return (
    <Router>
      <HelmetProvider>
        <HomeProvider>
          <AppRoutes />
          <Toaster />
        </HomeProvider>
      </HelmetProvider>
    </Router>
  );
}

export default App;
