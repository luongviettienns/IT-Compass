import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, Clock, CheckCircle2, ChevronRight, Sparkles,
  BarChart3, ShieldCheck, Zap, Star, Users, ArrowRight, Play, Quote
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const steps = [
  {
    icon: Brain,
    title: "Trả lời câu hỏi tính cách",
    desc: "20 câu hỏi ngắn về sở thích, phong cách làm việc và tư duy của bạn.",
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-400/20",
  },
  {
    icon: BarChart3,
    title: "Hệ thống phân tích",
    desc: "AI phân tích câu trả lời và so sánh với hàng nghìn hồ sơ chuyên gia IT thực tế.",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-400/20",
  },
  {
    icon: Sparkles,
    title: "Nhận kết quả cá nhân hóa",
    desc: "Danh sách chuyên ngành phù hợp nhất, lộ trình học và mức lương tiềm năng của bạn.",
    color: "text-secondary",
    bg: "bg-secondary/10 border-secondary/20",
  },
];

const features = [
  { icon: Clock, label: "Chỉ ~3 phút", desc: "20 câu hỏi ngắn gọn" },
  { icon: ShieldCheck, label: "Hoàn toàn miễn phí", desc: "Không cần tài khoản" },
  { icon: Zap, label: "Kết quả ngay lập tức", desc: "AI phân tích tức thì" },
  { icon: Star, label: "Độ chính xác cao", desc: "Dựa trên 10.000+ hồ sơ" },
];

const majorsPreview = [
  { name: "Frontend Dev", emoji: "🎨", match: 94 },
  { name: "Backend Dev", emoji: "⚙️", match: 81 },
  { name: "UI/UX Designer", emoji: "✏️", match: 77 },
  { name: "AI/ML Engineer", emoji: "🤖", match: 62 },
  { name: "DevOps Engineer", emoji: "☁️", match: 55 },
];

const testimonials = [
  {
    name: "Minh Quân",
    role: "FRONTEND DEV @ FPT SOFTWARE",
    text: "Test này giúp mình xác định được mình hợp với Frontend. Sau 8 tháng học theo lộ trình được gợi ý, mình đã có việc làm!",
    avatar: "https://i.pravatar.cc/150?u=minhquan",
  },
  {
    name: "Thu Hà",
    role: "DATA ANALYST @ TIKI",
    text: "Mình không biết mình hợp với gì, sau khi làm test mới biết mình có tư duy phân tích rất tốt. Giờ làm Data và rất yêu nghề!",
    avatar: "https://i.pravatar.cc/150?u=thuha",
  },
  {
    name: "Đức Thành",
    role: "DEVOPS ENGINEER @ VNG",
    text: "Kết quả test chính xác đến mức đáng sợ. Mình thích hệ thống hóa và tự động hóa, và DevOps là cái nghề hoàn hảo cho mình.",
    avatar: "https://i.pravatar.cc/150?u=ducthanh",
  },
];

export function TestPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="pt-16 pb-24 min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/20 via-background/50 to-background pt-16 pb-20 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/15 rounded-full blur-[80px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 px-4 py-2 rounded-full text-secondary font-semibold text-sm mb-6">
            <Brain className="w-4 h-4" />
            Trắc nghiệm định hướng IT · Miễn phí
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-secondary/80">
              Bạn sinh ra để làm
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary">
              nghề IT nào?
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Chỉ mất <strong className="text-foreground">3 phút</strong> để biết bạn hợp với Frontend, Backend, AI hay một lĩnh vực nào khác — dựa trên tính cách và tư duy thực sự của bạn.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={() => navigate("/test/quiz")}
              className="relative h-14 px-10 text-base font-bold rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_30px_rgba(0,180,216,0.4)] hover:shadow-[0_0_40px_rgba(0,180,216,0.6)] transition-all duration-300 group gap-3"
            >
              <Play className="w-5 h-5 fill-current" />
              Bắt Đầu Làm Test
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <span className="text-sm text-muted-foreground">Không cần đăng ký · Kết quả tức thì</span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 bg-card/60 border border-border/40 rounded-2xl p-4 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-secondary" />
                <span className="font-bold text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Quy Trình 3 Bước Đơn Giản</h2>
          <p className="text-muted-foreground">Từ trả lời câu hỏi đến nhận lộ trình nghề nghiệp cá nhân</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line desktop */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />

          {steps.map((step, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`relative flex flex-col items-center text-center p-8 rounded-2xl border transition-all duration-300 cursor-default ${step.bg} ${hovered === i ? "scale-105 shadow-xl" : ""}`}
            >
              <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black text-sm shadow-md`}>
                {i + 1}
              </div>
              <div className={`w-14 h-14 rounded-2xl ${step.bg} border flex items-center justify-center mb-5`}>
                <step.icon className={`w-7 h-7 ${step.color}`} />
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Result Preview */}
      <section className="bg-card/40 border-y border-border/50 py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Kết Quả Trông Như Thế Nào?</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Sau khi hoàn thành, bạn sẽ nhận được bảng xếp hạng độ phù hợp với từng chuyên ngành IT, kèm theo giải thích chi tiết và lộ trình học cụ thể.
              </p>
              <div className="space-y-2">
                {["Danh sách ngành phù hợp theo %", "Phân tích điểm mạnh & điểm yếu", "Lộ trình học tập gợi ý", "Mức lương kỳ vọng thực tế"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                    <span className="text-sm text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Result Card */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                  <Brain className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-bold">Kết Quả Của Bạn</p>
                  <p className="text-xs text-muted-foreground">Dựa trên 20 câu trả lời</p>
                </div>
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Độ Phù Hợp Theo Ngành</p>

              <div className="space-y-3">
                {majorsPreview.map((m, i) => (
                  <div key={m.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold">{m.emoji} {m.name}</span>
                      <span className={`font-bold ${i === 0 ? "text-secondary" : "text-muted-foreground"}`}>{m.match}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${i === 0 ? "bg-gradient-to-r from-secondary to-primary" : "bg-muted-foreground/30"}`}
                        style={{ width: `${m.match}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                ✨ Đây là kết quả minh họa — kết quả thực của bạn có thể khác
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-secondary" />
            <span className="font-bold text-lg">Hơn 50.000 người đã làm test</span>
          </div>
          <p className="text-muted-foreground">Và tìm thấy con đường IT phù hợp với họ</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative z-10 pt-4">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-secondary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`group relative ${i === 1 ? 'md:-translate-y-8' : ''}`}
            >
              {/* Glow border on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-2xl blur opacity-0 group-hover:opacity-40 transition duration-500" />

              <Card className="relative h-full border-white/10 border bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group-hover:-translate-y-2 group-hover:border-secondary/30">
                {/* Watermark quote icon */}
                <div className="absolute -top-4 -right-4 text-secondary/5 group-hover:text-secondary/20 transition-colors duration-500 rotate-12 z-0">
                  <Quote size={140} className="fill-current stroke-[0.5]" />
                </div>

                <CardContent className="p-8 flex flex-col h-full relative z-10">
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-5 h-5 fill-secondary/80 text-secondary/80 drop-shadow-sm group-hover:fill-secondary group-hover:text-secondary transition-colors" />
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-foreground/90 leading-relaxed mb-8 flex-1 font-medium relative italic">
                    <span className="text-5xl text-secondary absolute -left-5 -top-4 font-serif opacity-30 leading-none">"</span>
                    {t.text}
                  </p>

                  {/* Author */}
                  <div className="bg-background/50 backdrop-blur-sm p-4 rounded-xl flex items-center gap-4 mt-auto border border-white/5 group-hover:border-secondary/30 transition-colors shadow-inner">
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-primary to-secondary shadow-md group-hover:shadow-secondary/30 transition-shadow">
                      <div className="w-full h-full rounded-full border-2 border-background overflow-hidden relative">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-foreground group-hover:text-secondary transition-colors">{t.name}</h4>
                      <p className="text-xs uppercase tracking-wider font-semibold bg-clip-text text-transparent bg-gradient-to-r from-muted-foreground to-secondary/80">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 md:px-8 pb-8">
        <div className="relative bg-gradient-to-br from-secondary/20 to-primary/10 border border-secondary/20 rounded-3xl p-10 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,216,0.1),transparent_70%)] pointer-events-none" />
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4 relative z-10">
            Sẵn sàng khám phá<br className="hidden md:block" /> con đường IT của bạn?
          </h2>
          <p className="text-muted-foreground mb-8 relative z-10">Miễn phí · 3 phút · Kết quả ngay lập tức</p>
          <Button
            onClick={() => navigate("/test/quiz")}
            className="relative z-10 h-14 px-12 text-base font-bold rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_30px_rgba(0,180,216,0.4)] hover:shadow-[0_0_50px_rgba(0,180,216,0.6)] transition-all duration-300 gap-3"
          >
            <Play className="w-5 h-5 fill-current" />
            Bắt Đầu Làm Test Ngay
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
