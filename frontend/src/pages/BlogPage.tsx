import { Eye, Heart, Clock, Tag, ArrowRight, Search, TrendingUp, Bookmark } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useState } from "react";

const blogPosts = [
  {
    id: 1,
    title: "Frontend vs Backend: Bạn Hợp Với Vai Trò Nào?",
    excerpt: "Khám phá sự khác biệt cốt lõi và tìm ra con đường phù hợp nhất với tư duy và phong cách làm việc của bạn trong thế giới lập trình.",
    tag: "Định Hướng",
    tagColor: "text-blue-600 bg-blue-500/15 border-blue-400/40",
    cardBg: "bg-blue-500/[0.06] border-blue-400/30",
    stripe: "from-blue-500 to-blue-400",
    date: "26 Tháng 3, 2025",
    readTime: "5 phút đọc",
    views: 12400,
    likes: 832,
    featured: true,
    gradient: "from-blue-500/20 via-primary/10 to-transparent",
  },
  {
    id: 2,
    title: "Lộ Trình Self-Taught Developer 2025: Từ Zero Đến Junior",
    excerpt: "Hành trình trở thành lập trình viên tự học không còn mơ hồ nữa. Lộ trình rõ ràng, nguồn tài nguyên chất lượng cao và mốc thời gian thực tế.",
    tag: "Lộ Trình",
    tagColor: "text-green-600 bg-green-500/15 border-green-400/40",
    cardBg: "bg-green-500/[0.06] border-green-400/30",
    stripe: "from-green-500 to-emerald-400",
    date: "22 Tháng 3, 2025",
    readTime: "10 phút đọc",
    views: 9800,
    likes: 671,
    featured: false,
    gradient: "from-green-500/20 via-primary/10 to-transparent",
  },
  {
    id: 3,
    title: "AI Đang Thay Đổi Ngành IT Như Thế Nào? Cơ Hội & Thách Thức",
    excerpt: "Trí tuệ nhân tạo không phải là mối đe dọa, mà là công cụ mạnh mẽ nhất trong tay người lập trình viên biết tận dụng nó đúng cách.",
    tag: "AI & Công Nghệ",
    tagColor: "text-purple-600 bg-purple-500/15 border-purple-400/40",
    cardBg: "bg-purple-500/[0.06] border-purple-400/30",
    stripe: "from-purple-500 to-violet-400",
    date: "18 Tháng 3, 2025",
    readTime: "7 phút đọc",
    views: 21300,
    likes: 1204,
    featured: false,
    gradient: "from-purple-500/20 via-primary/10 to-transparent",
  },
  {
    id: 4,
    title: "Portfolio IT Đỉnh Cao: Bí Kíp Gây Ấn Tượng Nhà Tuyển Dụng",
    excerpt: "Xây dựng portfolio không chỉ là trưng bày code. Đây là nghệ thuật kể câu chuyện về bản thân để mở ra cánh cửa sự nghiệp đầu tiên của bạn.",
    tag: "Sự Nghiệp",
    tagColor: "text-orange-600 bg-orange-500/15 border-orange-400/40",
    cardBg: "bg-orange-500/[0.06] border-orange-400/30",
    stripe: "from-orange-500 to-amber-400",
    date: "14 Tháng 3, 2025",
    readTime: "8 phút đọc",
    views: 7600,
    likes: 489,
    featured: false,
    gradient: "from-orange-500/20 via-primary/10 to-transparent",
  },
  {
    id: 5,
    title: "Phỏng Vấn Kỹ Thuật: Cách Vượt Qua Coding Interview Tại Các Công Ty Lớn",
    excerpt: "Từ LeetCode đến System Design, đây là chiến lược toàn diện để bạn tự tin bước vào phòng phỏng vấn kỹ thuật và ghi điểm tuyệt đối.",
    tag: "Phỏng Vấn",
    tagColor: "text-red-600 bg-red-500/15 border-red-400/40",
    cardBg: "bg-red-500/[0.06] border-red-400/30",
    stripe: "from-red-500 to-rose-400",
    date: "10 Tháng 3, 2025",
    readTime: "12 phút đọc",
    views: 15900,
    likes: 1037,
    featured: false,
    gradient: "from-red-500/20 via-primary/10 to-transparent",
  },
  {
    id: 6,
    title: "Data Science vs Machine Learning: Đâu Là Sự Khác Biệt?",
    excerpt: "Hai lĩnh vực nghe có vẻ giống nhau nhưng lại hoàn toàn khác nhau về kỹ năng, công cụ và hướng phát triển sự nghiệp. Tìm hiểu để chọn đúng hướng đi.",
    tag: "AI & Công Nghệ",
    tagColor: "text-purple-600 bg-purple-500/15 border-purple-400/40",
    cardBg: "bg-purple-500/[0.06] border-purple-400/30",
    stripe: "from-purple-500 to-violet-400",
    date: "5 Tháng 3, 2025",
    readTime: "6 phút đọc",
    views: 8200,
    likes: 563,
    featured: false,
    gradient: "from-purple-500/20 via-primary/10 to-transparent",
  },
];

const filterTabs = ["Tất Cả", "Định Hướng", "Lộ Trình", "AI & Công Nghệ", "Sự Nghiệp", "Phỏng Vấn"];

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

export function BlogPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Tất Cả");
  const [liked, setLiked] = useState<number[]>([]);

  const toggleLike = (id: number) =>
    setLiked((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);

  const filtered = blogPosts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "Tất Cả" || p.tag === activeTab;
    return matchSearch && matchTab;
  });

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="pt-20 pb-32 min-h-screen">
      {/* Page Hero */}
      <section className="relative bg-gradient-to-b from-primary/20 to-background py-16 mb-12 border-b overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,180,216,0.1),transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 px-4 py-2 rounded-full text-secondary font-semibold text-sm mb-6">
            <TrendingUp className="w-4 h-4" />
            Nội dung mới nhất & hot nhất
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-secondary/80">
            Blog IT Compass
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kiến thức công nghệ, lộ trình nghề nghiệp và thông tin tuyển dụng dành riêng cho cộng đồng IT Việt Nam.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8">
        {/* Search & Tags */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-10">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-secondary text-secondary-foreground border-secondary shadow-md"
                    : "bg-background border-border text-muted-foreground hover:border-secondary hover:text-secondary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm bài viết..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Featured Card */}
        {featured && (
          <div className="group relative rounded-3xl overflow-hidden border border-border/50 hover:border-secondary/50 hover:shadow-[0_0_40px_-10px_rgba(0,180,216,0.3)] transition-all duration-500 mb-10 bg-card/60 backdrop-blur-sm cursor-pointer">
            <div className={`absolute inset-0 bg-gradient-to-br ${featured.gradient} opacity-40 pointer-events-none`} />
            <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
              <div className="flex-1">
                {/* Tags row - now in normal flow, not absolute */}
                <div className="flex items-center gap-2 mb-5">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${featured.tagColor}`}>
                    <Tag className="inline w-3 h-3 mr-1" />{featured.tag}
                  </span>
                  <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow">✨ Nổi Bật</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-4 group-hover:text-secondary transition-colors duration-300 leading-tight">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6 max-w-xl">{featured.excerpt}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" />{featured.readTime}</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-secondary" />{formatNumber(featured.views)} lượt xem</span>
                  <button
                    onClick={() => toggleLike(featured.id)}
                    className={`flex items-center gap-1.5 transition-colors ${liked.includes(featured.id) ? "text-red-500" : ""}`}
                  >
                    <Heart className={`w-4 h-4 ${liked.includes(featured.id) ? "fill-red-500 text-red-500" : "text-secondary"}`} />
                    {formatNumber(featured.likes + (liked.includes(featured.id) ? 1 : 0))} lượt thích
                  </button>
                  <span className="text-xs">{featured.date}</span>
                </div>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-6 group-hover:shadow-lg transition-all">
                  Đọc Ngay <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {rest.map((post) => (
            <div
              key={post.id}
              className={`group relative flex flex-col border hover:shadow-[0_0_30px_-8px_rgba(0,180,216,0.25)] transition-all duration-500 rounded-2xl overflow-hidden hover:-translate-y-1.5 cursor-pointer backdrop-blur-sm ${post.cardBg}`}
            >
              {/* Colored gradient stripe at top */}
              <div className={`h-2 w-full bg-gradient-to-r ${post.stripe}`} />
              
              {/* Subtle glow blob matching card color */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-8 -mt-8 opacity-30 pointer-events-none bg-current" style={{color: 'inherit'}} />

              <div className="p-6 flex flex-col flex-1 relative z-10">
                {/* Tag + Bookmark */}
                <div className="flex justify-between items-start mb-5">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${post.tagColor}`}>
                    <Tag className="inline w-3 h-3 mr-1" />{post.tag}
                  </span>
                  <button className="text-muted-foreground hover:text-secondary transition-colors p-1 rounded-md hover:bg-secondary/10">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-3 leading-snug group-hover:text-secondary transition-colors duration-300 flex-1">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">{post.excerpt}</p>

                {/* Meta */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-secondary" />
                        {post.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-secondary" />
                        {formatNumber(post.views)}
                      </span>
                      <button
                        onClick={() => toggleLike(post.id)}
                        className="flex items-center gap-1 transition-colors group/like"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-all duration-200 ${
                            liked.includes(post.id)
                              ? "fill-red-500 text-red-500 scale-125"
                              : "text-secondary group-hover/like:text-red-400"
                          }`}
                        />
                        <span className={liked.includes(post.id) ? "text-red-500" : ""}>
                          {formatNumber(post.likes + (liked.includes(post.id) ? 1 : 0))}
                        </span>
                      </button>
                    </div>
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground text-xl font-semibold">Không tìm thấy bài viết nào.</p>
            <p className="text-muted-foreground mt-2 text-sm">Thử thay đổi từ khóa hoặc bộ lọc danh mục.</p>
          </div>
        )}
      </div>
    </div>
  );
}
