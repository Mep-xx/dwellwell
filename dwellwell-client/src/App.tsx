import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AppRoutes from './router/AppRoutes';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <Router>
        <HelmetProvider>
          <AppRoutes />
          <Toaster />
        </HelmetProvider>
      </Router>
    </>
  );
}

export default App;