import { Link, useRouterState } from "@tanstack/react-router";
import {
  FiBarChart2,
  FiGrid,
  FiPackage,
  FiSettings,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import "../styles/Sidebar.css";

const ITEMS = [
  { label: "Dashboard", to: "/", icon: FiGrid },
  { label: "Products", to: "/products", icon: FiPackage },
  { label: "Forecast", to: "/forecast", icon: FiBarChart2 },
  { label: "Recommendations", to: "/recommendations", icon: FiTrendingUp },
  { label: "Settings", to: "/settings", icon: FiSettings },
];

/** Left navigation with active-route highlighting. */
export default function Sidebar({ open = false, onClose }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {ITEMS.map(({ label, to, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className={`pp-sidebar-link ${active ? "pp-sidebar-link-active" : ""}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <FiTrendingUp className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">PricePilot</span>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="pp-sidebar hidden lg:flex">
        {brand}
        {nav}
        <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
          Revenue Intelligence v1.0
        </div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="pp-sidebar absolute left-0 top-0 h-full">
            <div className="flex items-center justify-between">
              {brand}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="mr-3 text-muted-foreground"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </>
  );
}
