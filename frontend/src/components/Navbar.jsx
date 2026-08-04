import { FiBell, FiMenu } from "react-icons/fi";
import SearchBar from "./SearchBar";
import "../styles/Navbar.css";

/** Top bar: logo (mobile), search, notifications, profile. */
export default function Navbar({ query, onQueryChange, onMenuClick }) {
  return (
    <header className="pp-navbar">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="pp-navbar-icon-btn inline-flex"
        >
          <FiMenu className="h-5 w-5" />
        </button>
      </div>


      <span className="text-sm font-semibold tracking-tight text-foreground lg:hidden">
        PricePilot
      </span>

      <SearchBar
        value={query}
        onChange={onQueryChange}
        placeholder="Search products, SKUs, categories..."
        className="ml-auto w-full max-w-xs sm:max-w-sm lg:ml-0 lg:max-w-md"
      />

      <div className="ml-auto flex items-center gap-1.5">
        <button type="button" aria-label="Notifications" className="pp-navbar-icon-btn inline-flex">
          <FiBell className="h-5 w-5" />
          <span className="pp-navbar-dot" />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            AR
          </span>
          <span className="hidden text-sm font-medium text-foreground sm:block">Ava Reyes</span>
        </div>
      </div>
    </header>
  );
}
