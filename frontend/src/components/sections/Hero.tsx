import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Code, Database, Shield, Smartphone, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/30 to-background pt-24 pb-32">
      <div className="container mx-auto px-4 md:px-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary/10 text-secondary mb-8">
          Nền Tảng Hướng Nghiệp IT Số 1
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mb-6">
          Chuyên ngành IT nào sinh ra dành cho bạn?
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
          Khám phá chuyên ngành IT và lộ trình học tập lý tưởng của bạn chỉ trong 3 phút qua bài đánh giá năng lực và tính cách chính xác.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:brightness-110 transition-all text-base px-8 py-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Làm Bài Test
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-base px-8 py-6 border-secondary/20 hover:bg-secondary/5 transition-all"
            onClick={() => navigate('/majors')}
          >
            Tìm Hiểu Ngành
          </Button>
        </div>
        
        <div className="mt-16 w-full max-w-4xl mx-auto relative group perspective-1000">
          {/* Subtle Glow Behind the entire board */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-500"></div>
          
          <div className="relative aspect-video rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden flex items-center justify-center">
            
            {/* Grid / Radar background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            
            {/* Concentric Circles for "Radar" effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-full border border-secondary/20 animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] md:w-[600px] h-[450px] md:h-[600px] rounded-full border border-primary/20 animate-[spin_30s_linear_infinite_reverse]"></div>
            
            {/* Floating tech elements */}
            <div className="absolute top-1/4 left-[10%] bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl p-4 animate-[bounce_4s_infinite] shadow-secondary/20 hidden sm:block">
              <Code className="w-8 h-8 text-secondary" />
            </div>
            <div className="absolute bottom-1/4 right-[10%] bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl p-4 animate-[bounce_5s_infinite_reverse] shadow-primary/20 hidden sm:block">
              <Database className="w-8 h-8 text-primary" />
            </div>
            
            <div className="absolute top-[20%] right-[15%] bg-background/90 backdrop-blur-sm border border-border/50 px-5 py-2.5 rounded-full font-bold text-sm shadow-xl text-foreground/80 animate-[pulse_4s_ease-in-out_infinite] hidden md:block z-10">
              AI & Data Science
            </div>
            <div className="absolute bottom-[20%] left-[15%] bg-background/90 backdrop-blur-sm border border-border/50 px-5 py-2.5 rounded-full font-bold text-sm shadow-xl text-foreground/80 animate-[pulse_5s_ease-in-out_infinite_reverse] hidden md:block z-10">
              Cloud & DevOps
            </div>

            {/* Additional Floating Elements */}
            <div className="absolute top-[10%] left-[30%] bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-xl p-3 animate-[bounce_6s_infinite] shadow-secondary/10 hidden lg:block opacity-90 delay-75">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div className="absolute bottom-[10%] right-[30%] bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-xl p-3 animate-[bounce_7s_infinite_reverse] shadow-primary/10 hidden lg:block opacity-90 delay-150">
              <Smartphone className="w-6 h-6 text-purple-500" />
            </div>
            <div className="absolute top-[40%] right-[6%] bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-xl p-3 animate-[bounce_5.5s_infinite] shadow-secondary/10 hidden lg:block opacity-90 delay-300">
              <Palette className="w-6 h-6 text-pink-500" />
            </div>

            <div className="absolute top-[60%] left-[6%] bg-background/90 backdrop-blur-sm border border-border/50 px-4 py-2 rounded-full font-semibold text-xs shadow-xl text-foreground/70 animate-[pulse_6s_ease-in-out_infinite] hidden lg:block opacity-80 delay-200">
              Frontend & UI
            </div>
            <div className="absolute bottom-[10%] left-[45%] bg-background/90 backdrop-blur-sm border border-border/50 px-4 py-2 rounded-full font-semibold text-xs shadow-xl text-foreground/70 animate-[pulse_7.5s_ease-in-out_infinite_reverse] hidden xl:block opacity-80 delay-500">
              Backend Systems
            </div>
            <div className="absolute top-[15%] right-[45%] bg-background/90 backdrop-blur-sm border border-border/50 px-4 py-2 rounded-full font-semibold text-xs shadow-xl text-foreground/70 animate-[pulse_4.5s_ease-in-out_infinite] hidden xl:block opacity-80 delay-700">
              Cyber Security
            </div>

            {/* Center Brand Identity */}
            <div className="relative z-10 flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary via-secondary to-primary p-[3px] mb-8 shadow-2xl shadow-secondary/40 animate-[spin_10s_linear_infinite]">
                <div className="w-full h-full bg-card rounded-full flex items-center justify-center relative overflow-hidden animate-[spin_10s_linear_infinite_reverse]">
                  <div className="absolute inset-0 bg-secondary/5"></div>
                  <Compass className="h-14 w-14 text-secondary object-center" />
                </div>
              </div>
              
              <div className="text-center relative">
                <div className="absolute -inset-4 bg-secondary/10 blur-2xl rounded-full"></div>
                <h2 className="relative text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-secondary/80 drop-shadow-sm mb-2">
                  IT COMPASS
                </h2>
                <p className="relative text-secondary font-bold tracking-[0.3em] uppercase text-sm md:text-base">
                  La Bàn Nghề Nghiệp
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
