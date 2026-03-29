import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Target, Map } from "lucide-react";

const values = [
  {
    icon: Zap,
    title: "Nhanh Chóng & Chính Xác",
    description: "Hoàn thành bài kiểm tra chuyên sâu dưới 3 phút để tìm ra định hướng công nghệ phù hợp nhất."
  },
  {
    icon: Target,
    title: "Gợi Ý Cá Nhân Hóa",
    description: "Nhận đề xuất lộ trình nghề nghiệp được tinh chỉnh dựa trên thế mạnh riêng của bạn."
  },
  {
    icon: Map,
    title: "Lộ Trình Học Tập Rõ Ràng",
    description: "Hướng dẫn từng bước từ con số 0 đến khi sẵn sàng làm việc trong lĩnh vực bạn chọn."
  }
];

export function ValueSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((v, i) => (
            <Card key={i} className="h-full border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group bg-card">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <v.icon className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-xl">{v.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{v.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
