import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { ChevronLeft, ChevronRight, LogOut, Scale, MessageSquare, SquarePen } from 'lucide-react';
import { User, AppRoute } from '../types';
import clsx from 'clsx';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  user: User | null;
  onLogout: () => void;
}

const RECENT_CHATS = [
  "Islamic Home Financing",
  "Crypto Spot Trading Ruling",
  "Zakat on Stocks Calculation",
  "Murabaha vs Ijara",
  "Gold Investment Rules",
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse, user, onLogout }) => {
  const location = useLocation();

  return (
    <aside
      className={clsx(
        "bg-white border-r border-slate-200/60 h-screen fixed left-0 top-0 z-30 transition-all duration-300 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        <div className={clsx("flex items-center gap-3 overflow-hidden transition-all duration-300", isCollapsed && "justify-center w-full")}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
            <Scale size={20} className="stroke-[2.5]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 leading-tight">Al Mizan</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Fiqh Intelligence</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button onClick={toggleCollapse} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button onClick={toggleCollapse} className="mx-auto mt-6 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors shrink-0 shadow-sm border border-slate-200/50">
          <ChevronRight size={18} />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto hover:overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <React.Fragment key={item.route}>
            <NavLink
              to={item.route}
              end={item.route === AppRoute.DASHBOARD}
              className={({ isActive }) => clsx(
                "flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-blue-50/80 text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              )}
            >
              <item.icon size={22} className={clsx("shrink-0 transition-colors", ({ isActive }: { isActive: boolean }) => isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />

              {!isCollapsed && <span>{item.label}</span>}

              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 origin-left z-50 whitespace-nowrap shadow-xl">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </NavLink>

            {/* Recent Chats Submenu - Only show for Chat route */}
            {item.route === AppRoute.CHAT && !isCollapsed && (
              <div className="relative pl-4 ml-3.5 border-l-2 border-slate-100 my-3 animate-fade-in-down">

                {/* New Chat Button */}
                <NavLink
                  to={AppRoute.CHAT}
                  end
                  className="flex items-center gap-2 px-3 py-2 mb-4 text-sm font-medium text-slate-700 hover:bg-slate-100/80 hover:text-blue-600 rounded-lg transition-all group"
                >
                  <SquarePen size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  <span>New chat</span>
                </NavLink>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <MessageSquare size={12} />
                    <span>Recent</span>
                  </div>
                  {RECENT_CHATS.map((chat, idx) => {
                    const isActiveChat = location.search === `?id=${idx}`;
                    return (
                      <NavLink
                        key={idx}
                        to={`${AppRoute.CHAT}?id=${idx}`}
                        className={clsx(
                          "block text-sm truncate py-2 px-3 rounded-lg transition-all w-full text-left relative overflow-hidden",
                          isActiveChat
                            ? "bg-white text-blue-700 font-medium shadow-sm ring-1 ring-slate-100/50"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/80"
                        )}
                      >
                        {chat}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-5 border-t border-slate-100 shrink-0 bg-slate-50/50">
        <div className={clsx("flex items-center gap-3.5", isCollapsed ? "justify-center" : "")}>
          <div className="relative shrink-0">
            <img src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff"} alt="Profile" className="w-10 h-10 rounded-full bg-slate-200 object-cover border-2 border-white shadow-sm" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          {!isCollapsed && (
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || "user@example.com"}</p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group relative"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;