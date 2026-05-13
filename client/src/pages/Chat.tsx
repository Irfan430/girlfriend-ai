import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Send,
  Mic,
  MicOff,
  Trash2,
  Brain,
  Settings,
  Sparkles,
  ArrowLeft,
  Square,
  MessageCircle,
} from "lucide-react";
import { storagePut } from "../lib/storage";

// ── Types ─────────────────────────────────────────────────────────────────────
type Msg = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2 bubble-left">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/40 flex items-center justify-center text-sm flex-shrink-0">
        💕
      </div>
      <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80px]">
        <div className="flex items-center gap-1 h-4">
          <span className="typing-dot w-2 h-2 rounded-full bg-primary block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-primary block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-primary block" />
        </div>
      </div>
    </div>
  );
}

// ── Chat Bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg, girlfriendName }: { msg: Msg; girlfriendName: string }) {
  const isUser = msg.role === "user";
  const time = new Date(msg.createdAt).toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2 bubble-right">
        <div className="flex flex-col items-end gap-1 max-w-[75%] sm:max-w-[60%]">
          <div
            className="rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.28 330 / 0.9), oklch(0.65 0.25 290 / 0.9))",
              color: "oklch(0.95 0.02 300)",
              boxShadow: "0 0 15px oklch(0.72 0.28 330 / 0.3)",
            }}
          >
            {msg.content}
          </div>
          <span className="text-xs text-muted-foreground/60 px-1">{time}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm flex-shrink-0">
          👤
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 bubble-left">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/40 flex items-center justify-center text-sm flex-shrink-0">
        💕
      </div>
      <div className="flex flex-col gap-1 max-w-[75%] sm:max-w-[60%]">
        <span className="text-xs neon-text-pink px-1 font-semibold">{girlfriendName}</span>
        <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed text-foreground">
          {msg.content}
        </div>
        <span className="text-xs text-muted-foreground/60 px-1">{time}</span>
      </div>
    </div>
  );
}

// ── Main Chat Page ────────────────────────────────────────────────────────────
export default function Chat() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // tRPC
  const historyQuery = trpc.chat.getHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );
  const personaQuery = trpc.persona.get.useQuery(undefined, { enabled: isAuthenticated });
  const sendMutation = trpc.chat.sendMessage.useMutation();
  const clearMutation = trpc.chat.clearHistory.useMutation();
  const transcribeMutation = trpc.voice.transcribe.useMutation();

  const girlfriendName = personaQuery.data?.girlfriendName ?? "প্রিয়া";

  // Load history
  useEffect(() => {
    if (historyQuery.data) {
      setMessages(historyQuery.data as Msg[]);
    }
  }, [historyQuery.data]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isTyping) return;
      const trimmed = content.trim();
      setInput("");

      const userMsg: Msg = {
        id: Date.now(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const result = await sendMutation.mutateAsync({ content: trimmed });
        setMessages((prev) => [...prev, result as Msg]);
      } catch {
        toast.error("মেসেজ পাঠাতে সমস্যা হয়েছে 😢");
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, sendMutation]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("সব মেসেজ মুছে ফেলবো?")) return;
    await clearMutation.mutateAsync();
    setMessages([]);
    toast.success("চ্যাট পরিষ্কার হয়ে গেছে 🌸");
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size > 16 * 1024 * 1024) {
          toast.error("অডিও ফাইল অনেক বড়");
          return;
        }
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const { url } = await storagePut(
            `voice/${Date.now()}.webm`,
            new Uint8Array(arrayBuffer),
            "audio/webm"
          );
          const fullUrl = window.location.origin + url;
          const result = await transcribeMutation.mutateAsync({ audioUrl: fullUrl });
          if (result.text) {
            setInput(result.text);
            textareaRef.current?.focus();
            toast.success("ভয়েস টেক্সটে রূপান্তরিত হয়েছে 🎙️");
          }
        } catch {
          toast.error("ভয়েস ট্রান্সক্রিপশনে সমস্যা হয়েছে");
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("মাইক্রোফোন অ্যাক্সেস দরকার 🎙️");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 float-anim">💕</div>
          <p className="neon-text-pink animate-pulse">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border/40 flex items-center gap-2">
          <Sparkles className="w-4 h-4 neon-text-pink" />
          <span className="font-bold gradient-text text-lg">প্রিয়া AI</span>
        </div>

        {/* Girlfriend avatar */}
        <div className="p-6 flex flex-col items-center border-b border-border/40">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 neon-border-pink flex items-center justify-center text-3xl mb-3 pulse-glow float-anim">
            💕
          </div>
          <p className="font-bold neon-text-pink text-lg">{girlfriendName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">অনলাইন</span>
          </div>
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate("/train")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Brain className="w-4 h-4" />
            ট্রেইনিং প্যানেল
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            সেটিংস
          </button>
          <button
            onClick={handleClearHistory}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            চ্যাট মুছো
          </button>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">👤</div>
            <span className="truncate">{user?.name ?? "ব্যবহারকারী"}</span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border/40 p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold gradient-text">প্রিয়া AI</span>
              <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 neon-border-pink flex items-center justify-center text-2xl mb-2 pulse-glow">
                💕
              </div>
              <p className="font-bold neon-text-pink">{girlfriendName}</p>
            </div>
            <nav className="space-y-2">
              <button onClick={() => { navigate("/train"); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                <Brain className="w-4 h-4" /> ট্রেইনিং প্যানেল
              </button>
              <button onClick={() => { navigate("/settings"); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                <Settings className="w-4 h-4" /> সেটিংস
              </button>
              <button onClick={() => { handleClearHistory(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" /> চ্যাট মুছো
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-border/40 bg-card/90 backdrop-blur-sm flex items-center justify-around px-2 py-2" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <button
          onClick={() => navigate("/chat")}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-primary"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">চ্যাট</span>
        </button>
        <button
          onClick={() => navigate("/train")}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Brain className="w-5 h-5" />
          <span className="text-[10px] font-medium">ট্রেইন</span>
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">সেটিংস</span>
        </button>
      </nav>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/30 backdrop-blur-sm">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Sparkles className="w-5 h-5 neon-text-pink" />
          </button>
          <button
            className="hidden lg:flex text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/40 flex items-center justify-center text-sm">
            💕
          </div>
          <div>
            <p className="font-semibold text-sm neon-text-pink">{girlfriendName}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-muted-foreground">অনলাইন</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate("/train")}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Brain className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20 lg:pb-4">
          {messages.length === 0 && !historyQuery.isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="text-5xl mb-4 float-anim">💕</div>
              <p className="neon-text-pink font-semibold text-lg mb-2">হ্যালো! আমি {girlfriendName}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                তোমার সাথে কথা বলতে পেরে খুশি! কী মনে আছে তোমার? 🌸
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} girlfriendName={girlfriendName} />
          ))}

          {isTyping && <TypingIndicator name={girlfriendName} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-border/40 bg-card/30 backdrop-blur-sm pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-4">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            {/* Voice button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={transcribeMutation.isPending}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isRecording
                  ? "bg-red-500/20 border border-red-500 text-red-400 animate-pulse"
                  : "bg-muted/50 border border-border text-muted-foreground hover:text-primary hover:border-primary/50"
              }`}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${girlfriendName}-কে কিছু বলো... 💕`}
                rows={1}
                className="resize-none min-h-[40px] max-h-[120px] bg-input border-border/60 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-sm pr-2 overflow-y-auto"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
                disabled={isTyping}
              />
            </div>

            {/* Send button */}
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-10 h-10 p-0 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 pulse-glow"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {isRecording && (
            <p className="text-center text-xs text-red-400 mt-2 animate-pulse">
              🔴 রেকর্ডিং চলছে... থামাতে বাটন চাপো
            </p>
          )}
          {transcribeMutation.isPending && (
            <p className="text-center text-xs neon-text-purple mt-2 animate-pulse">
              🎙️ ভয়েস প্রসেস হচ্ছে...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
