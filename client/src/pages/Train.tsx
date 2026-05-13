import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Brain, Plus, Trash2, ArrowLeft, MessageCircle, Sparkles, Settings, Upload } from "lucide-react";

export default function Train() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);

  const listQuery = trpc.training.list.useQuery(undefined, { enabled: isAuthenticated });
  const addMutation = trpc.training.add.useMutation({
    onSuccess: () => {
      listQuery.refetch();
      setQuestion("");
      setAnswer("");
      toast.success("ট্রেইনিং ডেটা যোগ হয়েছে! 🧠");
    },
    onError: () => toast.error("যোগ করতে সমস্যা হয়েছে"),
  });
  const deleteMutation = trpc.training.delete.useMutation({
    onSuccess: () => {
      listQuery.refetch();
      toast.success("মুছে ফেলা হয়েছে");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  const handleAdd = () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("প্রশ্ন এবং উত্তর দুটোই দরকার");
      return;
    }
    addMutation.mutate({ question: question.trim(), answer: answer.trim() });
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast.error("কিছু টেক্সট পেস্ট করো");
      return;
    }

    setBulkImporting(true);
    const lines = bulkText.split("\n").filter((l) => l.trim());
    let imported = 0;
    let total = 0;

    // Parse format: Q: question | A: answer (each on separate line)
    for (let i = 0; i < lines.length; i += 2) {
      const qLine = lines[i]?.trim();
      const aLine = lines[i + 1]?.trim();

      if (qLine && aLine) {
        const q = qLine.replace(/^Q:\s*/i, "").trim();
        const a = aLine.replace(/^A:\s*/i, "").trim();

        if (q && a) {
          total++;
          try {
            await new Promise((resolve) => {
              addMutation.mutate(
                { question: q, answer: a },
                {
                  onSuccess: () => {
                    imported++;
                    resolve(null);
                  },
                  onError: () => {
                    resolve(null);
                  },
                }
              );
            });
          } catch (e) {
            // ignore
          }
        }
      }
    }

    setBulkImporting(false);
    if (imported > 0) {
      toast.success(`${imported}টি ট্রেইনিং যোগ হয়েছে! 🧠`);
      setBulkText("");
      setShowBulkImport(false);
      listQuery.refetch();
    } else {
      toast.error("কোনো ডেটা যোগ হয়নি। ফরম্যাট চেক করো");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Brain className="w-5 h-5 neon-text-purple" />
        <h1 className="font-bold gradient-text text-lg">ট্রেইনিং প্যানেল</h1>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => navigate("/settings")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">সেটিংস</span>
          </button>
          <button onClick={() => navigate("/chat")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">চ্যাটে যাও</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info card */}
        <div className="glass-card rounded-xl p-4 border-l-2 border-l-secondary">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 neon-text-purple flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">কাস্টম ট্রেইনিং কীভাবে কাজ করে?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                তুমি যে প্রশ্ন-উত্তর যোগ করবে, সেগুলো প্রিয়ার স্মৃতিতে থাকবে। সে এই তথ্য ব্যবহার করে তোমার সাথে আরও ব্যক্তিগতভাবে কথা বলবে। বাল্ক ইমপোর্ট দিয়ে একসাথে অনেক ডেটা যোগ করতে পারো।
              </p>
            </div>
          </div>
        </div>

        {/* Add form */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 neon-text-pink" />
              নতুন ট্রেইনিং যোগ করো
            </h2>
            <button
              onClick={() => setShowBulkImport(!showBulkImport)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-secondary/30 text-secondary hover:bg-secondary/50 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              বাল্ক ইমপোর্ট
            </button>
          </div>

          {!showBulkImport ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">প্রশ্ন / বিষয়</label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="যেমন: আমার প্রিয় রং কী?"
                  className="bg-input border-border/60 focus:border-primary/60 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">উত্তর / তথ্য</label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="যেমন: তোমার প্রিয় রং নীল, তুমি সমুদ্রের মতো শান্ত..."
                  rows={3}
                  className="bg-input border-border/60 focus:border-primary/60 text-sm resize-none"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={addMutation.isPending || !question.trim() || !answer.trim()}
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-semibold"
              >
                {addMutation.isPending ? "যোগ হচ্ছে..." : "যোগ করো 🧠"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">বাল্ক ইমপোর্ট (প্রতি দুই লাইনে Q এবং A)</label>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Q: আমার নাম কী?\nA: তোমার নাম রহিম\nQ: তুমি কী করো?\nA: আমি তোমার সাথে কথা বলি এবং তোমাকে ভালোবাসি`}
                  rows={8}
                  className="bg-input border-border/60 focus:border-primary/60 text-sm resize-none font-mono text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkImport}
                  disabled={bulkImporting || !bulkText.trim()}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90 font-semibold"
                >
                  {bulkImporting ? "ইমপোর্ট হচ্ছে..." : "ইমপোর্ট করো 📥"}
                </Button>
                <Button
                  onClick={() => setShowBulkImport(false)}
                  variant="outline"
                  className="flex-1"
                >
                  বাতিল
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Training list */}
        <div className="space-y-3">
          <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 neon-text-purple" />
            সংরক্ষিত ট্রেইনিং ({listQuery.data?.length ?? 0}টি)
          </h2>

          {listQuery.isLoading && (
            <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">লোড হচ্ছে...</div>
          )}

          {!listQuery.isLoading && listQuery.data?.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center">
              <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">এখনো কোনো ট্রেইনিং ডেটা নেই</p>
              <p className="text-xs text-muted-foreground/60 mt-1">উপরে ফর্ম পূরণ করে যোগ করো অথবা বাল্ক ইমপোর্ট ব্যবহার করো</p>
            </div>
          )}

          {listQuery.data?.map((item) => (
            <div key={item.id} className="glass-card rounded-xl p-4 group hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold neon-text-pink mb-1 truncate">❓ {item.question}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.answer}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate({ id: item.id })}
                  disabled={deleteMutation.isPending}
                  className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground/40 mt-2">
                {new Date(item.createdAt).toLocaleDateString("bn-BD")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
