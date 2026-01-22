import React from 'react';
import { CreditCard, Check, Building2, User, History, Zap, ShieldCheck, Download, Plus, Star } from 'lucide-react';

const CreditPage: React.FC = () => {
  // Mock data
  const balance = 2; // 2 document credits
  const transactions = [
    { id: '1', date: 'Oct 15, 2023', desc: 'Credit Top-up: Standard Pack (5)', amount: '+ RM 1,000.00', status: 'Completed', invoice: '#' },
    { id: '2', date: 'Oct 16, 2023', desc: 'Analysis: "Lease_Agreement_v1.pdf"', amount: '- 1 Credit', status: 'Used', invoice: '#' },
    { id: '3', date: 'Oct 20, 2023', desc: 'Analysis: "Home_Finance_Final.pdf"', amount: '- 1 Credit', status: 'Used', invoice: '#' },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Hero / Balance Section */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-white/10 text-emerald-100 uppercase tracking-wide">
              <Star size={12} className="text-yellow-400" fill="currentColor" />
              <span>Current Plan: Individual User</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Credits & Billing</h1>
            <p className="text-emerald-100/80 text-lg max-w-lg leading-relaxed">
              Seamlessly manage your analysis credits. Purchase on-demand or upgrade for enterprise volume discounts.
            </p>
          </div>

          {/* Balance Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl min-w-[280px] text-center relative overflow-hidden group/card hover:bg-white/15 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCard size={100} />
            </div>
            <p className="text-sm font-medium text-emerald-200 mb-2 uppercase tracking-widest">Available Balance</p>
            <div className="text-6xl font-black mb-2 tracking-tighter shadow-black drop-shadow-lg">{balance}</div>
            <p className="text-sm font-medium text-white/90">Document Credits</p>
            <button className="mt-6 w-full py-3 bg-white text-teal-900 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg flex items-center justify-center gap-2">
              <Plus size={18} strokeWidth={3} /> Top Up Now
            </button>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute top-[-50%] left-[-20%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-50%] right-[-20%] w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Pay-Per-Use Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -mr-8 -mt-8 z-0 group-hover:bg-blue-50 transition-colors"></div>

          <div className="relative z-10 flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Standard Pack</h2>
              <p className="text-slate-500 text-sm">For individuals & freelancers</p>
            </div>
          </div>

          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">RM 200</span>
              <span className="text-slate-500 font-medium">/ credit</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">1 Credit = 1 Document Analysis Report</p>
          </div>

          <ul className="space-y-4 mb-8">
            {['Full Sharia Compliance Audit (PDF)', 'Clause-by-Clause Explanations', 'Riba & Gharar Detection', 'Email Support'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                {feat}
              </li>
            ))}
          </ul>

          <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
            Purchase Credits
          </button>
        </div>

        {/* Enterprise Card */}
        <div className="bg-[#0B1120] text-white rounded-[2rem] p-8 shadow-2xl hover:shadow-Blue-900/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative z-10 flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Enterprise</h2>
              <p className="text-slate-400 text-sm">For banks & institutions</p>
            </div>
          </div>

          <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">Custom Pricing</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Tailored volume packages & API access</p>
          </div>

          <ul className="space-y-4 mb-8">
            {['Advanced API Integration', 'Dedicated Account Manager', 'Custom Compliance Rule Sets', 'On-Premise Deployment', 'SLA & Priority Support'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                {feat}
              </li>
            ))}
          </ul>

          <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
            <Zap size={20} className="fill-white" /> Contact Sales Team
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-500">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Billing History</h3>
              <p className="text-xs text-slate-500">View recent transactions and invoices</p>
            </div>
          </div>
          <button className="text-blue-600 text-sm font-bold hover:underline">Download All CSV</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 font-bold uppercase text-xs tracking-wider">Date</th>
                <th className="px-8 py-4 font-bold uppercase text-xs tracking-wider">Description</th>
                <th className="px-8 py-4 font-bold uppercase text-xs tracking-wider">Amount</th>
                <th className="px-8 py-4 font-bold uppercase text-xs tracking-wider">Status</th>
                <th className="px-8 py-4 font-bold uppercase text-xs tracking-wider text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 text-slate-600 whitespace-nowrap font-medium">{t.date}</td>
                  <td className="px-8 py-5 text-slate-800 font-bold">{t.desc}</td>
                  <td className={`px-8 py-5 font-bold ${t.amount.includes('+') ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {t.amount}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors">
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditPage;