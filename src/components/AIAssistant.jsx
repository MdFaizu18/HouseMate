import { useState } from 'react';
import { X, Sparkles, Send, Bot } from 'lucide-react';

const suggestions = [
  'Generate next month\'s schedule',
  'Find someone to swap duties',
  'Show lowest workload member',
  'Suggest fair task distribution',
];

const autoReplies = {
  "Generate next month's schedule": "I've analyzed everyone's patterns. Harri should handle Kitchen, Faizu gets Living Room, Bala takes Toilets, and Athreya covers Corridors for July. Want me to finalize this?",
  "Find someone to swap duties":    "Based on current workloads, Dhayanandh has the lightest schedule this week — he'd be a great swap candidate! Shall I send him a request?",
  "Show lowest workload member":    "Afzal has completed only 4 tasks this week — the lowest in the house. He might be available to take on extra duties.",
  "Suggest fair task distribution": "Currently Harri has 420 pts vs Afzal's 150. I suggest assigning Afzal 3 extra tasks next week to rebalance the workload.",
};

export default function AIAssistant() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);

  function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg = { role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      const reply = autoReplies[msg] || "I'm analyzing your house data... This is a demo response. In production, I'd connect to an AI backend!";
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setTyping(false);
    }, 900);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
        style={{ boxShadow: '0 0 25px rgba(99,102,241,0.4)' }}
      >
        <Sparkles size={22} />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-80 md:w-96 animate-slide-in">
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden shadow-2xl" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d45] bg-gradient-to-r from-indigo-500/10 to-emerald-500/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">HouseMate AI</p>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#8896b0] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <div className="py-2">
                  <p className="text-xs text-[#8896b0] mb-3 px-1">What would you like to do?</p>
                  <div className="space-y-2">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-[#1a2236] border border-[#1e2d45] text-[#8896b0] hover:text-white hover:border-indigo-500/30 transition-colors"
                      >
                        &bull; {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] text-xs px-3 py-2 rounded-xl ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-[#1a2236] border border-[#1e2d45] text-[#d0d9f0] rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-[#1a2236] border border-[#1e2d45] rounded-xl rounded-bl-none px-3 py-2 flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#8896b0] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-[#1e2d45]">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask HouseMate AI..."
                className="flex-1 bg-[#1a2236] border border-[#1e2d45] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 transition-colors placeholder:text-[#8896b0]"
              />
              <button
                onClick={() => sendMessage()}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
