import { useState } from "react";
import { Search, Monitor, Server, Database, Brain, Shield, Cloud, Smartphone, Palette } from "lucide-react";
import { Button } from "../components/ui/button";

// Note: Shadcn Badge and Input are being installed but we can use native elements styled with tailwind in the meantime if they error, 
// though we expect them to be available shortly.
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

const majorsData = [
  {
    category: "Lập Trình",
    icon: Monitor,
    title: "Frontend Developer",
    desc: "Xây dựng giao diện người dùng, chịu trách nhiệm cho những gì người dùng cuối nhìn thấy và tương tác trực tiếp trên Website.",
    skills: ["React", "Vue", "TypeScript", "Tailwind"],
    salary: "15 - 35 Triệu/tháng",
  },
  {
    category: "Lập Trình",
    icon: Server,
    title: "Backend Developer",
    desc: "Phát triển logic hệ thống, quản lý cơ sở dữ liệu và xây dựng các API giúp ứng dụng vận hành trơn tru ở phía máy chủ.",
    skills: ["Node.js", "Java", "Python", "SQL"],
    salary: "18 - 40 Triệu/tháng",
  },
  {
    category: "Lập Trình",
    icon: Smartphone,
    title: "Mobile Developer",
    desc: "Sáng tạo và phát triển các ứng dụng dành riêng cho thiết bị di động trên hệ điều hành iOS hoặc Android.",
    skills: ["Flutter", "React Native", "Swift", "Kotlin"],
    salary: "15 - 35 Triệu/tháng",
  },
  {
    category: "Dữ Liệu & AI",
    icon: Database,
    title: "Data Analyst",
    desc: "Phân tích, xử lý và làm sạch dữ liệu để biến chúng thành các báo cáo có giá trị giúp doanh nghiệp ra quyết định.",
    skills: ["SQL", "Python", "PowerBI", "Excel"],
    salary: "15 - 30 Triệu/tháng",
  },
  {
    category: "Dữ Liệu & AI",
    icon: Brain,
    title: "AI/Machine Learning",
    desc: "Xây dựng và huấn luyện các mô hình dự đoán, trí tuệ nhân tạo để tự động hóa các bài toán phức tạp.",
    skills: ["Python", "TensorFlow", "Math", "Algorithms"],
    salary: "25 - 60 Triệu/tháng",
  },
  {
    category: "Hệ Thống",
    icon: Cloud,
    title: "DevOps Engineer",
    desc: "Tự động hóa quy trình phát triển và vận hành (CI/CD), quản trị hạ tầng máy chủ đám mây (Cloud).",
    skills: ["Docker", "Kubernetes", "AWS", "Linux"],
    salary: "25 - 50 Triệu/tháng",
  },
  {
    category: "Hệ Thống",
    icon: Shield,
    title: "Cybersecurity Analyst",
    desc: "Bảo vệ an toàn thông tin, theo dõi và ngăn chặn các cuộc tấn công mạng, tìm kiếm và vá các lỗ hổng bảo mật.",
    skills: ["Networking", "Kali Linux", "Security", "CEH"],
    salary: "20 - 45 Triệu/tháng",
  },
  {
    category: "Thiết Kế",
    icon: Palette,
    title: "UI/UX Designer",
    desc: "Nghiên cứu hành vi người dùng và thiết kế nên các giao diện đảm bảo tính thẩm mỹ, dễ sử dụng và tối ưu trải nghiệm.",
    skills: ["Figma", "Wireframing", "Prototyping", "User Research"],
    salary: "12 - 30 Triệu/tháng",
  }
];

const categories = ["Tất Cả", "Lập Trình", "Dữ Liệu & AI", "Hệ Thống", "Thiết Kế"];

export function MajorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất Cả");

  const filteredMajors = majorsData.filter((major) => {
    const matchesSearch = major.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          major.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tất Cả" || major.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-24 pb-32">
      {/* Hero Section of Majors Page */}
      <section className="bg-gradient-to-b from-primary/20 to-background py-16 mb-12 border-b">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Khám Phá Các Chuyên Ngành IT
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tìm hiểu chi tiết về các vị trí công việc, kỹ năng yêu cầu và định hướng nghề nghiệp trong ngành Công Nghệ Thông Tin.
          </p>
        </div>
      </section>

      {/* Filter and Search */}
      <section className="container mx-auto px-4 md:px-8 mb-12">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-card p-6 rounded-2xl shadow-sm border">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button 
                key={cat} 
                variant={selectedCategory === cat ? "default" : "outline"}
                className={selectedCategory === cat ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : ""}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Tìm kiếm chuyên ngành, kỹ năng..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Majors Grid */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMajors.length > 0 ? (
            filteredMajors.map((major, i) => (
              <div 
                key={i} 
                className="group relative flex flex-col bg-card/60 backdrop-blur-sm border border-border/50 hover:border-secondary/50 hover:shadow-[0_0_30px_-5px_rgba(0,180,216,0.2)] transition-all duration-500 rounded-2xl overflow-hidden hover:-translate-y-2"
              >
                {/* Decorative Glowing Blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-700 group-hover:bg-secondary/20 group-hover:scale-150"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -ml-10 -mb-10 transition-all duration-700 group-hover:bg-primary/20 group-hover:scale-150"></div>

                <div className="p-8 flex-1 flex flex-col relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="relative">
                      {/* Icon Base */}
                      <div className="absolute inset-0 bg-secondary/20 rounded-xl blur-lg scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-background to-primary/20 border border-primary/20 flex items-center justify-center relative shadow-inner group-hover:rotate-6 transition-transform duration-500">
                        <major.icon className="h-8 w-8 text-secondary" strokeWidth={1.5} />
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-md border-secondary/30 text-secondary hover:bg-secondary hover:text-secondary-foreground font-semibold px-3 py-1 shadow-sm transition-colors">
                      {major.category}
                    </Badge>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-secondary transition-colors duration-300">
                    {major.title}
                  </h3>
                  
                  <p className="text-muted-foreground/90 mb-8 flex-1 leading-relaxed">
                    {major.desc}
                  </p>
                  
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-widest font-bold mb-3 text-secondary/80">Kỹ Năng Cốt Lõi:</p>
                    <div className="flex flex-wrap gap-2">
                      {major.skills.map(skill => (
                        <span key={skill} className="text-xs font-medium bg-background border border-border/50 px-3 py-1.5 rounded-full text-foreground/80 shadow-sm group-hover:border-secondary/30 transition-colors">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-border/50 pt-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Mức Lương TB</p>
                      <p className="font-bold text-foreground text-lg">{major.salary}</p>
                    </div>
                    <Button variant="ghost" className="text-secondary hover:bg-secondary/10 hover:text-secondary px-4 transition-all group-hover:bg-secondary group-hover:text-secondary-foreground rounded-full">
                      Chi Tiết <span className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <h3 className="text-2xl font-semibold mb-2 text-muted-foreground">Không tìm thấy kết quả</h3>
              <p className="text-muted-foreground">Thử điều chỉnh từ khóa hoặc bộ lọc danh mục của bạn.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
