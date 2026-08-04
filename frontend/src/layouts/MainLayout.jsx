import { useEffect, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { STORAGE_KEYS } from "../utils/constants";
import "../styles/App.css";

/** Shell: sidebar + navbar + routed page content. */
export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Apply the persisted theme after hydration.
  useEffect(() => {
    const isDark = window.localStorage.getItem(STORAGE_KEYS.theme) === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);



  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          query={query}
          onQueryChange={setQuery}
          onMenuClick={() => setMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
