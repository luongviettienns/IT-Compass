import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase } from "lucide-react";

const jobs = [
  { title: "Junior Frontend Developer", company: "TechSphere Inc.", level: "Entry Level" },
  { title: "Data Analyst", company: "Global Analytics", level: "Entry Level" },
  { title: "Backend Engineer", company: "CloudNet Systems", level: "Mid Level" },
  { title: "Cybersecurity Analyst", company: "SecureOps", level: "Entry Level" }
];

export function JobPreview() {
  return (
    <section id="jobs" className="py-24 bg-primary/5 border-t">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Cơ Hội Việc Làm Mới Nhất
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Bắt đầu sự nghiệp của bạn với các cơ hội độc quyền từ các công ty công nghệ hàng đầu.
            </p>
          </div>
          <Button variant="outline" className="mt-6 md:mt-0 border-secondary text-secondary hover:bg-secondary/10 px-6">
            Xem Tất Cả Việc Làm
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {jobs.map((job, i) => (
            <Card key={i} className="bg-card hover:shadow-lg transition-all border-border/40 group">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-1 group-hover:text-secondary transition-colors">{job.title}</h3>
                  <div className="flex items-center text-muted-foreground text-sm gap-1 mb-1">
                    <Building2 className="h-4 w-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{job.level}</span>
                  </div>
                </div>
                <Button className="w-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-colors mt-auto">
                  Ứng Tuyển Ngay
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
