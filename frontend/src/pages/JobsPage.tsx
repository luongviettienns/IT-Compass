import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Briefcase, Clock, Building2, DollarSign,
  Bookmark, ChevronRight, SlidersHorizontal, Zap, Users, Star
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { jobsData, type Job } from "../data/jobs";

const categories = ["Tất Cả", "Frontend", "Backend", "AI/ML", "DevOps", "Mobile", "Security", "Data", "Design"];
const levels = ["Tất Cả cấp độ", "Junior", "Mid-level", "Senior"];
const locations = ["Tất Cả địa điểm", "Hà Nội", "TP. Hồ Chí Minh"];

export function JobsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất Cả");
  const [level, setLevel] = useState("Tất Cả cấp độ");
  const [location, setLocation] = useState("Tất Cả địa điểm");
  const [saved, setSaved] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const toggleSave = (id: number) =>
    setSaved((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const filtered = jobsData.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch = j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.tags.some(t => t.toLowerCase().includes(q));
    const matchCat = category === "Tất Cả" || j.category === category;
    const matchLevel = level === "Tất Cả cấp độ" || j.level === level;
    const matchLoc = location === "Tất Cả địa điểm" || j.location === location;
    return matchSearch && matchCat && matchLevel && matchLoc;
  });

  const featured = filtered.filter((j) => j.featured);
  const rest = filtered.filter((j) => !j.featured);

  return (
    <div className="pt-20 pb-32 min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/20 to-background py-16 mb-10 border-b overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,180,216,0.1),transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 px-4 py-2 rounded-full text-secondary font-semibold text-sm mb-6">
              <Zap className="w-4 h-4" />
              {jobsData.length} vị trí đang tuyển dụng
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-secondary/80">
              Việc Làm IT Hàng Đầu
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cơ hội việc làm chất lượng cao từ các công ty công nghệ hàng đầu Việt Nam và quốc tế.
            </p>
          </div>

          {/* Main Search */}
          <div className="max-w-3xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên công việc, công ty, kỹ năng..."
                className="pl-12 h-14 text-base rounded-2xl shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="h-14 px-5 rounded-2xl border-border hover:border-secondary gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-5 h-5" />
              Lọc
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="max-w-3xl mx-auto mt-4 bg-card border rounded-2xl p-5 grid md:grid-cols-2 gap-4 shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Cấp Độ</p>
                <div className="flex flex-wrap gap-2">
                  {levels.map((l) => (
                    <button key={l} onClick={() => setLevel(l)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${level === l ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:border-secondary hover:text-secondary"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Địa Điểm</p>
                <div className="flex flex-wrap gap-2">
                  {locations.map((lo) => (
                    <button key={lo} onClick={() => setLocation(lo)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${location === lo ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:border-secondary hover:text-secondary"}`}>
                      {lo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${category === cat ? "bg-secondary text-secondary-foreground border-secondary shadow-md" : "bg-background border-border text-muted-foreground hover:border-secondary hover:text-secondary"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Jobs */}
        {featured.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-4 h-4 text-secondary fill-secondary" />
              <h2 className="font-bold text-lg">Việc Làm Nổi Bật</h2>
              <span className="ml-auto text-sm text-muted-foreground">{featured.length} vị trí</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((job) => <JobCard key={job.id} job={job} saved={saved} onSave={toggleSave} onClick={() => navigate(`/jobs/${job.id}`)} />)}
            </div>
          </div>
        )}

        {/* All Jobs */}
        {rest.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-lg">Tất Cả Việc Làm</h2>
              <span className="ml-auto text-sm text-muted-foreground">{rest.length} vị trí</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((job) => <JobCard key={job.id} job={job} saved={saved} onSave={toggleSave} onClick={() => navigate(`/jobs/${job.id}`)} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-xl font-semibold">Không tìm thấy việc làm phù hợp</p>
            <p className="text-muted-foreground mt-2 text-sm">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, saved, onSave, onClick }: { job: Job; saved: number[]; onSave: (id: number) => void; onClick: () => void }) {
  const isSaved = saved.includes(job.id);
  return (
    <div onClick={onClick} className="group relative flex flex-col bg-card/70 backdrop-blur-sm border border-border/50 hover:border-secondary/40 hover:shadow-[0_0_30px_-10px_rgba(0,180,216,0.3)] transition-all duration-400 rounded-2xl overflow-hidden hover:-translate-y-1.5 cursor-pointer">
      <div className={`h-1.5 w-full ${job.featured ? "bg-gradient-to-r from-secondary to-primary" : "bg-gradient-to-r from-border to-border/30"}`} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl ${job.logoColor} flex items-center justify-center text-white font-black text-sm shadow-md`}>
              {job.logo}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight group-hover:text-secondary transition-colors duration-200">{job.title}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{job.company}</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSave(job.id); }}
            className={`p-2 rounded-lg transition-all ${isSaved ? "text-secondary bg-secondary/10" : "text-muted-foreground hover:text-secondary hover:bg-secondary/10"}`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-secondary" : ""}`} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-full text-muted-foreground"><MapPin className="w-3 h-3" />{job.location}</span>
          <span className="flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-full text-muted-foreground"><Clock className="w-3 h-3" />{job.type}</span>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold ${job.level === "Junior" ? "bg-green-500/10 text-green-600" : job.level === "Mid-level" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}>{job.level}</span>
          {job.urgency === "hot" && <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full font-bold">🔥 Hot</span>}
          {job.urgency === "new" && <span className="bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full font-bold">✨ Mới</span>}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{job.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((tag) => (
            <span key={tag} className="text-xs bg-background border border-border/50 px-2.5 py-1 rounded-md text-foreground/70 group-hover:border-secondary/30 transition-colors">{tag}</span>
          ))}
        </div>

        <div className="mt-auto border-t border-border/50 pt-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-foreground"><DollarSign className="w-4 h-4 text-secondary" />{job.salary}</div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applicants} ứng viên</span>
              <span>{job.posted}</span>
            </div>
          </div>
          <Button size="sm" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Xem Chi Tiết <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
