import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { checkBackendHealth } from '../services/api';

const Layout = ({ children, activeTab, setActiveTab, pageTitle }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Poll backend health status periodically
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      try {
        const res = await checkBackendHealth();
        if (isMounted) setIsBackendConnected(Boolean(res));
      } catch (err) {
        if (isMounted) setIsBackendConnected(false);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Sticky Header */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Center Main Stage */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Universal Non-Trapping Breadcrumbs Navigation */}
          <Breadcrumbs pageTitle={pageTitle} />

          {/* Framer Motion Animated Children */}
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Persistent Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
