import { Compass, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Trang Chủ", href: "/" },
  { label: "Định Hướng", href: "/test" },
  { label: "Ngành IT", href: "/majors" },
  { label: "Việc Làm", href: "/jobs" },
  { label: "Mentor 1-1", href: "/mentors" },
  { label: "Cẩm Nang", href: "/blog" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-border/50 bg-background/70 backdrop-blur-xl shadow-sm shadow-secondary/5"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/40 rounded-full blur-[8px] scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            <Compass className="h-7 w-7 text-secondary relative transition-transform duration-300 group-hover:rotate-45" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-secondary group-hover:to-primary-foreground transition-all duration-300">
            IT Compass
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
              <span className="relative z-10">{label}</span>
              <span className="absolute inset-0 rounded-lg bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-200"></span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-secondary rounded-full group-hover:w-1/2 transition-all duration-300"></span>
            </Link>
          ))}
        </nav>

        {/* Login Button & Profile Actions (desktop only) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-[1.5px] rounded-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[gradient-x_3s_linear_infinite] opacity-70 group-hover:opacity-100 group-hover:-inset-[2px] transition-all duration-300"></div>
            <Link to="/auth" className="relative flex items-center gap-2 bg-background rounded-full px-5 py-2 text-sm font-semibold text-foreground group-hover:bg-secondary group-hover:text-secondary-foreground transition-all duration-300">
              <LogIn className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              Đăng Nhập
            </Link>
          </div>
          
          <Link to="/profile" className="w-10 h-10 rounded-full border-2 border-border/50 bg-background overflow-hidden hover:border-secondary focus:ring-2 focus:ring-secondary/50 focus:outline-none transition-all shadow-sm group">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256&h=256" alt="User Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </Link>
        </div>
      </div>
    </header>
  );
}
