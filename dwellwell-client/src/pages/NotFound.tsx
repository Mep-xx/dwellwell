// dwellwell-client/src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-brand-primary mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-6">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/app">
        <Button>Go back home</Button>
      </Link>
    </div>
  );
}
