import { Link } from 'react-router-dom';
import { CompassLogo } from '../components/shared/CompassLogo';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFoundPage() {
    return (
        <main className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden bg-background">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 flex flex-col items-center"
            >
                <div className="mb-8">
                    <CompassLogo size={80} className="text-primary" />
                </div>

                <h1 className="text-8xl md:text-[140px] font-black tracking-tighter text-foreground leading-none">
                    404
                </h1>

                <div className="mt-8 max-w-lg">
                    <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Bạn bị lạc đường rồi!
                    </p>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        Trang web bạn đang cố truy cập không tồn tại hoặc đã bị di dời. Hãy thử quay lại trang chủ bằng định vị từ IT Compass.
                    </p>
                </div>

                <Link
                    to="/"
                    className="mt-10 inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-transparent bg-foreground px-8 text-base font-semibold text-background transition-all hover:bg-foreground/90 hover:scale-105 active:scale-95 shadow-xl shadow-foreground/20"
                >
                    Trở về trang chủ
                    <ArrowRight size={18} />
                </Link>
            </motion.div>
        </main>
    );
}
