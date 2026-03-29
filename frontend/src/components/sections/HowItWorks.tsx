import { ClipboardCheck, Sparkles, MapPin } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: ClipboardCheck,
    title: "Làm Bài Test",
    desc: "Bài đánh giá nhanh trong 3 phút để hiểu rõ tính cách và kỹ năng công nghệ của bạn."
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Nhận Kết Quả",
    desc: "Khám phá ngay các chuyên ngành IT phù hợp nhất cùng phân tích chi tiết."
  },
  {
    num: "03",
    icon: MapPin,
    title: "Theo Lộ Trình",
    desc: "Truy cập lộ trình học tập từng bước để làm chủ lĩnh vực bạn chọn."
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-background border-t">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Cách Thức Hoạt Động
          </h2>
          <p className="text-lg text-muted-foreground">
            Hành trình đến với sự nghiệp IT chỉ qua 3 bước đơn giản.
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (visible on md+) */}
          <div className="hidden md:block absolute top-12 left-24 right-24 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary" />
          
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:border-secondary transition-all">
                  <step.icon className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Bước {step.num}: <br/> {step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
