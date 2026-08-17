import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Copy, Trash2, RotateCcw } from 'lucide-react';
import { chat as chatWithAi } from '../services/aiService';
import { useSystem } from '../context/SystemContext';

const AIChatBot = ({ dashboardStats, metrics }) => {
  const { showToast } = useSystem();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Welcome to PricePilot Copilot. I'm your enterprise pricing analyst. Ask me about prediction rationale, pricing recommendations, ML algorithms comparison, or demand forecast reviews."
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef(null);

  const bestModel = dashboardStats?.best_model || 'Extra Trees';
  const bestR2 = dashboardStats?.r2_score ? dashboardStats.r2_score.toFixed(5) : '0.81098';
  const bestMAE = dashboardStats?.mae ? `₹${dashboardStats.mae.toFixed(2)}` : '₹15.45';

  const capabilities = [
    { 
      q: "Explain dynamic predictions", 
      a: "Our predictions simulate pricing curves based on product physical parameters (weight, dimensions), logistical costs (freight), categories, and visibility characteristics (photos count, descriptions). Models weigh these relative to the historical Olist dataset to forecast optimal sales tags." 
    },
    { 
      q: "Compare machine learning models", 
      a: `Our platform benchmarks 8 models. Linear Regression provides baseline performance (R² ~ 0.25). Tree-based ensembles (Random Forest, Extra Trees) yield superior R² scores (>0.78). Our champion is currently "${bestModel}" showing an active R² of ${bestR2} and average absolute drift of ${bestMAE}.` 
    },
    { 
      q: "Explain feature importance", 
      a: "Volumetric features (length × height × width) and logistics overhead (freight) contribute over 65% of pricing variation. Product mass (weight) and category baseline mapping explain another 20%, while photo listings and content copy provide granular adjustments (15%)." 
    },
    { 
      q: "Recommend a pricing strategy", 
      a: "For high-demand items, apply value-based pricing at the 75th percentile of predicted bounds. For low-popularity items, apply logistics-plus margin pricing to prevent cash drain from high freight value inputs." 
    }
  ];

  const handleSend = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    // Format chat history for Gemini API
    const history = messages
      .filter(m => !m.isError)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

    try {
      const reply = await chatWithAi(text, history);
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "System Error: Failed to contact the AI Copilot backend service. Please check your connection and retry.", 
        isError: true,
        failedQuery: text 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (failedQuery) => {
    // Remove the error message from history
    setMessages(prev => prev.filter(m => !m.isError));
    handleSend(failedQuery);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Response copied to clipboard.');
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this conversation history?")) {
      setMessages([
        {
          sender: 'bot',
          text: "Welcome to PricePilot Copilot. I'm your enterprise pricing analyst. Ask me about prediction rationale, pricing recommendations, ML algorithms comparison, or demand forecast reviews."
        }
      ]);
      showToast('info', 'Chat history cleared.');
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-gradient-to-tr from-[#da4e24] to-[#0098f3] text-white shadow-[0_4px_16px_rgba(124,92,255,0.4)] border border-white/10 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer animate-bounce"
          title="Open AI Pricing Copilot"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-[380px] h-[520px] rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/95 backdrop-blur-[35px] shadow-2xl flex flex-col justify-between overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="px-4 py-3 bg-white/[0.01] border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-[#da4e24]/15 text-[#da4e24] border border-[#da4e24]/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-outfit tracking-wide">Pricing Copilot</h4>
                <span className="block text-[8px] text-[#B8BCC8]/60 font-bold tracking-widest uppercase">AI Revenue Analyst</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#B8BCC8]/60 hover:text-white transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#B8BCC8]/60 hover:text-white transition-colors cursor-pointer"
                title="Close chat panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[90%] group ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`p-1.5 rounded-full shrink-0 flex items-center justify-center h-7 w-7 border ${
                  msg.sender === 'user' 
                    ? 'bg-[#da4e24]/10 text-[#da4e24] border-[#da4e24]/20' 
                    : 'bg-white/[0.04] text-[#B8BCC8] border-white/[0.08]'
                }`}>
                  {msg.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                
                <div className="space-y-1 max-w-[80%]">
                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed relative ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-tr from-[#da4e24] to-[#0098f3] text-white rounded-tr-none shadow-md'
                      : msg.isError 
                        ? 'bg-[#FF5D73]/10 border border-[#FF5D73]/20 text-[#FF5D73] rounded-tl-none'
                        : 'bg-white/[0.03] text-[#FFFFFF] rounded-tl-none border border-white/[0.08]'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Message Action Bar (Copy & Retry) */}
                  <div className={`flex items-center gap-2 text-[8px] text-[#B8BCC8]/40 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && !msg.isError && (
                      <button 
                        onClick={() => handleCopy(msg.text)}
                        className="hover:text-white flex items-center gap-1 transition-colors py-0.5 px-1 bg-white/[0.02] border border-white/[0.04] rounded"
                      >
                        <Copy className="w-2 h-2" /> Copy Response
                      </button>
                    )}
                    {msg.isError && (
                      <button 
                        onClick={() => handleRetry(msg.failedQuery)}
                        className="hover:text-white text-[#FF5D73] flex items-center gap-1 transition-colors py-0.5 px-1 bg-[#FF5D73]/10 border border-[#FF5D73]/20 rounded font-bold"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Retry Request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator state */}
            {loading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="p-1.5 rounded-full shrink-0 flex items-center justify-center h-7 w-7 border bg-white/[0.04] text-[#B8BCC8] border-white/[0.08]">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="p-3 bg-white/[0.03] rounded-2xl rounded-tl-none border border-white/[0.08] flex items-center gap-1.5 py-3 px-4 shrink-0">
                  <span className="w-1.5 h-1.5 bg-[#da4e24] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#da4e24] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#da4e24] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Preset capabilities prompts */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.01] flex gap-2 overflow-x-auto shrink-0 scrollbar-none py-2.5">
            {capabilities.map((c, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(c.q)}
                className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.06] text-[9px] font-semibold text-[#B8BCC8] hover:text-white transition-all shrink-0 cursor-pointer"
              >
                {c.q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white/[0.01] border-t border-white/[0.06] flex items-center gap-2">
            <input
              type="text"
              placeholder={loading ? "Copilot is analyzing..." : "Ask Copilot a question..."}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[11px] text-white placeholder-[#B8BCC8]/40 focus:outline-none focus:border-[#da4e24] focus:bg-white/[0.06] transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(inputVal)}
              disabled={loading || !inputVal.trim()}
              className="p-2 rounded-xl bg-gradient-to-tr from-[#da4e24] to-[#0098f3] hover:opacity-90 text-white transition-all duration-300 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatBot;
