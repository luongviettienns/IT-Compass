import { Link } from 'react-router-dom';
import { Mail, MapPin, Globe, ExternalLink } from 'lucide-react';
import { CompassLogo } from '../shared/CompassLogo';

const LINKS = [
    { label: 'Trắc nghiệm', path: '/test' },
    { label: 'Blog', path: '/blog' },
    { label: 'Mentor', path: '/mentors' },
    { label: 'Ngành học', path: '/majors' },
    { label: 'Về chúng tôi', path: '/about' },
];

export function Footer() {
    return (
        <footer className="border-t bg-surface/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                {/* Main */}
                <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <Link to="/" className="inline-flex items-center gap-2.5 group">
                            <div className="transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
                                <CompassLogo size={32} className="text-primary" animate={false} />
                            </div>
                            <span className="text-lg font-bold tracking-tight transition-colors duration-300 group-hover:text-primary">
                                IT <span className="text-primary">Compass</span>
                            </span>
                        </Link>
                        <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
                            Định hướng nghề nghiệp CNTT cho thế hệ trẻ Việt Nam. Trắc nghiệm khoa học Holland, mentor thực chiến, tài nguyên chất lượng.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-4">Khám phá</h3>
                        <ul className="space-y-2.5">
                            {LINKS.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-4">Liên hệ</h3>
                        <ul className="space-y-2.5">
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail size={14} className="shrink-0" /> contact@itcompass.vn
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin size={14} className="shrink-0" /> TP. Hồ Chí Minh, Việt Nam
                            </li>
                            <li>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Globe size={14} /> GitHub <ExternalLink size={10} />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t py-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} IT Compass. Được phát triển với ❤️ cho cộng đồng IT Việt Nam.
                </div>
            </div>
        </footer>
    );
}
