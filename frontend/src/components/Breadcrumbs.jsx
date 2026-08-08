import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home, Sparkles } from 'lucide-react';

const routeNameMap = {
  dashboard: 'Dashboard',
  predict: 'New AI Prediction',
  history: 'Prediction History',
  analytics: 'System Analytics',
  profile: 'My Profile',
  settings: 'System Settings',
  about: 'Help & Documentation',
  users: 'User Management',
  dataset: 'Dataset Overview',
  database: 'Database Monitor',
  models: 'ML Benchmark',
  performance: 'Model Performance',
  reports: 'Executive Reports',
  unauthorized: '403 Unauthorized',
  '404': '404 Page Not Found',
};

const Breadcrumbs = ({ customBackPath, pageTitle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we are at root or login, do not show breadcrumbs
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  const handleBack = () => {
    if (customBackPath) {
      navigate(customBackPath);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <nav className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-4 rounded-[14px] bg-[#111827]/80 border border-[#1F2937] backdrop-blur-md">
      
      {/* Left: Interactive Back Button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1F2937] text-xs font-bold transition group shadow-sm w-fit"
        title="Return to previous screen"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-purple-400 group-hover:-translate-x-0.5 transition-transform" />
        <span>← Back</span>
      </button>

      {/* Right: Path Breadcrumb Links */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto font-sans">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 hover:text-purple-400 transition"
        >
          <Home className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden xs:inline">Home</span>
        </Link>

        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = routeNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <React.Fragment key={to}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {isLast ? (
                <span className="font-bold text-white bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20 truncate">
                  {pageTitle || displayName}
                </span>
              ) : (
                <Link to={to} className="hover:text-purple-400 transition truncate">
                  {displayName}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

    </nav>
  );
};

export default Breadcrumbs;
