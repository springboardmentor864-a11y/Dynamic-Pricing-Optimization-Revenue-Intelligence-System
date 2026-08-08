import React from 'react';

const KPICard = ({ title, value, subtitle, icon: Icon, gradient, borderGlow, trend, trendValue }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass-card p-5 border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group ${
        borderGlow || 'border-slate-800'
      }`}
    >
      {/* Background Subtle Gradient Overlay */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-40 group-hover:scale-125 ${
          gradient || 'bg-purple-500'
        }`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight my-1">
            {value}
          </h3>
        </div>

        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-lg text-white group-hover:rotate-6 transition-transform duration-300`}
        >
          {Icon && <Icon className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 font-medium">{subtitle}</span>

        {trendValue && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              trend === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : trend === 'down'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
            }`}
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '★'} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default KPICard;
