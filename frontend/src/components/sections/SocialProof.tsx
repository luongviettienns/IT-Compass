export function SocialProof() {
  return (
    <section className="py-20 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-secondary-foreground/20 text-center">
          <div className="flex flex-col items-center justify-center py-4 md:py-0">
            <span className="text-5xl font-black mb-2">5,000+</span>
            <span className="text-secondary-foreground/80 font-medium">Người Dùng Đã Test</span>
          </div>
          <div className="flex flex-col items-center justify-center py-4 md:py-0">
            <span className="text-5xl font-black mb-2">20+</span>
            <span className="text-secondary-foreground/80 font-medium">Chuyên Ngành IT</span>
          </div>
          <div className="flex flex-col items-center justify-center py-4 md:py-0">
            <span className="text-5xl font-black mb-2">100+</span>
            <span className="text-secondary-foreground/80 font-medium">Cơ Hội Việc Làm</span>
          </div>
        </div>
      </div>
    </section>
  );
}
