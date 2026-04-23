import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

import { MAJORS_LIST as MAJORS } from '../lib/constants/majors';

const EASE: any = [0.22, 1, 0.36, 1];

export default function MajorsPage() {
    return (
        <>
            <Helmet>
                <title>Ngành học CNTT — IT Compass</title>
                <meta name="description" content="Khám phá chi tiết các chuyên ngành trong lĩnh vực Công nghệ thông tin để tìm ra hướng đi phù hợp nhất với bạn." />
            </Helmet>

            <main className="bg-background">
                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_40%),linear-gradient(180deg,#f8fafc,#ffffff)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
                    <div className="mx-auto max-w-5xl text-center">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                            <Badge variant="outline" className="border-primary/20 bg-primary/10 px-4 py-1.5 text-sm uppercase tracking-[0.2em] text-primary">
                                Bản đồ học tập
                            </Badge>
                            <h1 className="mt-8 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-7xl lg:leading-[1.1]">
                                Đừng Chọn Ngành Theo Xu Hướng.<br /> Hãy Chọn Theo <span className="text-primary">Độ Phù Hợp</span>.
                            </h1>
                            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-xl lg:mt-8">
                                CNTT không chỉ có lập trình. Bạn có thể là người thiết kế, người phân tích số liệu, bảo vệ an ninh mạng hay làm cầu nối kinh doanh. Khám phá {MAJORS.length} nhóm ngành cốt lõi tại IT Compass.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Majors Grid Section */}
                <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                    <motion.div
                        className="grid gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-3"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-40px' }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 },
                            },
                        }}
                    >
                        {MAJORS.map((major) => (
                            <motion.div
                                key={major.slug}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
                                }}
                            >
                                <Link
                                    to={`/majors/${major.slug}`}
                                    className="group flex h-full flex-col justify-between rounded-[32px] border border-border/80 bg-background p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', major.iconBg)}>
                                                <major.icon size={28} className={major.iconColor} />
                                            </div>
                                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                                <ArrowRight size={16} className="transition-transform group-hover:-rotate-45" />
                                            </div>
                                        </div>

                                        <div className="mt-8">
                                            <h3 className="text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                                                {major.title}
                                            </h3>
                                            <p className="mt-2 font-medium text-muted-foreground">{major.headline}</p>
                                        </div>

                                        <p className="mt-4 text-sm leading-6 text-muted-foreground/90">
                                            {major.description}
                                        </p>
                                    </div>

                                    <div className="mt-8 flex flex-wrap gap-2">
                                        {major.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="border-border/50 bg-surface/50 text-xs text-foreground/80">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
            </main>
        </>
    );
}
