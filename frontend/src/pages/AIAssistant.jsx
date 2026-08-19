import { useState } from "react";
import api from "../services/api";
import { Bot, Send, User, Sparkles, Loader } from "lucide-react";

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([
    {
      sender: "ai",
      text: "👋 Hello! I'm your PricePilot AI Assistant. Ask me questions about your dataset, and I will analyze the metrics in real time.",
    },
  ]);

  const suggestions = [
    "What is the highest revenue product?",
    "Which product has the lowest stock?",
    "What is the total revenue?",
    "What is the average price?",
    "Which product recorded the highest sales?",
  ];

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === "string" ? textToSend : message;
    if (!query.trim()) return;

    const userMessage = {
      sender: "user",
      text: query,
    };

    setChat((prev) => [...prev, userMessage]);
    if (typeof textToSend !== "string") {
      setMessage("");
    }

    setLoading(true);
    try {
      const res = await api.post("/assistant", { question: query });
      if (res.data && res.data.answer) {
        setChat((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.data.answer,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setChat((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Please upload a dataset first. I need dataset records loaded to analyze metrics.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Bot className="text-blue-600" size={36} />
            AI Assistant Chat
          </h1>
          <p className="text-slate-500 text-lg mt-2">
            Ask specific business questions regarding revenues, product stock, and sales.
          </p>
        </div>
        <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-md">
          <Sparkles size={20} className="animate-pulse" />
          AI Powered
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Chat Interface */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-slate-100 h-[600px] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chat.map((item, index) => (
              <div
                key={index}
                className={`flex ${
                  item.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-lg rounded-2xl px-5 py-4 flex gap-3 shadow-sm ${
                    item.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-50 border border-slate-100 text-slate-800"
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">
                    {item.sender === "user" ? (
                      <User size={18} />
                    ) : (
                      <Bot size={18} className="text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-3 text-slate-500 shadow-sm">
                  <Loader size={18} className="animate-spin text-blue-600" />
                  <span className="text-sm font-medium">PricePilot is thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-5 flex gap-4 bg-slate-50/50">
            <input
              type="text"
              disabled={loading}
              placeholder="Ask me: 'What is the highest revenue product?'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSend();
                }
              }}
              className="flex-1 border border-slate-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white bg-white transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl flex items-center justify-center shadow-md hover:shadow-blue-200 transition disabled:bg-blue-400"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Right Column - Suggestion Prompts */}
        <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6 h-fit">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Suggested Questions</h2>
            <p className="text-slate-400 text-xs mt-1">Click a query template to send it directly to the model.</p>
          </div>
          <div className="flex flex-col gap-3">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(item)}
                className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-semibold transition text-slate-700 cursor-pointer disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}