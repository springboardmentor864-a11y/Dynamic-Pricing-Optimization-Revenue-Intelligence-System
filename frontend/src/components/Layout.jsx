import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
import AIChatBot from './AIChatBot';

const Layout = ({ dashboardStats, metrics }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] visionos-bg text-[#FFFFFF] font-sans relative">
      {/* Premium VisionOS Background Ambient Glows */}
      <div className="glow-blob-1 w-[50vw] h-[50vw] -top-[15%] -left-[15%] opacity-40 animate-fluidGlow1" />
      <div className="glow-blob-2 w-[55vw] h-[55vw] -bottom-[20%] -right-[20%] opacity-30 animate-fluidGlow2" />
      <div className="absolute top-[25%] right-[15%] w-[35vw] h-[35vw] bg-[#da4e24]/10 blur-[130px] rounded-full pointer-events-none animate-pulse duration-[8s]" />

      {/* Navigation Sidebar */}
      <Sidebar collapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header bar */}
        <TopBar />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Copilot chatbot */}
      <AIChatBot dashboardStats={dashboardStats} metrics={metrics} />

      {/* Ctrl + K command dialog overlay */}
      <CommandPalette />
    </div>
  );
};

export default Layout;
