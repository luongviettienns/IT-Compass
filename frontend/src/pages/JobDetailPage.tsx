import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Clock, DollarSign, Users, Building2, CalendarDays,
  CheckCircle2, Star, Zap, Bookmark, ExternalLink, ChevronRight, Briefcase
} from "lucide-react";
import { Button } from "../components/ui/button";
import { jobsData } from "../data/jobs";
import { useState } from "react";

export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  
  const job = jobsData.find((j) => j.id === Number(id));

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Briefcase className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold">Không tìm thấy tin tuyển dụng</h2>
        <Button onClick={() => navigate("/jobs")} variant="outline">Quay lại danh sách việc làm</Button>
      </div>
    );
  }

  // Suggest other jobs from same category (exclude current)
  const related = jobsData.filter((j) => j.category === job.category && j.id !== job.id).slice(0, 3);

  return (
    <div className="pt-20 pb-32 min-h-screen">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 md:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/jobs" className="hover:text-secondary transition-colors">Việc Làm</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium truncate max-w-xs">{job.title}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Header */}
            <div className="relative bg-card/70 backdrop-blur-sm border border-border/50 rounded-2xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-2xl ${job.logoColor} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
                      {job.logo}
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-extrabold mb-1">{job.title}</h1>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span className="font-semibold text-foreground">{job.company}</span>
                        {job.featured && (
                          <span className="flex items-center gap-1 bg-secondary/10 text-secondary text-xs font-bold px-2.5 py-1 rounded-full border border-secondary/20">
                            <Star className="w-3 h-3 fill-secondary" /> Nổi Bật
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`p-3 rounded-xl border transition-all ${saved ? "text-secondary bg-secondary/10 border-secondary/30" : "text-muted-foreground hover:text-secondary hover:bg-secondary/10 border-border"}`}
                  >
                    <Bookmark className={`w-5 h-5 ${saved ? "fill-secondary" : ""}`} />
                  </button>
                </div>

                {/* Meta Tags */}
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-2 bg-muted/60 px-3 py-2 rounded-xl text-muted-foreground">
                    <MapPin className="w-4 h-4 text-secondary" />{job.location}
                  </span>
                  <span className="flex items-center gap-2 bg-muted/60 px-3 py-2 rounded-xl text-muted-foreground">
                    <Clock className="w-4 h-4 text-secondary" />{job.type}
                  </span>
                  <span className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold ${job.level === "Junior" ? "bg-green-500/10 text-green-600" : job.level === "Mid-level" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}>
                    {job.level}
                  </span>
                  {job.urgency === "hot" && <span className="bg-red-500/10 text-red-500 px-3 py-2 rounded-xl font-bold">🔥 Hot</span>}
                  {job.urgency === "new" && <span className="bg-emerald-500/10 text-emerald-600 px-3 py-2 rounded-xl font-bold">✨ Mới đăng</span>}
                </div>
              </div>
            </div>

            {/* Description */}
            <Section title="Mô Tả Công Việc">
              <p className="text-muted-foreground leading-relaxed">{job.companyDesc}</p>
              <p className="text-muted-foreground leading-relaxed mt-4">{job.description}</p>
            </Section>

            {/* Responsibilities */}
            <Section title="Trách Nhiệm Công Việc">
              <ul className="space-y-3">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Requirements */}
            <Section title="Yêu Cầu Ứng Viên">
              <ul className="space-y-3">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Benefits */}
            <Section title="Quyền Lợi & Phúc Lợi">
              <div className="grid sm:grid-cols-2 gap-3">
                {job.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 bg-secondary/5 border border-secondary/10 rounded-xl p-4 hover:border-secondary/30 transition-colors">
                    <Zap className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">{b}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Tech Stack */}
            <Section title="Kỹ Năng Yêu Cầu">
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span key={tag} className="bg-background border border-border px-4 py-2 rounded-full text-sm font-medium text-foreground/80 hover:border-secondary hover:text-secondary transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </Section>

            {/* Back Button */}
            <button onClick={() => navigate("/jobs")} className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách việc làm
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="sticky top-24 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-secondary" />
                <span className="text-2xl font-extrabold">{job.salary}</span>
                <span className="text-muted-foreground text-sm">/tháng</span>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="w-4 h-4 text-secondary" />
                  <span>{job.applicants} ứng viên đã nộp hồ sơ</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarDays className="w-4 h-4 text-secondary" />
                  <span>Hạn nộp: <span className="text-foreground font-semibold">{job.deadline}</span></span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span>Đăng: {job.posted}</span>
                </div>
              </div>

              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 font-bold text-base rounded-xl shadow-md hover:shadow-secondary/30 transition-all mb-3">
                Ứng Tuyển Ngay
              </Button>
              <Button variant="outline" className="w-full h-11 rounded-xl gap-2 hover:border-secondary hover:text-secondary">
                <ExternalLink className="w-4 h-4" /> Xem trang công ty
              </Button>

              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">Ứng tuyển nhanh chóng bằng hồ sơ IT Compass của bạn</p>
              </div>
            </div>

            {/* Perks */}
            <div className="bg-card/60 border border-border/50 rounded-2xl p-5">
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Đặc Quyền</h3>
              <div className="space-y-2">
                {job.perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    {perk}
                  </div>
                ))}
              </div>
            </div>

            {/* Related Jobs */}
            {related.length > 0 && (
              <div className="bg-card/60 border border-border/50 rounded-2xl p-5">
                <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Việc Làm Tương Tự</h3>
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link 
                      key={r.id} 
                      to={`/jobs/${r.id}`}
                      className="flex items-center gap-3 group hover:bg-muted/50 p-2 rounded-xl transition-colors"
                    >
                      <div className={`h-9 w-9 rounded-lg ${r.logoColor} flex items-center justify-center text-white font-black text-xs shrink-0`}>{r.logo}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight group-hover:text-secondary transition-colors truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.salary}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card/70 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
      <h2 className="text-lg font-bold mb-5 flex items-center gap-2 after:flex-1 after:h-px after:bg-border/50 after:ml-3">
        {title}
      </h2>
      {children}
    </div>
  );
}
