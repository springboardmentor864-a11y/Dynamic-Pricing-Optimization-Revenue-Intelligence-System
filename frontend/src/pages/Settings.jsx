import { useEffect, useState } from "react";
import { FiMoon, FiSave, FiSun } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { getBaseUrl, setBaseUrl } from "../services/api";
import {
  DEFAULT_REFRESH_INTERVAL,
  STORAGE_KEYS,
} from "../utils/constants";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [baseUrl, setUrl] = useState("");
  const [interval, setIntervalValue] = useState(DEFAULT_REFRESH_INTERVAL);
  const [saved, setSaved] = useState(false);

  // Hydrate from localStorage on mount (avoids SSR mismatch).
  useEffect(() => {
    setUrl(getBaseUrl());
    setIntervalValue(
      Number(window.localStorage.getItem(STORAGE_KEYS.refreshInterval)) ||
        DEFAULT_REFRESH_INTERVAL,
    );
    const isDark = window.localStorage.getItem(STORAGE_KEYS.theme) === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(STORAGE_KEYS.theme, next ? "dark" : "light");
  };

  const handleSave = (e) => {
    e.preventDefault();
    setBaseUrl(baseUrl);
    window.localStorage.setItem(STORAGE_KEYS.refreshInterval, String(interval));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Appearance, backend connection and profile preferences."
      />

      <div className="grid max-w-3xl gap-6">
        <section className="pp-card p-5">
          <h2 className="text-base font-semibold text-foreground">Appearance</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Dark mode</p>
              <p className="text-xs text-muted-foreground">
                Switch between the light and dark dashboard theme.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle dark mode"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-card shadow transition-transform ${
                  darkMode ? "translate-x-5" : "translate-x-0.5"
                }`}
              >
                {darkMode ? (
                  <FiMoon className="h-3 w-3 text-primary" />
                ) : (
                  <FiSun className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            </button>
          </div>
        </section>

        <form className="pp-card p-5" onSubmit={handleSave}>
          <h2 className="text-base font-semibold text-foreground">Backend connection</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Backend URL</span>
              <input
                className="pp-input"
                value={baseUrl}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-foreground">
                Refresh interval (seconds)
              </span>
              <input
                className="pp-input"
                type="number"
                min={0}
                value={interval}
                onChange={(e) => setIntervalValue(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <FiSave className="h-4 w-4" /> Save changes
            </button>
            {saved ? (
              <span className="pp-badge pp-badge-success">Settings saved</span>
            ) : null}
          </div>
        </form>

        <section className="pp-card p-5">
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              AR
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Ava Reyes</p>
              <p className="text-xs text-muted-foreground">
                Revenue Manager · ava.reyes@pricepilot.io
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Full name</span>
              <input className="pp-input" defaultValue="Ava Reyes" />
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Email</span>
              <input className="pp-input" defaultValue="ava.reyes@pricepilot.io" />
            </label>
          </div>
        </section>
      </div>
    </>
  );
}
