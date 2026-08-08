import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRocket, FaBrain, FaChartLine } from 'react-icons/fa';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing PricePilot AI Engine...');

  useEffect(() => {
    const textIntervals = [
      { p: 25, text: 'Connecting to FastAPI Microservices...' },
      { p: 50, text: 'Loading Extra Trees Regressor ML Engine...' },
      { p: 75, text: 'Establishing SQLite SQLAlchemy Connection...' },
      { p: 100, text: 'Enterprise AI Suite Ready.' },
    ];

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        const next = prev + 2;
        const matchingText = textIntervals.find((item) => item.p <= next && item.p > prev);
        if (matchingText) {
          setStatusText(matchingText.text);
        }
        return next;
      });
    }, 45); // 100 steps * 45ms = ~3.5 seconds

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white overflow-hidden"
    >
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl"></div>
      </div>

      {/* Glassmorphic Container Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg mx-4 p-8 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 shadow-2xl text-center"
      >
        {/* Animated Enterprise Logo */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl rotate-6 blur-md opacity-75 animate-pulse"></div>
          <div className="relative w-20 h-20 bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
            <FaRocket className="text-4xl text-white transform -rotate-12 animate-bounce" />
          </div>
        </div>

        {/* Project Titles */}
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight mb-2">
          PricePilot <span className="text-blue-400 font-black">AI</span>
        </h1>
        <p className="text-xs font-semibold tracking-wider uppercase text-blue-400/90 mb-3">
          Infosys Springboard 7.0 Enterprise AI Solution
        </p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-8">
          Machine Learning Based Dynamic Pricing & Demand Forecasting System
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-950/80 rounded-full h-3 p-0.5 border border-slate-800 mb-3 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-lg"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          ></motion.div>
        </div>

        {/* Status Text & Percentage */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="truncate max-w-[280px]">{statusText}</span>
          <span className="font-bold text-blue-400">{progress}%</span>
        </div>

        {/* Footer Attribution */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-center space-x-3 text-[11px] text-slate-500">
          <span>Completion: Aug 2026</span>
          <span>•</span>
          <span>Team: Narendar • Manvitha • Pravallika • Ashwindh</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
