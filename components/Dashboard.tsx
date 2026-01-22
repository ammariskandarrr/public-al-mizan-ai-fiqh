import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { User, AppRoute } from '../types';
import { Bell } from 'lucide-react';
import AgenticChatBot from './AgenticChatBot';
import DocumentAnalyzer from './DocumentAnalyzer';
import LiveConsultant from './LiveConsultant';
import DashboardHome from './DashboardHome';
import CreditPage from './CreditPage';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const location = useLocation();

  // Simulate dummy backend notification logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 10000); // Show notification after 10 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return <Navigate to={AppRoute.LANDING} replace />;
  }



  const isChatPage = location.pathname.split('/').pop() === 'chat';

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] flex selection:bg-blue-100 selection:text-blue-900 font-sans">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
        user={user}
        onLogout={onLogout}
      />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out flex flex-col ${isSidebarCollapsed ? 'ml-20' : 'ml-72'}`}
      >


        {/* Notification Banner - Hidden on Chat Page */}
        {showNotification && !isChatPage && (
          <div className="mx-8 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-1 shadow-lg shadow-blue-500/20 animate-fade-in-down">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                  <Bell size={16} />
                </div>
                <span className="font-medium text-sm sm:text-base">Update: A new Fiqh guideline regarding digital assets has been uploaded to the Knowledge Base.</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { }} // Placeholder for routing logic if needed
                  className="text-xs sm:text-sm bg-white text-blue-700 px-4 py-1.5 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-sm"
                >
                  Review Now
                </button>
                <button onClick={() => setShowNotification(false)} className="text-blue-100 hover:text-white text-sm font-medium px-2">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className={`flex-1 ${isChatPage ? 'p-0 overflow-hidden' : 'p-8 overflow-y-auto custom-scrollbar'}`}>
          <div className={`mx-auto h-full ${isChatPage ? 'max-w-full' : 'max-w-7xl'}`}>
            <Routes>
              <Route path="/" element={<DashboardHome user={user} />} />
              <Route path="chat" element={<AgenticChatBot />} />
              <Route path="documents" element={<DocumentAnalyzer notificationActive={showNotification} />} />
              <Route path="consultant" element={<LiveConsultant />} />
              <Route path="credits" element={<CreditPage />} />
              <Route path="profile" element={<div className="p-8 text-center text-slate-500">Profile Management Placeholder</div>} />
              <Route path="*" element={<Navigate to="" />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;