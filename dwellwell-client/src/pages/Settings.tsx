import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEME_CHOICES, themeId } from '../theme/themes';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [selected, setSelected] = useState(themeId(theme.mode, theme.style));

  useEffect(() => setSelected(themeId(theme.mode, theme.style)), [theme]);

  const onSave = () => {
    const choice = THEME_CHOICES.find((c) => c.id === selected);
    if (choice) setTheme({ mode: choice.mode, style: choice.style });
  };

  return (
    <div className="p-6 space-y-6 bg-surface text-body min-h-screen">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Customize your appearance.</p>
      </header>

      <section className="bg-card border border-token rounded-2xl p-6">
        <h2 className="text-lg font-medium mb-3">Appearance</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_CHOICES.map((opt) => (
            <label
              key={opt.id}
              className={`cursor-pointer rounded-xl border border-token p-4 flex items-center gap-3
                ${selected === opt.id ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
            >
              <input
                type="radio"
                name="theme"
                value={opt.id}
                checked={selected === opt.id}
                onChange={(e) => setSelected(e.target.value)}
                className="accent-[rgb(var(--primary))]"
              />
              <div>
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-muted">Light/Dark plus style family.</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={onSave}
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90"
          >
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
