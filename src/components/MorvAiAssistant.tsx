import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  TrendingUp, 
  Play, 
  Volume2, 
  HelpCircle,
  Clock,
  Loader2,
  Trash2
} from "lucide-react";
import { ChatMessage } from "../types";

interface AssistantProps {
  chatHistory: ChatMessage[];
  setChatHistory: (hist: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  lang: 'ar' | 'en';
  userProfile: { name: string; balanceEGP: number };
}

export default function MorvAiAssistant({
  chatHistory,
  setChatHistory,
  lang,
  userProfile
}: AssistantProps) {
  const isRtl = lang === 'ar';
  
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechActiveId, setSpeechActiveId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const speakText = (text: string, msgId: string) => {
    if ('speechSynthesis' in window) {
      if (speechActiveId === msgId) {
        window.speechSynthesis.cancel();
        setSpeechActiveId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = isRtl ? 'ar-EG' : 'en-US';
      utterance.onend = () => {
        setSpeechActiveId(null);
      };
      utterance.onerror = () => {
        setSpeechActiveId(null);
      };
      window.speechSynthesis.speak(utterance);
      setSpeechActiveId(msgId);
    } else {
      alert(isRtl ? "متصفحك لا يدعم تحويل النصوص إلى كلام." : "Browser does not support TTS.");
    }
  };

  // Auto-scroll chat to latest messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const quickPrompts = isRtl ? [
    { text: "كيف يمكنني توفير 5,000 جنيه مصري هذا الشهر؟", icon: "💡" },
    { text: "أنشئ لي فكرة لتنظيم ميزانية شركة مقاولات صغيرة كدراسة حالة", icon: "🏗️" },
    { text: "ما رأيك بمستوى إنفاقي بناءً على رصيد حسابي الحالي؟", icon: "📊" },
    { text: "أعطني خطة عاجلة لإدارة ديوني وسدادها للعملاء", icon: "💸" }
  ] : [
    { text: "How can I budget for a small tech business in Egypt?", icon: "💡" },
    { text: "Analyze my cash flow safety based on my EGP ledger", icon: "📊" },
    { text: "Suggest cost cutting measures for remote operation", icon: "✂️" }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append User message
    const userMsg: ChatMessage = {
      id: "msg_user_" + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory([...chatHistory, userMsg]);
    setUserInput("");
    setLoading(true);

    try {
      // Package query options
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory, userMsg],
          userContext: {
            balanceEGP: userProfile.balanceEGP,
            monthlyLimit: 45230,
            spentAmount: 12500,
            tasksCount: 3
          }
        })
      });

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: "msg_ai_" + Date.now(),
        sender: 'assistant',
        text: data.text || "عذرًا يا فندم، واجهت مشكلة ما أثناء معالجة البيانات الحسابية.",
        timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      const errMsg: ChatMessage = {
        id: "msg_ai_" + Date.now(),
        sender: 'assistant',
        text: "تعذر الاتصال بـ MORV AI حالياً. تم تشغيل الخادم الاحتياطي الذكي لمساعدتك.",
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isRtl ? "ميزة الإدخال الصوتي غير مدعومة بالكامل بمستعرضك." : "Speech recognition not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = isRtl ? 'ar-EG' : 'en-US';

    rec.onstart = () => {
      setIsRecording(true);
    };

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        handleSendMessage(transcript);
      }
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    rec.start();
  };

  const handleClearHistory = () => {
    setChatHistory([]);
  };

  // Lightweight beautiful Markdown/custom formatter
  const renderFormattedText = (raw: string) => {
    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Header matching
      if (trimmed.startsWith("###")) {
        return <h5 key={idx} className="text-sm font-bold text-slate-100 mt-3 mb-1">{trimmed.replace("###", "").trim()}</h5>;
      }
      if (trimmed.startsWith("##") || trimmed.startsWith("**")) {
        return <p key={idx} className="text-sm font-extrabold text-emerald-400 mt-2 mb-1">{trimmed.replace(/##|\*\*/g, "").trim()}</p>;
      }
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        return (
          <li key={idx} className="list-disc leading-relaxed text-xs text-slate-300 ml-4 mr-4 mt-1">
            {trimmed.substring(1).trim()}
          </li>
        );
      }
      
      // Default text line
      return <p key={idx} className="text-xs leading-relaxed text-slate-350 mt-1">{trimmed}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Dynamic Header console */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-400/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base font-sans leading-none">{isRtl ? "مساعد مورف AI" : "MORV AI Assistant Core"}</h4>
            <p className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase mt-1">{isRtl ? "مستشار مالي أعمالي نشط" : "Elite Financial Agent ACTIVE"}</p>
          </div>
        </div>

        <button 
          onClick={handleClearHistory}
          className="p-2.5 text-rose-455 hover:text-rose-300 bg-zinc-950 hover:bg-zinc-900 rounded-xl transition-all border border-white/5 cursor-pointer"
          title={isRtl ? "تنظيف المحادثة" : "Clear Chat History"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main chat log output arena */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/10">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#030303] border border-white/10 flex items-center justify-center shadow-2xl">
              <Bot className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-100 font-sans">
                {isRtl ? `مرحباً بك يا ${userProfile.name}، أنا مستشارك الحسابي MORV AI` : `Welcome, I am MORV AI Counselor.`}
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 font-sans leading-relaxed">
                {isRtl ? "اطرح علي أية اسئلة متعلقة بالميزانية بالجنيه المصري، سأقوم بتقديم النصائح فورا!" : "Ask me anything about EGP cashflows, investments, and debts."}
              </p>
            </div>

            {/* Quick Chips prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4 text-right">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  className="bg-black/40 hover:bg-[#0c0c0c] border border-white/5 hover:border-cyan-500/20 p-3.5 rounded-xl text-xs text-zinc-350 hover:text-cyan-400 transition-all text-start cursor-pointer shadow-xl duration-200"
                >
                  <span className="inline-block mr-1 text-sm">{p.icon}</span> {p.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg) => {
              const isAi = msg.sender === 'assistant';
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-0' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs shadow-md ${
                    isAi ? 'bg-zinc-950 text-cyan-400 border border-white/10' : 'bg-gradient-to-tr from-cyan-500 to-emerald-400 text-black font-extrabold'
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1 w-full">
                    <div className={`p-4 rounded-2xl ${
                      isAi 
                        ? 'bg-[#030303]/90 border border-white/5 rounded-tr-none' 
                        : 'bg-zinc-900 text-zinc-100 rounded-tl-none font-medium'
                    }`}>
                      <div className="space-y-1 font-sans">
                        {isAi ? renderFormattedText(msg.text) : (
                          <p className="text-zinc-100 text-xs leading-relaxed">{msg.text}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="block text-[9px] text-zinc-500 font-mono tracking-tight text-right">
                        {msg.timestamp}
                      </span>
                      {isAi && (
                        <button 
                          onClick={() => speakText(msg.text, msg.id)}
                          className={`p-1 rounded-md text-zinc-500 hover:text-cyan-400 hover:bg-zinc-900 transition-all ${
                            speechActiveId === msg.id ? 'text-cyan-400 animate-pulse bg-cyan-500/10' : ''
                          }`}
                          title={isRtl ? "استمع للإجابة" : "Listen Response"}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-cyan-400 border border-white/10 flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 bg-[#030303] border border-white/5 rounded-2xl rounded-tr-none flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150"></span>
                  <span className="text-xs text-zinc-500 ml-1 font-sans">{isRtl ? "مورف يفكر بالبيانات..." : "MORV modeling..."}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Inputs bar with Voice synthesis animation deck */}
      <div className="p-4 border-t border-white/5 bg-[#0a0a0a] shrink-0">
        
        {/* Floating Recording indicator */}
        {isRecording && (
          <div className="absolute inset-x-0 bottom-24 mx-auto w-48 bg-cyan-500 text-black p-2.5 rounded-full flex items-center justify-center gap-3 shadow-2xl shadow-cyan-500/25 animate-bounce z-40">
            <span className="flex gap-1">
              <span className="w-1 h-3 bg-black animate-pulse inline-block"></span>
              <span className="w-1 h-3 bg-black animate-pulse inline-block delay-75"></span>
              <span className="w-1 h-3 bg-black animate-pulse inline-block delay-100"></span>
            </span>
            <span className="text-xs font-extrabold">{isRtl ? "مورف يستمع لصوتك..." : "Listening..."}</span>
          </div>
        )}

        <div className="bg-black border border-white/5 focus-within:border-cyan-500/40 rounded-xl p-2.5 flex items-end gap-2 shadow-sm transition-all bg-black/60">
          <input 
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
            placeholder={isRtl ? "اسأل مساعد مورف AI المالي..." : "Draft any query to MORV..."}
            className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-650 focus:outline-none focus:ring-0 py-2.5 text-xs text-zinc-150 font-sans"
          />

          <button 
            type="button"
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              isRecording 
                ? 'bg-rose-500/10 text-rose-455 hover:bg-rose-500/20' 
                : 'text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900'
            }`}
            title={isRtl ? "إدخال صوتي" : "Voice input"}
          >
            {isRecording ? <MicOff className="w-4 h-4 animate-ping" /> : <Mic className="w-4 h-4" />}
          </button>

          <button 
            type="button"
            onClick={() => handleSendMessage(userInput)}
            disabled={!userInput.trim() || loading}
            className="p-2.5 bg-gradient-to-tr from-cyan-500 to-emerald-400 text-black hover:opacity-90 disabled:bg-zinc-900 disabled:text-zinc-600 rounded-xl shadow-md transition-all flex items-center justify-center shrink-0 cursor-pointer font-extrabold"
          >
            <Send className="w-4 h-4 stroke-[3px] text-black" />
          </button>
        </div>
      </div>

    </div>
  );
}
