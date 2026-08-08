import React from 'react';
import { 
  Rocket, Brain, Database, ShieldCheck, Cpu, Code2, Users, CheckCircle2, Globe, Sparkles 
} from 'lucide-react';

const AboutPage = () => {
  const teamMembers = [
    { name: 'Narendar Reddy', role: 'Full Stack & ML Architect' },
    { name: 'Manvitha', role: 'Frontend & UI/UX Engineer' },
    { name: 'Pravallika', role: 'Backend & Data Engineer' },
    { name: 'Ashwindh', role: 'Database & Security Engineer' },
  ];

  const faqs = [
    {
      q: 'What is PricePilot AI?',
      a: 'PricePilot AI is an enterprise dynamic pricing and demand forecasting platform trained on 112,650 e-commerce order transactions.',
    },
    {
      q: 'Which machine learning model powers predictions?',
      a: 'The Extra Trees Regressor model achieves an R² accuracy score of 0.6742, outperforming Random Forest and CatBoost models.',
    },
    {
      q: 'How is data stored and secured?',
      a: 'All accounts and audit logs are stored securely in PostgreSQL with Bcrypt password hashing and JWT authentication tokens.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[18px] bg-[#111827] p-8 border border-[#1F2937]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Infosys Springboard 7.0 Internship Project
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            About <span className="gradient-text">PricePilot AI</span>
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Enterprise Machine Learning Dynamic Pricing & Demand Forecasting System built with FastAPI, PostgreSQL, Extra Trees Regressor, and React.
          </p>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-3">
          <Brain className="w-8 h-8 text-purple-400" />
          <h3 className="text-base font-bold text-white">Machine Learning</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extra Trees Regressor model trained on 112,650 e-commerce transactions evaluating weight, volume, freight, and date features.
          </p>
        </div>

        <div className="p-6 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-3">
          <Database className="w-8 h-8 text-blue-400" />
          <h3 className="text-base font-bold text-white">PostgreSQL & FastAPI</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            PostgreSQL relational database paired with high-performance FastAPI async REST endpoints and connection pooling.
          </p>
        </div>

        <div className="p-6 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <h3 className="text-base font-bold text-white">JWT Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Role-Based Access Control (Admin vs User), Bcrypt password hashing (rounds = 12), and Helmet security middleware.
          </p>
        </div>
      </div>

      {/* Team Attribution */}
      <div className="rounded-[18px] bg-[#111827] p-6 lg:p-8 border border-[#1F2937] space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-white border-b border-[#1F2937] pb-3">
          <Users className="w-5 h-5 text-purple-400" /> Infosys Springboard 7.0 Project Team
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {teamMembers.map((m, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm mx-auto mb-2 border border-purple-500/20">
                0{idx + 1}
              </div>
              <p className="text-xs font-bold text-white">{m.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{m.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-[18px] bg-[#111827] p-6 lg:p-8 border border-[#1F2937] space-y-4">
        <h3 className="text-base font-bold text-white border-b border-[#1F2937] pb-3">
          Frequently Asked Questions
        </h3>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/40 border border-[#1F2937] space-y-1.5">
              <p className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> {faq.q}
              </p>
              <p className="text-xs text-slate-300 pl-6 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
