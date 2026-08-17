import React from 'react';
import { WifiOff, AlertCircle, FileSpreadsheet, Cpu, RefreshCw } from 'lucide-react';

const ErrorState = ({ type, onAction, title, description, actionText }) => {
  const configs = {
    offline: {
      icon: WifiOff,
      iconColor: 'text-[#FF5D73]',
      bgColor: 'bg-[#FF5D73]/10',
      borderColor: 'border-[#FF5D73]/20',
      title: title || 'API Offline',
      description: description || 'The PricePilot AI core services are currently unreachable. Please check your network or server status.',
      actionText: actionText || 'Reconnect',
      actionClass: 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white'
    },
    missing: {
      icon: FileSpreadsheet,
      iconColor: 'text-[#0098f3]',
      bgColor: 'bg-[#0098f3]/10',
      borderColor: 'border-[#0098f3]/20',
      title: title || 'Dataset Missing',
      description: description || 'No training transaction catalog detected. Upload your historical sales layers to provision predictive features.',
      actionText: actionText || 'Upload Dataset',
      actionClass: 'bg-[#0098f3] hover:bg-[#0098f3]/95 text-white'
    },
    idle: {
      icon: Cpu,
      iconColor: 'text-[#B8BCC8]',
      bgColor: 'bg-white/[0.02]',
      borderColor: 'border-white/[0.06]',
      title: title || 'Pipeline Idle',
      description: description || 'Waiting for new training cycle execution. Trigger the training pipeline flow to start.',
      actionText: actionText || 'Start Training',
      actionClass: 'bg-gradient-to-tr from-[#da4e24] to-[#0098f3] text-white hover:opacity-95'
    },
    unavailable: {
      icon: AlertCircle,
      iconColor: 'text-[#da4e24]',
      bgColor: 'bg-[#da4e24]/10',
      borderColor: 'border-[#da4e24]/20',
      title: title || 'Training Unavailable',
      description: description || 'Model optimization engine encountered a validation error inside PostgreSQL schemas.',
      actionText: actionText || 'Retry',
      actionClass: 'bg-[#da4e24] hover:bg-[#da4e24]/95 text-white'
    }
  };

  const current = configs[type] || configs.offline;
  const Icon = current.icon;

  return (
    <div className={`glass-card p-8 rounded-[24px] border ${current.borderColor} flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto my-12 animate-fadeIn`}>
      <div className={`p-4 ${current.bgColor} rounded-2xl ${current.iconColor} border border-white/[0.04]`}>
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">{current.title}</h3>
        <p className="text-xs text-[#B8BCC8]/70 font-medium leading-relaxed">{current.description}</p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className={`px-5 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all duration-300 flex items-center gap-1.5 shadow-sm ${current.actionClass}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {current.actionText}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
