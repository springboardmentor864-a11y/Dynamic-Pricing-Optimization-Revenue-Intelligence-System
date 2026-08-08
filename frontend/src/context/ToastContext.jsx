import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#111827]/95 border-[#10B981]/40 text-[#10B981]',
          icon: <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-[#111827]/95 border-[#EF4444]/40 text-[#EF4444]',
          icon: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-[#111827]/95 border-[#F59E0B]/40 text-[#F59E0B]',
          icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#111827]/95 border-[#2563EB]/40 text-[#60A5FA]',
          icon: <Info className="w-5 h-5 text-[#2563EB] shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = getToastStyle(t.type);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`pointer-events-auto p-4 rounded-[14px] border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-xs font-semibold ${style.bg}`}
              >
                <div className="flex items-center gap-3">
                  {style.icon}
                  <span className="text-slate-100 font-medium leading-relaxed">{t.message}</span>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
