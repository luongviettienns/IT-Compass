import { Compass, Globe, Mail, Phone, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const socialIcons = [
  { icon: Globe, label: "Website" },
  { icon: Mail, label: "Email" },
  { icon: Phone, label: "Phone" },
];

const navLinks = [
  { label: "Làm Bài Test", href: "#" },
  { label: "Chuyên Ngành IT", href: "/majors" },
  { label: "Việc Làm", href: "#jobs" },
  { label: "Blog & Tài Nguyên", href: "#blog" },
];

const companyLinks = [
  { label: "Về Chúng Tôi", href: "#" },
  { label: "Điều Khoản Dịch Vụ", href: "#" },
  { label: "Chính Sách Bảo Mật", href: "#" },
  { label: "Liên Hệ", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative bg-foreground text-background overflow-hidden">
      {/* Decorative glowing blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top section */}
      <div className="container mx-auto px-4 md:px-8 pt-20 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand Column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-secondary/30 rounded-full blur-[10px]"></div>
                <div className="relative h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                  <Compass className="h-5 w-5 text-foreground" />
                </div>
              </div>
              <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-secondary">IT Compass</span>
            </div>
            <p className="text-white/50 max-w-sm leading-relaxed mb-8">
              La bàn định vị sự nghiệp IT của bạn. Chúng tôi giúp thế hệ chuyên gia công nghệ Việt Nam tìm thấy đam mê và con đường phát triển phù hợp nhất.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4 items-center">
              {socialIcons.map(({ icon: Icon, label }) => (
                <div key={label} className="group relative flex flex-col items-center">
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 whitespace-nowrap shadow-lg pointer-events-none">
                    {label}
                  </span>
                  <a
                    href="#"
                    className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 group-hover:text-secondary-foreground group-hover:bg-secondary group-hover:scale-125 group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgba(0,180,216,0.4)] group-hover:border-secondary transition-all duration-300 ease-out"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-1" />

          {/* Links Column 1 */}
          <div className="md:col-span-3">
            <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Nền Tảng</h4>
            <ul className="space-y-4">
              {navLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="group flex items-center gap-2 text-white/50 hover:text-secondary transition-colors duration-200"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="md:col-span-3">
            <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Công Ty</h4>
            <ul className="space-y-4">
              {companyLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="group flex items-center gap-2 text-white/50 hover:text-secondary transition-colors duration-200"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Bottom Bar */}
      <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/30">
          <p>© {new Date().getFullYear()} <span className="text-white/60 font-semibold">IT Compass</span>. Đã đăng ký bản quyền.</p>
          <p className="text-xs">Được xây dựng với ❤️ cho thế hệ IT Việt Nam</p>
        </div>
      </div>
    </footer>
  );
}
