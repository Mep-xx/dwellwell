import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If an authenticated session hits '/', push them to the app dashboard
  useEffect(() => {
    if (!loading && user) navigate('/app', { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="bg-white text-gray-800 flex flex-col max-w-7xl mx-auto">
      <Helmet>
        <title>DwellWell – Home Maintenance Made Simple</title>
        <meta
          name="description"
          content="Track and manage your home maintenance tasks with ease using DwellWell. Stay on top of filters, inspections, and reminders!"
        />
      </Helmet>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 sm:px-6 py-16 bg-brand-background">
        <h2 className="text-4xl font-extrabold text-brand-foreground mb-4 leading-tight">
          Home maintenance made simple.
        </h2>
        <p className="max-w-xl text-lg text-gray-700 mb-8 leading-relaxed text-balance">
          DwellWell helps new homeowners stay on top of tasks with reminders, smart suggestions,
          and easy tracking for everything from your AC to your lawn.
        </p>
        <Link
          to="/signup"
          className="text-lg bg-brand-primary text-white px-6 py-3 rounded-xl shadow hover:bg-blue-600 transition"
        >
          Get Started
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6 py-16 bg-white text-left">
        {[
          { icon: '✅', title: 'Stay on track', desc: 'Never miss a filter change or inspection again.' },
          { icon: '🧰', title: 'Track your home', desc: 'Log your appliances, rooms, and systems.' },
          { icon: '🔔', title: 'Smart reminders', desc: 'Get notified when tasks are due or overdue.' },
          { icon: '🧠', title: 'AI suggestions', desc: 'Maintenance guides tailored to your items.' },
          { icon: '🏆', title: 'Feel accomplished', desc: 'Celebrate your progress every month.' },
          { icon: '📅', title: 'Custom schedules', desc: 'Set your own pace with flexible timing.' },
        ].map((f, i) => (
          <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-1">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 px-4 sm:px-6 py-16 text-center">
        <h3 className="text-2xl font-bold text-brand-foreground mb-6">What homeowners are saying</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              quote: 'I had no idea how much there was to keep track of until DwellWell made it effortless.',
              name: 'Jess L.',
              location: 'First-time homeowner in Vermont',
            },
            {
              quote: 'Reminders about filters, lawn care, even the hot tub! This app saved our weekends.',
              name: 'Raj & Mia',
              location: 'Busy parents in Oregon',
            },
            {
              quote: 'I used to dread maintenance, now I actually look forward to ticking things off!',
              name: 'Brian K.',
              location: 'DIYer in Colorado',
            },
          ].map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow border border-gray-100">
              <p className="text-gray-700 italic mb-4">“{t.quote}”</p>
              <p className="text-sm font-semibold text-brand-primary">{t.name}</p>
              <p className="text-sm text-gray-500">{t.location}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-4 sm:px-6 py-12 bg-brand-background">
        <h3 className="text-2xl font-bold text-brand-foreground mb-4">
          Ready to simplify your home care?
        </h3>
        <Link
          to="/signup"
          className="text-lg bg-brand-primary text-white px-6 py-3 rounded-xl shadow hover:bg-blue-600 transition"
        >
          Get Started Now
        </Link>
      </section>
    </div>
  );
}
