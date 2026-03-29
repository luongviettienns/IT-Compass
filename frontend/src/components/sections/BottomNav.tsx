import { Home, Brain, Briefcase, Users, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { label: "Trang Chủ", icon: Home, href: "/" },
  { label: "Làm Test", icon: Brain, href: "/test" },
  { label: "Mentor", icon: Users, href: "/mentors" },
  { label: "Việc Làm", icon: Briefcase, href: "/jobs" },
  { label: "Hồ Sơ", icon: UserCircle, href: "/profile" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/50 px-2 py-2 safe-area-pb">
      <div className="flex justify-around items-center">
        {tabs.map(({ label, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              to={href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] group relative"
            >
              {/* Active pill background */}
              {active && (
                <span className="absolute inset-0 rounded-xl bg-secondary/10" />
              )}
              
              {/* Icon */}
              <div className={`relative transition-transform duration-200 ${active ? "scale-110" : "group-active:scale-95"}`}>
                <Icon
                  className={`w-6 h-6 transition-colors duration-200 ${active ? "text-secondary" : "text-muted-foreground group-hover:text-foreground"}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {/* Active dot indicator */}
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-secondary rounded-full shadow-sm shadow-secondary/50" />
                )}
              </div>
              
              {/* Label */}
              <span className={`text-[10px] font-semibold leading-none transition-colors duration-200 ${active ? "text-secondary" : "text-muted-foreground group-hover:text-foreground"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
