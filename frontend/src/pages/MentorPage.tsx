import { useState, useMemo } from "react";
import { 
  Star, 
  Calendar, 
  BadgeCheck, 
  Search, 
  ChevronDown,
  X,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";

const mentors = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    role: "Senior Fullstack Developer @ Google",
    expertise: ["React", "Node.js", "System Design"],
    rating: 4.9,
    reviews: 124,
    experience: 10,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256", // Bạn có thể thay bằng đường dẫn: "/assets/mentors/nguyen-van-a.jpg"
    verified: true,
    price: "500.000đ",
  },
  {
    id: 2,
    name: "Trần Thị B",
    role: "AI Engineer @ VinAI",
    expertise: ["Python", "Machine Learning", "PyTorch"],
    rating: 4.8,
    reviews: 89,
    experience: 6,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256",
    verified: true,
    price: "450.000đ",
  },
  {
    id: 3,
    name: "Lê Văn C",
    role: "DevOps Architect @ Amazon",
    expertise: ["AWS", "Kubernetes", "CI/CD"],
    rating: 5.0,
    reviews: 56,
    experience: 8,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256&h=256",
    verified: true,
    price: "600.000đ",
  },
  {
    id: 4,
    name: "Phạm Minh D",
    role: "Product Manager @ Shopee",
    expertise: ["Product Strategy", "Agile", "User Research"],
    rating: 4.7,
    reviews: 72,
    experience: 5,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256&h=256",
    verified: false,
    price: "400.000đ",
  },
  {
    id: 5,
    name: "Hoàng Anh E",
    role: "Frontend Lead @ TikTok",
    expertise: ["React", "TypeScript", "Performance"],
    rating: 4.9,
    reviews: 45,
    experience: 7,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256&h=256",
    verified: true,
    price: "550.000đ",
  },
  {
    id: 6,
    name: "Ngô Quốc F",
    role: "Backend Engineer @ Grab",
    expertise: ["Go", "Microservices", "Redis"],
    rating: 4.6,
    reviews: 32,
    experience: 4,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
    verified: true,
    price: "350.000đ",
  },
];

const allExpertise = Array.from(new Set(mentors.flatMap(m => m.expertise))).sort();

export function MentorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           mentor.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesExpertise = selectedExpertise.length === 0 || 
                              selectedExpertise.some(exp => mentor.expertise.includes(exp));
      const matchesExperience = mentor.experience >= minExperience;
      
      return matchesSearch && matchesExpertise && matchesExperience;
    });
  }, [searchQuery, selectedExpertise, minExperience]);

  const toggleExpertise = (exp: string) => {
    setSelectedExpertise(prev => 
      prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedExpertise([]);
    setMinExperience(0);
  };

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/5 via-background to-background">
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        
        {/* Experimental Hero Section */}
        <div className="relative pt-12 pb-16 text-center space-y-6 overflow-hidden">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-bold text-xs uppercase tracking-wider animate-bounce-subtle">
            <Sparkles className="w-4 h-4" />
            Nâng tầm sự nghiệp cùng chuyên gia
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Tìm Kiếm <span className="text-secondary italic underline decoration-wavy underline-offset-8 decoration-secondary/30">Mentor</span> <br className="hidden md:block" /> Của Bạn
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Kết nối trực tiếp 1-1 với những người dẫn đầu trong ngành công nghệ để bứt phá giới hạn bản thân.
          </p>
          
          {/* Decorative background blurs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-96 bg-secondary/10 rounded-full blur-[120px] -z-10" />
        </div>

        {/* Filter Bar Section */}
        <div className="sticky top-20 z-40 mb-12">
          <div className="bg-background/60 backdrop-blur-2xl border border-border/50 rounded-[2rem] p-3 shadow-2xl shadow-secondary/5 flex flex-col md:row items-stretch gap-3">
            <div className="flex flex-col md:flex-row gap-3 w-full">
                {/* Search Input */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên mentor hoặc vị trí..."
                        className="w-full pl-12 pr-4 py-4 bg-muted/30 border-none rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:bg-muted/50 transition-all font-medium outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filter Toggle (Mobile) / Expanded Filters (Desktop) */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2 border border-border/50 transition-all ${showFilters ? 'bg-secondary text-secondary-foreground' : 'bg-background hover:bg-muted'}`}
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        Bộ lọc
                        {(selectedExpertise.length > 0 || minExperience > 0) && (
                            <span className="bg-foreground text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center ml-1">
                                {(selectedExpertise.length > 0 ? 1 : 0) + (minExperience > 0 ? 1 : 0)}
                            </span>
                        )}
                    </button>
                    { (searchQuery || selectedExpertise.length > 0 || minExperience > 0) && (
                        <button 
                            onClick={clearFilters}
                            className="p-4 rounded-2xl bg-muted/50 hover:bg-red-500/10 hover:text-red-500 transition-all text-muted-foreground"
                            title="Xóa bộ lọc"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="p-4 pt-2 border-t border-border/30 mt-2 space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-3">
                        <label className="text-sm font-bold flex items-center gap-2">
                            <ChevronDown className="w-4 h-4 text-secondary" />
                            Lĩnh vực chuyên môn
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {allExpertise.map(exp => (
                                <button
                                    key={exp}
                                    onClick={() => toggleExpertise(exp)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                        selectedExpertise.includes(exp) 
                                        ? 'bg-secondary/20 border-secondary text-secondary shadow-lg shadow-secondary/10' 
                                        : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                                    }`}
                                >
                                    {exp}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border/50 shadow-inner">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-secondary" />
                                Kinh nghiệm tối thiểu
                            </label>
                            <div className="text-right">
                                <span className="text-2xl font-black text-secondary">{minExperience}</span>
                                <span className="text-sm font-bold text-muted-foreground ml-1">năm+</span>
                            </div>
                        </div>
                        <div className="relative pt-2 pb-1">
                            {/* Track background */}
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-3 bg-muted rounded-full overflow-hidden">
                                {/* Filled portion */}
                                <div 
                                    className="h-full bg-secondary transition-all duration-200"
                                    style={{ width: `${(minExperience / 15) * 100}%` }}
                                />
                            </div>
                            {/* The actual native input hidden but functional */}
                            <input
                                type="range"
                                min="0"
                                max="15"
                                step="1"
                                value={minExperience}
                                onChange={(e) => setMinExperience(parseInt(e.target.value))}
                                className="w-full h-3 appearance-none cursor-pointer bg-transparent relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-[4px] [&::-webkit-slider-thumb]:border-secondary [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-95 [&::-webkit-slider-thumb]:transition-transform"
                            />
                        </div>
                        <div className="flex justify-between text-xs font-bold text-muted-foreground px-1 uppercase tracking-wider">
                            <span>Mới bắt đầu</span>
                            <span>Chuyên gia (15+)</span>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-8 flex justify-between items-center">
            <p className="text-muted-foreground font-medium">
                Tìm thấy <span className="text-foreground font-bold">{filteredMentors.length}</span> mentor phù hợp
            </p>
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sắp xếp:</span>
                <select className="bg-transparent font-bold text-sm outline-none cursor-pointer">
                    <option>Phổ biến nhất</option>
                    <option>Đánh giá cao</option>
                    <option>Kinh nghiệm</option>
                </select>
            </div>
        </div>

        {/* Mentor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 lg:gap-y-20 pt-8 lg:pt-12">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.id}
              className="group relative bg-card rounded-[2.5rem] p-1 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-secondary/20 flex flex-col h-full mt-16 lg:mt-20"
            >
              {/* Animated border gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-border/50 via-border/10 to-border/50 rounded-[2.5rem] group-hover:from-primary/40 group-hover:via-secondary/40 group-hover:to-primary/40 transition-colors duration-500 -z-10" />
              
              <div className="bg-background/90 backdrop-blur-xl rounded-[2.4rem] p-6 lg:p-8 flex flex-col h-full relative">
                {/* Decorative blob constrained to inner bounds */}
                <div className="absolute inset-0 rounded-[2.4rem] overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 group-hover:scale-150 transition-all duration-700" />
                </div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                    {/* Avatar popping out */}
                    <div className="relative -mt-12 lg:-mt-14">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl overflow-hidden bg-background p-1.5 shadow-xl border border-border/50 group-hover:scale-105 transition-transform duration-500">
                            <img
                            src={mentor.avatar}
                            alt={mentor.name}
                            className="w-full h-full object-cover rounded-2xl bg-muted"
                            />
                        </div>
                        {mentor.verified && (
                            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-lg border border-border/50">
                                <BadgeCheck className="w-5 h-5 lg:w-6 lg:h-6 text-secondary fill-secondary/10" />
                            </div>
                        )}
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-1.5 bg-background shadow-md px-3 py-1.5 rounded-2xl border border-border/50">
                      <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                      <span className="text-sm font-black">{mentor.rating}</span>
                      <span className="text-[10px] text-muted-foreground font-bold border-l pl-2 border-border/50">
                        {mentor.reviews} reviews
                      </span>
                    </div>
                </div>

                <div className="space-y-5 flex-1 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black group-hover:text-secondary transition-colors line-clamp-1">
                      {mentor.name}
                    </h3>
                    <p className="text-sm font-bold text-muted-foreground mt-1 line-clamp-1">{mentor.role}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {mentor.expertise.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-3 py-1.5 rounded-full bg-secondary/5 border border-secondary/20 font-bold text-secondary group-hover:bg-secondary/10 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-5 border-y border-dashed border-border/50">
                      <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Kinh nghiệm</p>
                          <p className="text-base font-black italic">{mentor.experience} năm+</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chi phí</p>
                          <p className="text-base font-black text-secondary italic">{mentor.price}/h</p>
                      </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3 relative z-10">
                  <button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300 active:scale-[0.98]">
                    Đăng Ký Tư Vấn Ngay
                  </button>
                  <button className="w-full py-4 rounded-2xl border-2 border-border/50 bg-background font-black text-sm hover:bg-muted/50 transition-all active:scale-[0.98]">
                    Xem Hồ Sơ Chi Tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredMentors.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/50">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                    <Search className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black">Không tìm thấy mentor phù hợp</h3>
                <p className="text-muted-foreground font-medium max-w-md mx-auto">
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để khám phá thêm nhiều chuyên gia khác.
                </p>
                <button onClick={clearFilters} className="text-secondary font-black hover:underline underline-offset-4 tracking-tight">
                    Xóa tất cả bộ lọc
                </button>
            </div>
          )}
        </div>

        {/* Help CTA */}
        <div className="mt-24 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary/50 via-primary/50 to-secondary/50 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative bg-background border border-border/50 p-12 rounded-[3rem] text-center space-y-8 overflow-hidden">
                <div className="space-y-4 relative z-10">
                    <h2 className="text-4xl font-black tracking-tight underline decoration-secondary decoration-4 underline-offset-8">Bạn vẫn chưa biết chọn ai?</h2>
                    <p className="text-muted-foreground text-lg font-medium max-w-xl mx-auto">
                        Đội ngũ IT Compass luôn sẵn sàng hỗ trợ bạn kết nối với mentor phù hợp nhất dựa trên mục tiêu kỹ năng và định hướng cá nhân.
                    </p>
                </div>
                <div className="flex flex-col sm:row items-center justify-center gap-4 relative z-10 font-black">
                    <button className="px-10 py-5 bg-secondary text-secondary-foreground rounded-2xl shadow-xl shadow-secondary/20 hover:scale-105 transition-transform">
                        Chat Với Tư Vấn Viên
                    </button>
                    <button className="px-10 py-5 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
                        Xem Hướng Dẫn
                    </button>
                </div>
                
                {/* Abstract shapes */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            </div>
        </div>
      </div>
    </div>
  );
}
