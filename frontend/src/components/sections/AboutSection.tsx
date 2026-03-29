import { Code2, MonitorPlay, FileJson } from "lucide-react";

export function AboutSection() {
  return (
    <section className="py-24 bg-primary/5">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              IT Compass là gì?
            </h2>
            <p className="text-lg text-muted-foreground">
              IT Compass là "la bàn" chỉ đường giúp bạn định hướng trong thế giới Công Nghệ Thông Tin rộng lớn. Dù bạn là học sinh cấp 3, sinh viên năm nhất hay Junior Developer, chúng tôi sẽ giúp bạn khám phá chuyên ngành IT và con đường sự nghiệp hoàn hảo nhất với tính cách và kỹ năng của riêng bạn.
            </p>
          </div>
          <div className="flex-1 relative w-full aspect-square max-w-md mx-auto">
             {/* Background glowing effects */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/30 rounded-full blur-[80px]"></div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-[60px]"></div>
             <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-[60px]"></div>

             {/* Main Glassmorphic Card (Career Match) */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 bg-card/60 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 hover:scale-105 transition-transform duration-500 z-20">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary p-1">
                   <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
                     <MonitorPlay className="w-6 h-6 text-secondary" />
                   </div>
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground font-medium">Độ Phù Hợp</p>
                   <h4 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-secondary">Frontend Dev</h4>
                 </div>
                 <div className="ml-auto flex items-center justify-center w-12 h-12 rounded-full border-4 border-secondary/30">
                   <span className="text-sm font-bold text-secondary">98%</span>
                 </div>
               </div>
               <div className="space-y-3">
                 <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                   <div className="h-full bg-secondary w-[98%] rounded-full relative">
                     <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                   </div>
                 </div>
                 <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                   <div className="h-full bg-primary w-[80%] rounded-full"></div>
                 </div>
                 <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                   <div className="h-full bg-muted-foreground/30 w-[60%] rounded-full"></div>
                 </div>
               </div>
             </div>

             {/* Floating UI Elements */}
             <div className="absolute -top-4 -right-4 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-xl p-4 flex items-center gap-3 animate-[bounce_4s_infinite] z-30">
               <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                 <Code2 className="text-green-500 w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground font-medium">Kỹ năng tốt</p>
                 <p className="font-bold text-sm">React & TS</p>
               </div>
             </div>

             <div className="absolute -bottom-8 -left-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-xl p-4 flex items-center gap-3 animate-[bounce_5s_infinite_reverse] z-30">
               <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                 <FileJson className="text-blue-500 w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground font-medium">Phân tích tính cách</p>
                 <p className="font-bold text-sm">Sáng tạo, Logic</p>
               </div>
             </div>

             {/* Decorative Grid / Dots (Behind) */}
             <div className="absolute inset-x-0 inset-y-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-border/50 via-transparent to-transparent bg-[length:20px_20px] opacity-30 z-0 mask-image:linear-gradient(to_bottom,white,transparent)"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
