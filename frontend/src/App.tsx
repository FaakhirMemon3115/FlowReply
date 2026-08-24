import React, { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "http://localhost:4000/api/v1";

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  type: string;
  content: string | null;
  transcription: string | null;
  senderType: "customer" | "bot" | "agent";
  language: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerPhone: string;
  customerName: string | null;
  status: string;
  language: string | null;
  updatedAt: string;
  messages: Message[];
}

const LANG_BADGE: Record<string, string> = {
  en: "🇬🇧 EN",
  roman_urdu: "🇵🇰 Roman",
  ur: "🇵🇰 اردو"
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "inbox" | "settings">("dashboard");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── API calls ──
  const fetchHealth = async () => {
    try {
      const r = await fetch(`${API_BASE.replace("/api/v1", "")}/health`);
      const data = await r.json();
      setHealthStatus(data);
    } catch {
      setHealthStatus(null);
    }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/whatsapp/conversations`);
      const data = await r.json();
      setConversations(data.conversations || []);
    } catch (err) {
      // backend might not be running
    }
  }, []);

  const fetchConversationMessages = async (id: string) => {
    try {
      const r = await fetch(`${API_BASE}/whatsapp/conversations/${id}`);
      const data = await r.json();
      setSelectedConvo(data.conversation);
    } catch { }
  };

  // ── Poll for real-time updates ──
  useEffect(() => {
    fetchHealth();
    fetchConversations();

    pollIntervalRef.current = setInterval(() => {
      fetchConversations();
      if (selectedConvo) fetchConversationMessages(selectedConvo.id);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchConversations]);

  // ── Auto scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConvo?.messages]);

  // ── Send simulated message ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const r = await fetch(`${API_BASE}/whatsapp/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputText.trim(),
          phone: "+923001234567",
          type: "text"
        })
      });

      if (!r.ok) throw new Error("Failed to send message");

      setInputText("");

      // Refresh conversations after a short delay for AI to respond
      setTimeout(() => {
        fetchConversations();
        if (selectedConvo) fetchConversationMessages(selectedConvo.id);
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Could not send message. Is the backend running?");
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectConvo = async (convo: Conversation) => {
    setActiveTab("inbox");
    await fetchConversationMessages(convo.id);
  };

  const activeConversations = conversations.filter(c => c.status === "open");
  const totalMessages = conversations.reduce((acc, c) => acc + c.messages.length, 0);
  const botMessages = conversations.reduce(
    (acc, c) => acc + c.messages.filter(m => m.senderType === "bot").length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">

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
              <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">WhatsApp AI CRM</span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />, badge: null },
              { id: "inbox", label: "Inbox", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4m16 0l-8 5-8-5" />, badge: activeConversations.length || null },
              { id: "settings", label: "Settings", icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>, badge: null }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.id ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{tab.icon}</svg>
                  {tab.label}
                </div>
                {tab.badge ? (
                  <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-bold">{tab.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* Conversation list in sidebar */}
          {conversations.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Recent Chats</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {conversations.slice(0, 6).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConvo(c)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm ${selectedConvo?.id === c.id ? "bg-slate-800 border border-slate-700" : "hover:bg-slate-800/60"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 truncate text-xs">{c.customerName || c.customerPhone}</span>
                      {c.language && <span className="text-[10px] text-slate-500">{LANG_BADGE[c.language] || c.language}</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{c.messages[0]?.content || "Voice message"}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${healthStatus ? "bg-emerald-400 animate-ping" : "bg-red-400"}`}></span>
            <span className="text-xs font-semibold text-slate-400">
              {healthStatus ? "Backend Connected" : "Backend Offline"}
            </span>
          </div>
          {healthStatus && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">AI: <span className="text-purple-400 font-semibold">{healthStatus.ai === "ready" ? "GPT-4o Live" : healthStatus.ai === "mock" ? "Mock (Sandbox)" : "No Key"}</span></p>
              <p className="text-xs text-slate-500">WA: <span className="text-emerald-400 font-semibold">{healthStatus.whatsapp}</span></p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {activeTab === "dashboard" && "Dashboard Overview"}
            {activeTab === "inbox" && "Shared Inbox — Live Conversations"}
            {activeTab === "settings" && "Integration Settings"}
          </h2>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${healthStatus ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              <span className={`w-2 h-2 rounded-full ${healthStatus ? "bg-emerald-400 animate-ping" : "bg-red-400"}`}></span>
              {healthStatus ? "Live" : "Offline"}
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { title: "Active Conversations", val: activeConversations.length, icon: "💬", desc: "Open WhatsApp chats" },
                  { title: "Total Messages", val: totalMessages, icon: "📩", desc: "All inbound + outbound" },
                  { title: "AI Auto-Replies", val: botMessages, icon: "🤖", desc: "Handled by GPT-4o" },
                  { title: "Languages Detected", val: [...new Set(conversations.map(c => c.language).filter(Boolean))].length || 0, icon: "🌍", desc: "EN / Roman Urdu / اردو" }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group">
                    <span className="text-2xl mb-4 block">{item.icon}</span>
                    <h3 className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">{item.title}</h3>
                    <p className="text-3xl font-extrabold text-white">{item.val}</p>
                    <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Sandbox Simulator + Conversation Feed */}
              <div className="grid grid-cols-5 gap-8">
                {/* Simulator */}
                <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                  <div className="p-6 border-b border-slate-800">
                    <h3 className="font-bold text-white mb-1">Sandbox Simulator</h3>
                    <p className="text-xs text-slate-400">Send a test message as a WhatsApp user. GPT-4o will reply in the same language.</p>
                  </div>
                  <div className="p-4 space-y-3 flex-1">
                    <div className="bg-slate-950/40 rounded-xl p-3 text-xs text-slate-400 space-y-1 border border-slate-800">
                      <p>💡 Try in different languages:</p>
                      <p className="text-purple-300 font-mono">"What is the status of my order?"</p>
                      <p className="text-emerald-300 font-mono">"mera order kahan hai bhai?"</p>
                      <p className="text-blue-300 font-mono">"میرا آرڈر کہاں ہے؟"</p>
                    </div>
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">{error}</div>
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 flex gap-3">
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="Type a message in any language..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputText.trim()}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white p-3 rounded-xl transition-colors"
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </form>
                </div>

                {/* Live conversation feed */}
                <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[500px]">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white">Live Conversation Feed</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Real-time from database · Auto-refreshes every 3s</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">{conversations.length} chats</span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <span className="text-4xl mb-3">💬</span>
                        <p className="font-semibold text-slate-300 text-sm">No conversations yet</p>
                        <p className="text-xs text-slate-500 mt-1">Send a message using the simulator →</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {conversations.map(c => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectConvo(c)}
                            className="w-full text-left p-5 hover:bg-slate-800/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {(c.customerName || c.customerPhone)?.[0]?.toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-200 text-sm">{c.customerName || c.customerPhone}</span>
                                  {c.language && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">{LANG_BADGE[c.language] || c.language}</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 truncate ml-10">
                                  {c.messages[0]?.content || c.messages[0]?.transcription || "Voice message"}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${c.status === "open" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                                  {c.status}
                                </span>
                                <p className="text-[10px] text-slate-600 mt-1">
                                  {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INBOX TAB ── */}
          {activeTab === "inbox" && (
            <div className="flex gap-6 h-[calc(100vh-12rem)]">
              {/* Conversation List */}
              <div className="w-80 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm">All Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-slate-500 text-sm">No conversations yet</p>
                    </div>
                  ) : (
                    conversations.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectConvo(c)}
                        className={`w-full text-left p-4 hover:bg-slate-800/40 transition-colors ${selectedConvo?.id === c.id ? "bg-slate-800" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {(c.customerName || c.customerPhone)?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-200 text-sm truncate">{c.customerName || c.customerPhone}</p>
                            <p className="text-xs text-slate-500 truncate">{c.messages[0]?.content || "Voice"}</p>
                          </div>
                          {c.language && <span className="text-[10px] text-slate-600">{LANG_BADGE[c.language]}</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
                {selectedConvo ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-5 border-b border-slate-800 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold">
                        {(selectedConvo.customerName || selectedConvo.customerPhone)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200">{selectedConvo.customerName || selectedConvo.customerPhone}</h4>
                        <p className="text-xs text-slate-500">{selectedConvo.customerPhone} · {selectedConvo.language ? LANG_BADGE[selectedConvo.language] : ""}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">{selectedConvo.status}</span>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/30">
                      {selectedConvo.messages.map(msg => {
                        const isInbound = msg.direction === "inbound";
                        return (
                          <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isInbound ? "bg-slate-900 border border-slate-800 rounded-tl-none" : "bg-purple-600 rounded-tr-none"}`}>
                              {msg.type === "audio" && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">🎤</span>
                                  <span className="text-xs font-semibold opacity-70">Voice Message</span>
                                </div>
                              )}
                              {msg.transcription && (
                                <p className="text-xs opacity-60 mb-1 italic">"{msg.transcription}"</p>
                              )}
                              <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content || "(no text)"}</p>
                              <div className="flex items-center justify-between mt-1.5 gap-3">
                                <span className={`text-[10px] ${isInbound ? "text-slate-500" : "text-purple-200"}`}>
                                  {msg.senderType === "bot" ? "🤖 AI" : msg.senderType === "agent" ? "👤 Agent" : "👤 Customer"}
                                  {msg.language ? ` · ${LANG_BADGE[msg.language] || msg.language}` : ""}
                                </span>
                                <span className={`text-[10px] ${isInbound ? "text-slate-600" : "text-purple-200"}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Send bar */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 flex gap-3">
                      <input
                        type="text"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Reply (simulates customer message)..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <button type="submit" disabled={isSending || !inputText.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors">
                        {isSending ? "Sending..." : "Send"}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <span className="text-5xl mb-4">💬</span>
                    <h3 className="font-bold text-slate-300 mb-2">Select a conversation</h3>
                    <p className="text-sm text-slate-500">Choose from the list on the left to view the full chat thread.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8">
              <h3 className="text-lg font-bold text-white">Integration Settings</h3>

              {[
                { label: "Backend API URL", val: `${API_BASE}`, mono: true },
                { label: "WhatsApp Webhook URL", val: "http://localhost:4000/api/v1/whatsapp/webhook", mono: true },
                { label: "Webhook Verify Token", val: "flowreply_webhook_2026", mono: true },
                { label: "AI Model", val: "GPT-4o (gpt-4o) + Whisper-1 + TTS-1", mono: false },
                { label: "Language Detection", val: "English · Roman Urdu · Urdu Script (اردو)", mono: false },
              ].map((item, i) => (
                <div key={i} className="border-b border-slate-800 pb-6 last:border-0 last:pb-0">
                  <h4 className="font-semibold text-slate-300 mb-1 text-sm">{item.label}</h4>
                  <div className={`bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm ${item.mono ? "font-mono text-slate-400" : "text-slate-300"}`}>
                    {item.val}
                  </div>
                </div>
              ))}

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
                <p className="font-bold mb-1">⚠️ WhatsApp Not Connected Yet</p>
                <p className="text-xs leading-relaxed">To receive real WhatsApp messages, add <span className="font-mono bg-slate-900 px-1 rounded">WA_PHONE_NUMBER_ID</span> and <span className="font-mono bg-slate-900 px-1 rounded">WA_ACCESS_TOKEN</span> to your <span className="font-mono bg-slate-900 px-1 rounded">backend/.env</span> file, then set <span className="font-mono bg-slate-900 px-1 rounded">USE_MOCK_WHATSAPP=false</span> and expose your server via ngrok.</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
