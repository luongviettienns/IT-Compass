import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Server, Database, Brain, Shield, ChevronRight } from "lucide-react";

const majors = [
  { icon: Monitor, title: "Frontend", desc: "Xây dựng giao diện người dùng và trải nghiệm Web." },
  { icon: Server, title: "Backend", desc: "Phát triển logic phía Server và API cho ứng dụng." },
  { icon: Database, title: "Data Science", desc: "Phân tích dữ liệu phức tạp giúp doanh nghiệp ra quyết định." },
  { icon: Brain, title: "Artificial Intelligence", desc: "Tạo ra các hệ thống thông minh, tự động hóa và dự đoán." },
  { icon: Shield, title: "Cybersecurity", desc: "Bảo vệ hệ thống, mạng internet và phần mềm khỏi các cuộc tấn công." },
];

export function ITMajorsGrid() {
  return (
    <section id="majors" className="py-24 bg-primary/5">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Khám Phá Chuyên Ngành IT
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tìm môn chuyên ngành phù hợp hoàn hảo với sở thích và thế mạnh của bạn.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {majors.map((major, i) => (
            <Card key={i} className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 border-border/50 transition-all duration-300 bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                  <major.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{major.title}</h3>
                <p className="text-muted-foreground mb-6 h-12">
                  {major.desc}
                </p>
                <div className="flex items-center text-sm font-semibold text-secondary group-hover:gap-2 transition-all">
                  Xem Chi Tiết <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
