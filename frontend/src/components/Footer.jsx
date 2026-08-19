import React from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/40 backdrop-blur-md py-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left - Copyright */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />

          <span>
            © 2026 PricePilot AI | Infosys Springboard Project
          </span>
        </div>

        {/* Quick Navigation */}
        <nav className="flex items-center gap-6 text-xs text-slate-400">

          <button
            type="button"
            onClick={() => handleNavigation('/dashboard')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => handleNavigation('/predict')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            Predict Price
          </button>

          <button
            type="button"
            onClick={() => handleNavigation('/performance')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            Model Performance
          </button>

          <button
            type="button"
            onClick={() => handleNavigation('/about')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            Developer Team
          </button>

        </nav>

        {/* Right - Developer */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">

          <span>Developed with</span>

          <Heart
            className="w-3.5 h-3.5 text-rose-500 fill-rose-500"
          />

          <span>
            by Narendar Reddy & Team
          </span>

        </div>

      </div>
    </footer>
  );
};

export default Footer;