import React from 'react';
import { User } from '../types';
import { ArrowRight, FileText, MessageSquare, TrendingUp, Mic, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface DashboardHomeProps {
  user: User | null;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 rounded-[2rem] p-8 sm:p-10 text-white shadow-2xl shadow-blue-900/20 overflow-hidden group">
        <div className="relative z-10 flex flex-col items-start gap-4">
          {/* Chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold uppercase tracking-wider text-blue-100">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            System Operational
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">Salam, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
            <p className="text-blue-100 text-lg max-w-xl leading-relaxed opacity-90">
              Your <strong className="text-white">Sharia Intelligence Suite</strong> is ready. You have 2 pending document analyses and new regulatory insights available.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <NavLink to="/dashboard/documents" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10">
              Check Analyses <ArrowRight size={18} />
            </NavLink>
            <button className="px-6 py-3 rounded-xl font-medium text-white border border-white/20 hover:bg-white/10 transition-colors">
              View Activity Log
            </button>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12 group-hover:scale-110 transition-transform duration-700 ease-in-out">
          <TrendingUp size={280} />
        </div>
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: Sharia Finance Chatbot */}
        <NavLink to="/dashboard/chat" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <MessageSquare size={100} />
          </div>
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
            <MessageSquare size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">Shariah Finance Chatbot</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">Multi-agent intelligence trained on BNM & Mufti context. Every response is cited and verified.</p>
          <div className="flex items-center text-sm font-semibold text-purple-600 group-hover:gap-2 transition-all">
            Start Consultation <ArrowRight size={16} className="ml-1" />
          </div>
        </NavLink>

        {/* Card 2: Sharia Document Analyzer */}
        <NavLink to="/dashboard/documents" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText size={100} />
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
            <FileText size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">Shariah Document Analyzer</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">Upload contracts/SOPs. Our AI Agents review against Islamic Financial Acts & BNM Policy.</p>
          <div className="flex items-center text-sm font-semibold text-emerald-600 group-hover:gap-2 transition-all">
            Analyze Document <ArrowRight size={16} className="ml-1" />
          </div>
        </NavLink>

        {/* Card 3: AI Live Sharia Consulting */}
        <NavLink to="/dashboard/consultant" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Mic size={100} />
          </div>
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
            <Mic size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition-colors">AI Live Sharia Consulting</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">Real-time speech-to-speech consultation power by dynamic knowledge retrieval.</p>
          <div className="flex items-center text-sm font-semibold text-amber-600 group-hover:gap-2 transition-all">
            Connect Live <ArrowRight size={16} className="ml-1" />
          </div>
        </NavLink>
      </div>

      {/* Recent Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
            <button className="text-slate-400 hover:text-blue-600 transition-colors">
              <ArrowUpRight size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Analyzed "Lease_Agreement_v2.pdf"', type: 'doc', status: 'Compliant', time: '2h ago', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { title: 'Voice Session: "Zakat on Gold"', type: 'voice', time: 'Yesterday', icon: Mic, color: 'text-amber-600', bg: 'bg-amber-50' },
              { title: 'Chat: "Crypto Staking Halal?"', type: 'chat', time: '2 days ago', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100">
                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base truncate group-hover:text-blue-700 transition-colors">{item.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Clock size={12} />
                    <span>{item.time}</span>
                  </div>
                </div>
                {item.status && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold whitespace-nowrap hidden sm:block">
                    {item.status}
                  </span>
                )}
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Stats / Promotion */}
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Enterprise Plan</h3>
            <p className="text-slate-400 text-sm mb-6">Unlimited document analysis, high-priority processing, and dedicated account support.</p>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-blue-500 w-3/4 h-full rounded-full"></div>
            </div>
            <p className="text-xs text-slate-500 mb-6">You've used 75% of your Enterprise quota.</p>

            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/50">
              Manage Subscription
            </button>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600 rounded-full blur-[60px] opacity-20 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;