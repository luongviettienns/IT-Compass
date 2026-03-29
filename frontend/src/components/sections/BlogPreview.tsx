import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const articles = [
  { img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085", title: "Vì sao React là tương lai của UI", category: "Frontend" },
  { img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c", title: "Top 5 Backend Frameworks năm 2024", category: "Backend" },
  { img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71", title: "Bắt đầu với Data Science", category: "Data" }
];

export function BlogPreview() {
  return (
    <section id="blog" className="py-24 bg-background border-t">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Kiến Thức & Nguồn Tài Nguyên
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cập nhật các xu hướng và bài hướng dẫn mới nhất về công nghệ.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {articles.map((article, i) => (
            <Card key={i} className="overflow-hidden group hover:shadow-xl transition-all border-border/40">
              <div className="h-48 overflow-hidden">
                <img src={article.img} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <CardContent className="p-6">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">{article.category}</span>
                <h3 className="text-xl font-bold mb-4 group-hover:text-primary-foreground transition-colors">{article.title}</h3>
                <Button variant="link" className="p-0 text-secondary hover:text-secondary-foreground font-semibold">
                  Đọc Thêm
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center">
            <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all font-semibold">
                Xem Tất Cả Bài Viết
            </Button>
        </div>
      </div>
    </section>
  );
}
