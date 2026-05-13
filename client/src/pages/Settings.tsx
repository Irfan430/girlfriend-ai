import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Settings as SettingsIcon, ArrowLeft, Heart, MessageCircle, LogOut, Trash2 } from "lucide-react";

const languageOptions = [
  { value: "both", label: "বাংলা + ইংরেজি", emoji: "🌐" },
  { value: "bangla", label: "শুধু বাংলা", emoji: "🇧🇩" },
  { value: "english", label: "শুধু ইংরেজি", emoji: "🇬🇧" },
] as const;

export default function Settings() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState("প্রিয়া");
  const [personality, setPersonality] = useState("");
  const [memories, setMemories] = useState("");
  const [language, setLanguage] = useState<"bangla" | "english" | "both">("both");
  const [dirty, setDirty] = useState(false);

  const personaQuery = trpc.persona.get.useQuery(undefined, { enabled: isAuthenticated });
  const updateMutation = trpc.persona.update.useMutation({
    onSuccess: () => {
      toast.success("সেটিংস সেভ হয়েছে 💕");
      setDirty(false);
      personaQuery.refetch();
    },
    onError: () => toast.error("সেভ করতে সমস্যা হয়েছে"),
  });
  const clearMutation = trpc.chat.clearHistory.useMutation({
    onSuccess: () => toast.success("চ্যাট পরিষ্কার হয়েছে 🌸"),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (personaQuery.data) {
      setName(personaQuery.data.girlfriendName ?? "প্রিয়া");
      setPersonality(personaQuery.data.personality ?? "");
      setMemories(personaQuery.data.memories ?? "");
      setLanguage(personaQuery.data.language ?? "both");
    }
  }, [personaQuery.data]);

  const handleSave = () => {
    updateMutation.mutate({ girlfriendName: name, personality, memories, language });
  };

  const markDirty = () => setDirty(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <SettingsIcon className="w-5 h-5 neon-text-pink" />
        <h1 className="font-bold gradient-text text-lg">সেটিংস</h1>
        <div className="ml-auto">
          <button onClick={() => navigate("/chat")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">চ্যাটে যাও</span>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* User info */}
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <p className="font-semibold text-foreground">{user?.name ?? "ব্যবহারকারী"}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={logout}
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            লগআউট
          </button>
        </div>

        {/* Persona settings */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 neon-text-pink" />
            গার্লফ্রেন্ডের পরিচয়
          </h2>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">নাম</label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); markDirty(); }}
              placeholder="প্রিয়া"
              className="bg-input border-border/60 focus:border-primary/60 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">ব্যক্তিত্ব ও স্বভাব</label>
            <Textarea
              value={personality}
              onChange={(e) => { setPersonality(e.target.value); markDirty(); }}
              placeholder="যেমন: মিষ্টি, যত্নশীল, একটু দুষ্টু, হাসিখুশি..."
              rows={3}
              className="bg-input border-border/60 focus:border-primary/60 text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">বিশেষ স্মৃতি / নোট</label>
            <Textarea
              value={memories}
              onChange={(e) => { setMemories(e.target.value); markDirty(); }}
              placeholder="যেমন: আমরা একসাথে বৃষ্টিতে ভিজেছিলাম, তুমি আমার প্রিয় গান গেয়েছিলে..."
              rows={4}
              className="bg-input border-border/60 focus:border-primary/60 text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">ভাষা পছন্দ</label>
            <div className="grid grid-cols-3 gap-2">
              {languageOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setLanguage(opt.value); markDirty(); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all duration-200 ${
                    language === opt.value
                      ? "neon-border-pink bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !dirty}
            className="w-full bg-primary text-primary-foreground hover:opacity-90 font-semibold disabled:opacity-40"
          >
            {updateMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করো 💕"}
          </Button>
        </div>

        {/* Danger zone */}
        <div className="glass-card rounded-xl p-5 space-y-3 border-destructive/20">
          <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
            <Trash2 className="w-4 h-4 text-destructive" />
            বিপজ্জনক এলাকা
          </h2>
          <p className="text-xs text-muted-foreground">এই কাজগুলো পূর্বাবস্থায় ফেরানো যাবে না।</p>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("সব চ্যাট মুছে ফেলবো?")) clearMutation.mutate();
            }}
            disabled={clearMutation.isPending}
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 text-sm"
          >
            {clearMutation.isPending ? "মুছছে..." : "সব চ্যাট মুছো"}
          </Button>
        </div>
      </div>
    </div>
  );
}
