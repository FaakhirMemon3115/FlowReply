import React, { useState, useEffect, useRef } from "react";
import "./App.css";

interface Message {
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "inbox" | "settings">("dashboard");
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+1 555-0199");
  const [messages, setMessages] = useState<Message[]>([
    { sender: "system", text: "WhatsApp Sandbox session started.", timestamp: "10:00 AM" },
    { sender: "ai", text: "Hello! Thank you for contacting FlowReply Store. How can I help you today?", timestamp: "10:01 AM" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [metrics, setMetrics] = useState({
    automatedChats: 24,
    activeLeads: 12,
    responseTime: "< 2s",
    apiStatus: "Healthy"
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleConnectWhatsApp = () => {
    setIsWhatsAppConnected(!isWhatsAppConnected);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    setMessages(prev => [...prev, { sender: "user", text: userMsg, timestamp }]);
    setInputText("");
    setIsTyping(true);

    // Increment automated chats metric
    setMetrics(prev => ({ ...prev, automatedChats: prev.automatedChats + 1 }));

    // Simulate AI WhatsApp reply from CRM
    setTimeout(() => {
      let reply = "I am processing your query. Please hold on a moment.";
      const lowerMsg = userMsg.toLowerCase();

      if (lowerMsg.includes("order") || lowerMsg.includes("status")) {
        reply = "📦 *Order #FR-8890 Status Update:*\nYour package has been shipped via DHL and is currently in transit. Expected delivery: *Monday, Aug 24*.";
      } else if (lowerMsg.includes("product") || lowerMsg.includes("buy") || lowerMsg.includes("price")) {
        reply = "🛍️ *Recommended Products for you:*\n1. Premium Wireless Earbuds - $49.99\n2. Smart Fitness Watch - $79.99\n\nWould you like me to generate a checkout link?";
      } else if (lowerMsg.includes("human") || lowerMsg.includes("agent") || lowerMsg.includes("support")) {
        reply = "🧑‍💻 I am transferring your chat to a human agent. They will join this chat in a few moments.";
      } else if (lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("hey")) {
        reply = "👋 Hi there! I'm the FlowReply AI Agent. I can help you check orders, find products, or connect you to support. What can I do for you?";
      } else {
        reply = "🤖 *FlowReply AI:* Thanks for your message! Our AI automated system has logged this in your Ecommerce CRM dashboard.";
      }

      setMessages(prev => [...prev, { sender: "ai", text: reply, timestamp }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">FlowReply</h1>
              <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">WhatsApp CRM</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab("inbox")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === "inbox"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4m16 0l-8 5-8-5" />
                </svg>
                Shared Inbox
              </div>
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-bold">New</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === "settings"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-purple-400">
            FR
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Demo Store</h4>
            <p className="text-xs text-slate-500">owner@flowreply.com</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {activeTab === "dashboard" && "Dashboard Overview"}
            {activeTab === "inbox" && "FlowReply Sandbox Chat Inbox"}
            {activeTab === "settings" && "Integration Settings"}
          </h2>

          {/* Quick status bar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Backend Live
            </div>
          </div>
        </header>

        {/* Dynamic Pages */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8">

          {activeTab === "dashboard" && (
            <>
              {/* Core metrics */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { title: "Automated Conversations", val: metrics.automatedChats, icon: "💬", desc: "Chats replied by AI bot" },
                  { title: "Active Leads", val: metrics.activeLeads, icon: "🎯", desc: "From WhatsApp messages" },
                  { title: "Average AI Response Time", val: metrics.responseTime, icon: "⚡", desc: "Instant CRM lookup" },
                  { title: "Platform API Health", val: metrics.apiStatus, icon: "🛡️", desc: "Meta Sandbox status" }
                ].map((item, index) => (
                  <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
                    <span className="text-2xl mb-4 block">{item.icon}</span>
                    <h3 className="text-slate-400 text-sm font-semibold mb-1">{item.title}</h3>
                    <p className="text-3xl font-extrabold text-white tracking-tight">{item.val}</p>
                    <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Middle Section: Connect Box & Sandbox Simulator */}
              <div className="grid grid-cols-3 gap-8">
                
                {/* Column 1: WhatsApp Connect Console */}
                <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Connect WhatsApp</h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                      Connect FlowReply to your official Meta WhatsApp Business Cloud API.
                    </p>

                    <div className="space-y-4">
                      {isWhatsAppConnected ? (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Number Connected</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                          </div>
                          <p className="font-mono text-slate-300 text-sm">{phoneNumber}</p>
                        </div>
                      ) : (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center py-6 text-center border-dashed">
                          <span className="text-3xl mb-2">📲</span>
                          <p className="text-sm font-semibold text-slate-300">No Number Connected</p>
                          <p className="text-xs text-slate-500 mt-1">Connect your sandbox number to send automated replies</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleConnectWhatsApp}
                    className={`w-full mt-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isWhatsAppConnected
                        ? "bg-slate-800 text-red-400 border border-red-500/20 hover:bg-red-500/10"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10"
                    }`}
                  >
                    {isWhatsAppConnected ? (
                      <>Disconnect Number</>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.59 1.977 14.113.953 11.997.953 6.562.953 2.138 5.322 2.134 10.75c-.001 1.705.452 3.37 1.312 4.848l-.996 3.636 3.737-.98c1.517.828 3.056 1.258 4.792 1.258h.001z" />
                        </svg>
                        Connect WhatsApp Sandbox
                      </>
                    )}
                  </button>
                </div>

                {/* Column 2 & 3: Interactive WhatsApp Chat Simulator */}
                <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[500px]">
                  {/* Chat Box Header */}
                  <div className="bg-slate-950/60 px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <span className="text-xl">💬</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm">FlowReply Sandbox Simulator</h4>
                        <p className="text-xs text-slate-400">Test automation scenarios in real-time</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">Sandbox Active</span>
                  </div>

                  {/* Message History Area */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/40">
                    {messages.map((msg, i) => {
                      if (msg.sender === "system") {
                        return (
                          <div key={i} className="text-center">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full uppercase">
                              {msg.text}
                            </span>
                          </div>
                        );
                      }

                      const isUser = msg.sender === "user";
                      return (
                        <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                            isUser
                              ? "bg-purple-600 text-white rounded-tr-none"
                              : "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none"
                          }`}>
                            <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                            <span className={`text-[10px] block mt-1 text-right ${isUser ? "text-purple-200" : "text-slate-500"}`}>
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></span>
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-3">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a test message (e.g. 'Status of order FR-8890', 'Hello')..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl shadow-lg shadow-purple-600/10 transition-colors"
                    >
                      <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>

                </div>

              </div>
            </>
          )}

          {activeTab === "inbox" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto py-16">
              <span className="text-5xl block mb-4">📬</span>
              <h3 className="text-xl font-bold text-white mb-2">FlowReply Shared Inbox</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Manage all automated customer chats, assign threads to human support agents, and monitor sales pipelines from a single dashboard.
              </p>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl transition-all"
              >
                Back to Sandbox Simulation
              </button>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-4">Integration Settings</h3>
              
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-6">
                  <h4 className="font-semibold text-slate-300 mb-2">Backend Connection</h4>
                  <p className="text-xs text-slate-500 mb-4">Target backend instance for SaaS operations.</p>
                  <input
                    type="text"
                    disabled
                    value="http://localhost:4000/api/v1"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-xl px-4 py-3 text-sm font-mono"
                  />
                </div>

                <div className="border-b border-slate-800 pb-6">
                  <h4 className="font-semibold text-slate-300 mb-2">WhatsApp Sandbox Webhook</h4>
                  <p className="text-xs text-slate-500 mb-4">Use this URL in your Meta Developer portal to receive incoming WhatsApp messages.</p>
                  <input
                    type="text"
                    disabled
                    value="http://localhost:4000/api/v1/whatsapp/webhook"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-xl px-4 py-3 text-sm font-mono"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-slate-300 mb-2">Ecommerce Sync</h4>
                  <p className="text-xs text-slate-500 mb-4">Sync orders, catalog and shipping details from Shopify / WooCommerce.</p>
                  <div className="flex gap-4">
                    <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-bold uppercase border border-purple-500/20">Mock Store Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
