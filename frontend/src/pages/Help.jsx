import React, { useState } from 'react';
import { HelpCircle, Mail, BookOpen, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

const Help = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      q: "How does Google Gemini explain prices?",
      a: "When a price prediction completes, the backend routes the predicted value, R² validation parameters, and model configuration to Google Gemini, which synthesizes a natural language business strategy explanation."
    },
    {
      q: "What is Database-less Demo Mode?",
      a: "If the local PostgreSQL database is offline or unconfigured during system boot, the backend automatically fails over to a local SQLite database (`pricepilot_demo.db`) and populates it with mock records so evaluators can run the console instantly."
    },
    {
      q: "How is Role-Based Access Control enforced?",
      a: "Endpoints are wrapped in FastAPI authorization guards. For example, list_users requires Admin or Manager claims, while user profile updates require root Admin privileges."
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-12 select-none text-white">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-outfit uppercase">Help Center & Support</h1>
        <p className="desc-text mt-1 text-xs">Get started with PricePilot AI, view documentation guides, and browse FAQs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Getting Started & FAQs */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Quick Start Guide */}
          <div className="glass-card p-6 space-y-3.5 rounded-[24px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest block font-outfit border-b border-white/[0.06] pb-2.5 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-[#da4e24]" /> Quick Start Workflow
            </h3>
            <ol className="list-decimal list-inside text-xs text-[#B8BCC8]/85 space-y-3 font-semibold leading-relaxed">
              <li>Navigate to the **Price Predictor** tool in the sidebar console.</li>
              <li>Select a product category and enter shipping specs (freight cost, weight, height).</li>
              <li>Choose a model solver (e.g. *XGBoost Regressor*) or click *Best* to auto-select champion weights.</li>
              <li>Click **Generate Optimal Price** to launch predictions and retrieve Gemini business explanations.</li>
            </ol>
          </div>

          {/* FAQs Interactive Accordion */}
          <div className="glass-card p-6 space-y-4 rounded-[24px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest block font-outfit border-b border-white/[0.06] pb-2.5 flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-[#0098f3]" /> Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.01]">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between text-xs font-bold text-white text-left font-outfit focus:outline-none hover:bg-white/[0.02] transition-all"
                    >
                      <span>Q: {faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#da4e24]" /> : <ChevronDown className="w-4 h-4 text-[#B8BCC8]/40" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white/[0.02] border-t border-white/[0.04] text-[11px] text-[#B8BCC8]/75 leading-relaxed font-semibold font-outfit animate-fadeIn">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Troubleshooting & Contact */}
        <div className="md:col-span-4 space-y-6 flex flex-col">
          
          {/* Troubleshooting */}
          <div className="glass-card p-6 space-y-3.5 flex-1 rounded-[24px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest block font-outfit border-b border-white/[0.06] pb-2.5 flex items-center gap-2">
              <Wrench className="w-4.5 h-4.5 text-[#2ED47A]" /> Troubleshooting
            </h3>
            <div className="space-y-4 text-[11px] leading-relaxed text-[#B8BCC8]/85 font-semibold font-outfit">
              <div>
                <span className="text-[9px] text-[#FF5D73] block uppercase tracking-wider font-extrabold mb-1">Rate Limiter 429</span>
                <span>The platform blocks IP requests exceeding 120 calls/min. Wait 60 seconds to resume.</span>
              </div>
              <div>
                <span className="text-[9px] text-[#0098f3] block uppercase tracking-wider font-extrabold mb-1">Gemini Offline</span>
                <span>If API keys are missing, the backend triggers pre-saved mock responses automatically.</span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="glass-card p-6 space-y-3 rounded-[24px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest block font-outfit border-b border-white/[0.06] pb-2.5 flex items-center gap-2">
              <Mail className="w-4.5 h-4.5 text-[#da4e24]" /> Support Contact
            </h3>
            <div className="text-[11px] leading-relaxed text-[#B8BCC8]/85 font-semibold font-outfit space-y-2">
              <p>For support queries and enterprise evaluation access:</p>
              <div className="pt-2">
                <span className="text-[9px] text-[#B8BCC8]/40 block uppercase tracking-wider font-extrabold">Corporate Email</span>
                <span className="text-[#da4e24] font-bold">support@pricepilot.ai</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Help;
