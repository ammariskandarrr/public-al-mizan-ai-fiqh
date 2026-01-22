import React from 'react';
import { Scale, CheckCircle2, ArrowRight, Bot, Mic, FileText, Sparkles } from 'lucide-react';
import { MOCK_PRICING_PLANS } from '../constants';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

      {/* Floating Dock Header */}
      <header className="fixed w-full z-50 top-6 pointer-events-none px-4 flex justify-center">
        <nav className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-slate-200/40 rounded-full p-2 pl-6 pr-2 flex items-center justify-between gap-6 md:gap-12 max-w-fit mx-auto transition-all duration-300">

          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2.5 group shrink-0 mr-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Scale size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight hidden sm:block">Al-Mizan</span>
          </a>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 rounded-full p-1.5 border border-slate-200/50">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-5 py-2 rounded-full text-sm font-semibold text-slate-900 bg-white shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 transition-all">
              Home
            </button>
            <button onClick={() => document.getElementById('innovation')?.scrollIntoView({ behavior: 'smooth' })} className="px-5 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all">
              Innovation
            </button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-5 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all">
              Feature
            </button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="px-5 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all">
              Pricing
            </button>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-slate-200">
            <button onClick={onLogin} className="text-slate-600 font-semibold hover:text-blue-600 transition-colors text-sm">Sign In</button>
            <button onClick={onGetStarted} className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap">
              Get Access
            </button>
          </div>

        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-hero-animated relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] rounded-full bg-indigo-400/20 blur-[120px]" />
        </div>

        <div className="py-4 px-4 mx-auto max-w-screen-xl text-center lg:py-12 relative z-10">
          <div className="inline-flex items-center justify-between px-1 py-1 pr-4 mb-7 text-sm text-black bg-blue-50 rounded-full hover:bg-blue-100 transition-colors border border-blue-200">
            <span className="text-xs bg-blue-600 rounded-full text-white px-4 py-1.5 mr-3 font-semibold shadow-sm">Updated</span>
            <span className="text-sm font-medium">Aligned with Latest BNM Regulation, IFSA and Fatwas</span>
            <ArrowRight size={14} className="ml-2" />
          </div>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tight leading-tight text-slate-900 md:text-7xl">
            The First <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">BNM Regulation & Fatwa-Encoded</span> <br />
            Governance Engine
          </h1>

          <p className="mb-6 text-lg font-normal text-slate-600 lg:text-xl sm:px-16 lg:px-48 max-w-4xl mx-auto leading-relaxed">
            Your AI-powered <span className="font-semibold text-slate-800">Sharia Governance Partner</span>. Trained on <span className="font-semibold text-blue-600">Bank Negara Malaysia</span> Policy Documents, <span className="font-semibold text-blue-600">Islamic Financial Services Act (IFSA)</span>, and authoritative <span className="font-semibold text-blue-600">Fatwa Decisions</span> from Mufti WP & Selangor.
          </p>

          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <button onClick={onGetStarted} className="inline-flex justify-center items-center py-4 px-8 text-base font-medium text-center text-white rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 focus:ring-4 focus:ring-blue-300 shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-1">
              Contact Us
              <Sparkles size={18} className="ml-2.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Active Regulatory Crawler Banner - Below Hero */}
      <section id="innovation" className="relative py-12 bg-slate-900">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-3 text-blue-400 font-bold mb-2 uppercase tracking-wider text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Always Synchronized
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Active Regulatory Crawler</h3>
              <p className="text-slate-400 text-lg max-w-2xl">
                Our backend constantly monitors the official <span className="text-white font-semibold">Bank Negara Malaysia</span> website.
                New announcements and regulations are instantly indexed, ensuring your AI assistant is never outdated.
              </p>
            </div>
            <div>
              <button onClick={onGetStarted} className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                See it in Action
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Core Intelligence</h2>
            <p className="mt-2 text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
              Sharia Compliance. <br />Automated.
            </p>
            <p className="mt-4 text-xl text-slate-500">
              Powered by our proprietary <span className="text-blue-600 font-semibold">Sharia Knowledge Repository Engine</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Chatbot */}
            <div className="group relative p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Bot size={120} className="text-indigo-600" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <Bot size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Sharia Finance Chatbot</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Not just a conversation. A <span className="font-semibold text-indigo-600">Multi-Agent Verification</span> system fueled by BNM & Mufti contexts. every response includes dynamic citations linking directly to the source texts.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Unmatched Accuracy</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Dynamic Citation Links</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Real-time Source Checking</li>
                </ul>
              </div>
            </div>

            {/* Feature 2: Analyzer */}
            <div className="group relative p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <FileText size={120} className="text-blue-600" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <FileText size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Document Analyzer</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Upload policies, contracts, or SOPs. Our AI pipelines cross-reference against the <span className="font-semibold text-blue-600">Islamic Financial Services Act</span> & Sharia Contract Framework to highlight risks.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Multi-View Checks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Clause Highlighting</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Actionable Reports</li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Consultant */}
            <div id="consultant" className="group relative p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Mic size={120} className="text-emerald-600" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <Mic size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Live Voice Consultant</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Speech-to-Speech pipeline moving beyond traditional chatbots. Experience lowest latency voice interactions powered by our intelligent dynamic content switcher.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Real-time Audio</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Context Memory</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Human-like Interaction</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Teaser / Enterprise CTA */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">Built for Financial Institutions</h2>
          <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
            Flexible engagement models designed for banks, fintechs, and advisory firms.
            From <span className="font-semibold text-slate-800">SaaS Subscriptions</span> to <span className="font-semibold text-slate-800">On-Premise Deployment</span>.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Enterprise Plan</h3>
              <p className="text-slate-500 text-sm mb-6">For large scale deployment</p>
              <div className="text-3xl font-bold text-slate-900 mb-2">Custom</div>
              <p className="text-slate-500 text-sm mb-6">Yearly Contracts</p>
              <button className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:border-slate-800 hover:text-slate-900 transition-all">Contact Sales</button>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Professional Suite</h3>
              <p className="text-slate-500 text-sm mb-6">Full Platform Access</p>
              <div className="text-3xl font-bold text-slate-900 mb-2">RM 50,000</div>
              <p className="text-slate-500 text-sm mb-6">/ year / seat</p>
              <button onClick={onGetStarted} className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all">Start Trial</button>
            </div>
          </div>
        </div>
      </section>

      {/* NeuraDyn Accolades Section */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 blend-overlay"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-blue-900/20 blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wide mb-6">
            <Sparkles size={12} />
            Award Winning Technology
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            <span className="text-slate-400 text-2xl md:text-3xl font-medium">Developed by</span>
            <span className="inline-flex items-center tracking-tighter text-4xl md:text-6xl font-['Inter']">
              <span className="text-white">Neura</span>
              <span className="text-blue-500">Dyn</span>
            </span>
          </h2>

          <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            A powerhouse AI startup recognized for pioneering Large Language Model advancements.
            Proud winners of the <span className="text-white font-semibold">Huawei Malaysia ICT AI Innovation Competition</span> (2025 & 2026)
            and publishers of cutting-edge research in Artificial Intelligence conferences.
          </p>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Just placeholders for logos/badges feel free to swap with real ones if available */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <span className="font-bold text-2xl">🏆</span>
              </div>
              <span className="text-xs font-medium tracking-wider">Huawei ICT 2025</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <span className="font-bold text-2xl">🥇</span>
              </div>
              <span className="text-xs font-medium tracking-wider">Huawei ICT 2026</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <FileText size={32} />
              </div>
              <span className="text-xs font-medium tracking-wider">Published Research</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Scale size={20} />
                </div>
                <span className="font-bold text-xl text-slate-900">Al-Mizan Intelligence</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-6">
                The premier Sharia-compliant governance engine for modern financial institutions.
                Integrating BNM regulations with cutting-edge AI verification.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Powered by</span>
                <span className="inline-flex items-center tracking-tighter text-lg font-['Inter'] font-semibold">
                  <span className="text-slate-900">Neura</span>
                  <span className="text-blue-600">Dyn</span>
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Intelligence Engine</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Digital Consultant</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Document Analysis</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal & Compliance</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Sharia Certification</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Security Standards</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} NeuraDyn Technology. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm font-medium text-slate-500">
              <span>Kuala Lumpur</span>
              <span className="text-slate-300">•</span>
              <span>Dubai</span>
              <span className="text-slate-300">•</span>
              <span>London</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;