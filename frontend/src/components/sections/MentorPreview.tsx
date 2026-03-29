import { Link } from "react-router-dom";
import { ArrowRight, Star, BadgeCheck, Users } from "lucide-react";

const topMentors = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    role: "Senior Fullstack Developer @ Google",
    expertise: ["React", "Node.js", "System Design"],
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256",
    verified: true,
  },
  {
    id: 2,
    name: "Trần Thị B",
    role: "AI Engineer @ VinAI",
    expertise: ["Python", "Machine Learning", "PyTorch"],
    rating: 4.8,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256",
    verified: true,
  },
  {
    id: 3,
    name: "Lê Văn C",
    role: "DevOps Architect @ Amazon",
    expertise: ["AWS", "Kubernetes", "CI/CD"],
    rating: 5.0,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256&h=256",
    verified: true,
  },
];

export function MentorPreview() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end justify-between mb-16">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-bold text-sm">
              <Users className="w-4 h-4" />
              Mentor 1-1
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Học Hỏi Từ Những <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Chuyên Gia</span>
            </h2>
            <p className="text-muted-foreground text-lg font-medium">
              Đừng đi một mình. Hãy để những người đi trước dẫn dắt, chia sẻ kinh nghiệm thực tế và giúp bạn thăng tiến nhanh hơn trong sự nghiệp IT.
            </p>
          </div>
          <Link
            to="/mentors"
            className="group flex flex-shrink-0 items-center gap-2 font-bold text-secondary hover:text-secondary/80 transition-colors whitespace-nowrap bg-secondary/10 border border-secondary/20 px-6 py-3 rounded-2xl hover:bg-secondary/20"
          >
            Khám Phá Tất Cả Mentor
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topMentors.map((mentor) => (
            <Link
              to="/mentors"
              key={mentor.id}
              className="group bg-card/50 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-8 hover:bg-card/80 hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden bg-muted border border-border/50 group-hover:scale-105 transition-transform duration-500 shadow-lg">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {mentor.verified && (
                    <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-lg border border-border/50">
                      <BadgeCheck className="w-5 h-5 text-secondary fill-secondary/10" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-background shadow-md px-3 py-1.5 rounded-xl border border-border/50">
                  <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span className="text-sm font-black">{mentor.rating}</span>
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="text-2xl font-black group-hover:text-secondary transition-colors line-clamp-1">
                  {mentor.name}
                </h3>
                <p className="text-sm font-bold text-muted-foreground mt-1 line-clamp-1">{mentor.role}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-6 border-t border-dashed border-border/50 mt-auto">
                {mentor.expertise.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 font-bold text-secondary group-hover:bg-secondary transition-colors group-hover:text-secondary-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
