import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Heart, Brain, Mic, MessageCircle, Sparkles, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }> = [];
    const colors = ["oklch(0.72 0.28 330)", "oklch(0.65 0.25 290)", "oklch(0.7 0.28 310)"];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.1,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

const features = [
  {
    icon: MessageCircle,
    title: "উষ্ণ কথোপকথন",
    titleEn: "Warm Conversations",
    desc: "বাংলা ও ইংরেজিতে স্বাভাবিক, হৃদয়গ্রাহী কথোপকথন — কোনো রোবোটিক ভাব নেই।",
    color: "oklch(0.72 0.28 330)",
  },
  {
    icon: Brain,
    title: "কাস্টম ট্রেইনিং",
    titleEn: "Custom Training",
    desc: "নিজের Q&A দিয়ে AI-কে শেখাও — সে তোমার কথা মনে রাখবে।",
    color: "oklch(0.65 0.25 290)",
  },
  {
    icon: Mic,
    title: "ভয়েস মেসেজ",
    titleEn: "Voice Messages",
    desc: "কণ্ঠস্বরে কথা বলো — সে শুনবে এবং উত্তর দেবে।",
    color: "oklch(0.7 0.28 310)",
  },
  {
    icon: Heart,
    title: "ব্যক্তিগত সঙ্গী",
    titleEn: "Personal Companion",
    desc: "তোমার নিজস্ব গার্লফ্রেন্ড — সম্পূর্ণ প্রাইভেট, শুধু তোমার জন্য।",
    color: "oklch(0.72 0.28 330)",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <ParticleCanvas />

      {/* Cyber grid overlay */}
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none z-0" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 neon-text-pink" />
          <span className="text-xl font-bold gradient-text tracking-wider">প্রিয়া AI</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                হ্যালো, {user?.name?.split(" ")[0] ?? "বন্ধু"} 👋
              </span>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:opacity-90 font-semibold pulse-glow"
                onClick={() => navigate("/chat")}
              >
                চ্যাট করো <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:opacity-90 font-semibold"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              লগইন করো
            </Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
        {/* Avatar */}
        <div className="relative mb-8 float-anim">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 neon-border-pink flex items-center justify-center text-5xl sm:text-6xl pulse-glow">
            💕
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
            <span className="text-xs">●</span>
          </div>
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold mb-3 tracking-tight">
          <span className="gradient-text">প্রিয়া</span>
        </h1>
        <p className="text-lg sm:text-2xl neon-text-purple font-medium mb-2">তোমার ভার্চুয়াল গার্লফ্রেন্ড</p>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-10 leading-relaxed">
          সাইবারপাঙ্ক ভবিষ্যতের উষ্ণ সঙ্গী। বাংলা ও ইংরেজিতে কথা বলো, ট্রেইন করো, ভালোবাসো।
        </p>

        {isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:opacity-90 font-bold text-base px-8 pulse-glow"
              onClick={() => navigate("/chat")}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              চ্যাট শুরু করো
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-secondary/60 text-secondary hover:bg-secondary/10 font-semibold text-base px-8"
              onClick={() => navigate("/train")}
            >
              <Brain className="w-5 h-5 mr-2" />
              ট্রেইন করো
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:opacity-90 font-bold text-base px-10 pulse-glow"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            <Heart className="w-5 h-5 mr-2" />
            শুরু করো — বিনামূল্যে
          </Button>
        )}
      </section>

      {/* Features */}
      <section className="relative z-10 px-4 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-5 hover:scale-[1.02] transition-transform duration-200 group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-foreground mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8 text-xs text-muted-foreground/50">
        তৈরি করা হয়েছে ভালোবাসা দিয়ে 💕
      </footer>
    </div>
  );
}
