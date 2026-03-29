import { useState } from 'react';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Compass, Settings, Camera, PenSquare, ArrowRight, Bookmark, MoveRight, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockUser = {
  name: "Nguyễn Trần Sinh Viên",
  title: "Sinh viên năm 3 - Đại học Bách Khoa TP.HCM",
  bio: "Đam mê lập trình Frontend, yêu thích tạo ra các sản phẩm web có giao diện đẹp mắt và trải nghiệm người dùng tuyệt vời. Đang tìm kiếm cơ hội thực tập ReactJS trong một môi trường năng động.",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256&h=256", // Thay bằng URL avatar thực tế
  coverImage: "https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&q=80&w=1200&h=400", // Thay bằng URL ảnh bìa
  email: "sinhvien.nguyen@hcmut.edu.vn",
  phone: "0912 345 678",
  location: "TP. Hồ Chí Minh",
  social: {
    github: "github.com/nguyensinhvien",
    linkedin: "linkedin.com/in/nguyensinhvien",
  },
  skills: ["ReactJS", "TypeScript", "Tailwind CSS", "Node.js", "Figma", "UI/UX Design", "Git"],
  education: [
    {
      id: 1,
      degree: "Kỹ sư Kỹ thuật Phần mềm",
      school: "Đại học Bách Khoa TP.HCM",
      year: "2021 - Hiện tại",
      gpa: "3.5/4.0"
    }
  ],
  testResult: {
    type: "INTJ - Kiến Trúc Sư",
    score: 85,
    matchedCareers: ["Software Architect", "Backend Engineer", "Data Scientist"],
    description: "Bạn là người có tư duy logic sắc bén, thích cấu trúc lại các hệ thống phức tạp và lên kế hoạch dài hạn. Bạn phù hợp nhất với những vai trò đòi hỏi sự phân tích chuyên sâu."
  },
  savedJobs: [
    { id: 1, title: "Thực tập sinh Frontend (ReactJS)", company: "Tech Unicorn", location: "Quận 1, TP.HCM", salary: "5 - 7 Triệu" },
    { id: 2, title: "Junior UI/UX Designer", company: "Creative Agency", location: "Quận 3, TP.HCM", salary: "Thỏa thuận" }
  ],
  savedMentors: [
    { id: 5, name: "Hoàng Anh E", role: "Frontend Lead @ TikTok", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256&h=256" },
  ]
};

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'mentors'>('overview');

  return (
    <div className="min-h-screen pt-20 pb-24 bg-background relative overflow-hidden">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* 1. COVER PHOTO SECTION */}
      <div className="w-full h-[250px] md:h-[350px] relative">
        <div className="absolute inset-0 bg-muted/30">
          <img src={mockUser.coverImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        
        {/* Edit Cover Action */}
        <button className="absolute top-6 right-6 md:right-12 bg-background/50 backdrop-blur-md border border-border/50 text-foreground p-3 rounded-full hover:bg-background/80 hover:text-secondary transition-all shadow-lg active:scale-95 group">
          <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 -mt-20 md:-mt-32">
        {/* Profile Info Header Panel */}
        <div className="bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-secondary/5 mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-end">
            
            {/* Avatar */}
            <div className="relative -mt-16 md:-mt-24">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] border-8 border-card overflow-hidden bg-muted shadow-2xl relative group">
                <img src={mockUser.avatar} alt={mockUser.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 md:bottom-2 md:right-2 bg-green-500 w-6 h-6 md:w-8 md:h-8 border-4 border-card rounded-full animate-pulse-slow"></div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl md:text-5xl font-black">{mockUser.name}</h1>
              <p className="text-lg md:text-xl font-bold text-secondary">{mockUser.title}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground pt-2">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {mockUser.location}</span>
                <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {mockUser.education[0].school}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-secondary/20 transition-all active:scale-95">
                <PenSquare className="w-4 h-4" />
                Chỉnh Sửa
              </button>
              <button className="bg-background border border-border/50 p-3 rounded-xl hover:bg-muted hover:text-secondary transition-colors text-foreground shadow-sm">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ================= LEFT SIDEBAR ================= */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Giới thiệu */}
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-secondary" /> Giới thiệu</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">
                {mockUser.bio}
              </p>
            </div>

            {/* Thông tin liên hệ */}
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-secondary" /> Thông tin liên hệ</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-2 bg-background rounded-full border border-border/50">
                    <Mail className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="font-medium">{mockUser.email}</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-2 bg-background rounded-full border border-border/50">
                    <Phone className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="font-medium">{mockUser.phone}</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-2 bg-background rounded-full border border-border/50">
                    <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/></svg>
                  </div>
                  <a href={`https://${mockUser.social.github}`} className="font-medium hover:text-secondary transition-colors underline-offset-4 hover:underline">{mockUser.social.github}</a>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-2 bg-background rounded-full border border-border/50">
                    <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </div>
                  <a href={`https://${mockUser.social.linkedin}`} className="font-medium hover:text-secondary transition-colors underline-offset-4 hover:underline">{mockUser.social.linkedin}</a>
                </li>
              </ul>
            </div>

            {/* Kỹ năng */}
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-secondary" /> Kỹ năng IT</h3>
              <div className="flex flex-wrap gap-2">
                {mockUser.skills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-secondary/10 border border-secondary/20 text-secondary rounded-xl font-bold text-sm hover:bg-secondary hover:text-secondary-foreground transition-colors cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* ================= RIGHT MAIN CONTENT ================= */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-border/50 pb-px overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-shrink-0 px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'overview' ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Tổng Quan Tiến Độ
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`flex-shrink-0 px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'jobs' ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Việc Làm Đã Lưu <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-black text-foreground">{mockUser.savedJobs.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('mentors')}
                className={`flex-shrink-0 px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'mentors' ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Mentor Của Tôi <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-black text-foreground">{mockUser.savedMentors.length}</span>
              </button>
            </div>

            {/* Tab Panels */}
            <div className="min-h-[400px]">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Test Results Summary Box */}
                  <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border border-secondary/20 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
                    <div className="relative z-10 w-full md:w-2/3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-background border border-border/50 rounded-full text-xs font-bold text-muted-foreground mb-4">
                        <Compass className="w-4 h-4 text-secondary" /> Mới nhất
                      </div>
                      <h2 className="text-2xl font-black mb-2">Định Hướng: {mockUser.testResult.type}</h2>
                      <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
                        {mockUser.testResult.description}
                      </p>
                      
                      <div className="space-y-3 mb-8">
                        <h4 className="font-bold text-sm">Gợi ý lộ trình nghề nghiệp:</h4>
                        <div className="flex flex-wrap gap-2">
                          {mockUser.testResult.matchedCareers.map(career => (
                            <span key={career} className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border/50 rounded-lg text-sm font-bold shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-secondary" /> {career}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link to="/test" className="inline-flex items-center gap-2 font-bold text-secondary hover:text-secondary/80 bg-secondary/10 px-6 py-3 rounded-xl transition-all hover:bg-secondary/20 group-hover:px-8">
                        Làm lại bài Test <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Decorative large compass icon */}
                    <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none">
                      <Compass className="w-64 h-64" />
                    </div>
                  </div>

                  {/* Education History */}
                  <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                      <GraduationCap className="w-6 h-6 text-foreground" /> Học vấn
                    </h2>
                    <div className="relative pl-6 border-l-2 border-muted">
                      {mockUser.education.map(edu => (
                        <div key={edu.id} className="relative mb-6 last:mb-0">
                          <div className="absolute w-4 h-4 bg-secondary rounded-full -left-[35px] top-1.5 shadow-[0_0_0_4px_var(--tw-colors-background)]"></div>
                          <h4 className="text-lg font-bold text-foreground">{edu.degree}</h4>
                          <p className="font-medium text-secondary">{edu.school}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">{edu.year}</span>
                            <span className="font-bold bg-background px-2 py-0.5 rounded-md border border-border/50">GPA: {edu.gpa}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: SAVED JOBS */}
              {activeTab === 'jobs' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {mockUser.savedJobs.map(job => (
                    <div key={job.id} className="group bg-card border border-border/50 hover:border-secondary/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold group-hover:text-secondary transition-colors line-clamp-1">{job.title}</h3>
                        <p className="font-medium text-muted-foreground mt-1">{job.company}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs md:text-sm font-medium">
                          <span className="bg-muted px-2.5 py-1 rounded-md text-foreground">{job.location}</span>
                          <span className="bg-green-500/10 text-green-500 font-black px-2.5 py-1 rounded-md">{job.salary}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <Link to={`/jobs/${job.id}`} className="flex-1 md:flex-none text-center bg-foreground text-background font-bold px-6 py-2.5 rounded-xl hover:bg-secondary hover:text-white transition-colors">
                          Ứng tuyển
                        </Link>
                        <button className="p-2.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-colors group/btn">
                          <Bookmark className="w-5 h-5 fill-secondary" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {mockUser.savedJobs.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-[2.5rem]">
                      <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground">Chưa lưu tin tuyển dụng nào</h3>
                      <p className="text-muted-foreground font-medium mt-2">Hãy khám phá các cơ hội nghề nghiệp và lưu lại nhé!</p>
                      <Link to="/jobs" className="inline-flex mt-6 font-bold text-secondary hover:underline underline-offset-4">Xem Việc Làm &rarr;</Link>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SAVED MENTORS */}
              {activeTab === 'mentors' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {mockUser.savedMentors.map(mentor => (
                    <div key={mentor.id} className="group flex items-center gap-4 bg-card border border-border/50 hover:border-secondary/30 rounded-[2rem] p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                      <img src={mentor.avatar} alt={mentor.name} className="w-16 h-16 rounded-2xl object-cover bg-muted" />
                      <div className="flex-1">
                        <h3 className="font-black text-lg group-hover:text-secondary transition-colors">{mentor.name}</h3>
                        <p className="text-sm font-medium text-muted-foreground line-clamp-1">{mentor.role}</p>
                      </div>
                      <button className="p-2 bg-background border border-border/50 rounded-full hover:bg-secondary/10 hover:text-secondary transition-colors mr-2">
                        <MoveRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {mockUser.savedMentors.length === 0 && (
                    <div className="col-span-full text-center py-20 border-2 border-dashed border-border/50 rounded-[2.5rem]">
                      <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground">Bạn chưa theo dõi Mentor nào</h3>
                      <p className="text-muted-foreground font-medium mt-2">Tìm kiếm người đồng hành hoàn hảo cho sự nghiệp của bạn.</p>
                      <Link to="/mentors" className="inline-flex mt-6 font-bold text-secondary hover:underline underline-offset-4">Khám phá Mentor &rarr;</Link>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
