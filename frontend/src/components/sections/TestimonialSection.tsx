import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Nguyen",
    role: "Sinh Viên Năm Nhất",
    review: "IT Compass đã giúp tôi chuyển hướng từ Khoa học máy tính chung sang Web Development. Bây giờ tôi đã tự tin hơn rất nhiều!",
    avatar: "https://i.pravatar.cc/150?u=alex"
  },
  {
    name: "Mai Le",
    role: "Học Sinh Cấp 3",
    review: "Bài Test 3 phút thực sự chính xác đáng kinh ngạc. Nó gợi ý Data Science dựa trên khả năng phân tích của tôi, và tôi đang theo đuổi nó.",
    avatar: "https://i.pravatar.cc/150?u=mai"
  },
  {
    name: "Kevin Tran",
    role: "Junior Developer",
    review: "Tôi từng lạc lối khi chọn giữa Backend và DevOps. Lộ trình của IT Compass đã làm mọi thứ trở nên rõ ràng hơn bao giờ hết.",
    avatar: "https://i.pravatar.cc/150?u=kevin"
  }
];

export function TestimonialSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Người Dùng Nói Gì Về Chúng Tôi
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cùng hàng ngàn học sinh và lập trình viên đã tìm thấy đam mê thực sự trong ngành công nghệ với IT Compass.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 relative z-10 pt-10">
          {/* Decorative glowing background for the section */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-secondary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          {testimonials.map((t, i) => (
            <div 
              key={i} 
              className={`group relative perspective-1000 ${i === 1 ? 'md:-translate-y-8' : ''}`}
            >
              {/* Glowing backing on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-2xl blur opacity-0 group-hover:opacity-40 transition duration-500"></div>
              
              <Card className="relative h-full border-white/10 border bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group-hover:-translate-y-2 group-hover:border-secondary/30">
                <div className="absolute -top-4 -right-4 text-secondary/5 group-hover:text-secondary/20 transition-colors duration-500 rotate-12 z-0">
                  <Quote size={140} className="fill-current stroke-[0.5]" />
                </div>
                
                <CardContent className="p-8 flex flex-col h-full relative z-10">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-5 h-5 fill-secondary/80 text-secondary/80 drop-shadow-sm group-hover:fill-secondary group-hover:text-secondary transition-colors" />
                    ))}
                  </div>
                  
                  <p className="text-foreground/90 leading-relaxed mb-8 flex-1 font-medium relative italic">
                    <span className="text-5xl text-secondary absolute -left-5 -top-4 font-serif opacity-30 leading-none">"</span>
                    {t.review}
                  </p>
                  
                  <div className="bg-background/50 backdrop-blur-sm p-4 rounded-xl flex items-center gap-4 mt-auto border border-white/5 group-hover:border-secondary/30 transition-colors shadow-inner">
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-primary to-secondary shadow-md group-hover:shadow-secondary/30 transition-shadow">
                      <div className="w-full h-full rounded-full border-2 border-background overflow-hidden relative">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay"></div>
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
      </div>
    </section>
  );
}
