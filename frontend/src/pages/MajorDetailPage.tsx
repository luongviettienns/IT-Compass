import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import {
    ArrowLeft, Database, Briefcase, Target,
    GraduationCap, ArrowRight, Users
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/Button';

import { MAJORS_DB } from '../lib/constants/majors';

const EASE: any = [0.22, 1, 0.36, 1];

export default function MajorDetailPage() {
    const { slug } = useParams();
    const data = slug ? MAJORS_DB[slug as keyof typeof MAJORS_DB] : null;

    if (!data) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-20 text-center">
                <Helmet><title>Không tìm thấy ngành học — IT Compass</title></Helmet>
                <Database size={48} className="mx-auto text-muted-foreground opacity-50" />
                <h1 className="mt-8 text-3xl font-bold">Không tìm thấy ngành học</h1>
                <p className="mt-4 text-muted-foreground">URL không hợp lệ hoặc dữ liệu chuyên ngành này đang được cập nhật.</p>
                <Link to="/majors" className={cn(buttonVariants({ variant: 'default' }), "mt-8")}>
                    Quay lại danh sách
                </Link>
            </main>
        );
    }

    return (
        <>
            <Helmet>
                <title>{`${data.title} — Nhóm ngành CNTT`}</title>
                <meta name="description" content={data.description} />
            </Helmet>

            <main className="bg-background">
                {/* Header Banner */}
                <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.06),transparent_35%),linear-gradient(180deg,#f8fafc,#ffffff)]">
                    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                            <Link
                                to="/majors"
                                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                <ArrowLeft size={16} /> Các khối ngành CNTT
                            </Link>

                            <div className="mt-10 flex flex-col items-start gap-8 md:flex-row md:items-center">
                                <div className={cn('flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px]', data.iconBg)}>
                                    <data.icon size={46} className={data.iconColor} />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                        {data.title}
                                    </h1>
                                    <p className="mt-4 text-lg font-medium text-muted-foreground sm:text-xl">
                                        {data.headline}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
                    <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">

                        {/* Main Content */}
                        <div className="space-y-12">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Target size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold">Tổng quan chuyên ngành</h2>
                                </div>
                                <p className="mt-6 leading-8 text-foreground/80 sm:text-lg">
                                    {data.overview}
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: EASE }}>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Briefcase size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold">Cơ hội nghề nghiệp</h2>
                                </div>
                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {data.careers.map((career: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-surface/35 p-5 transition-colors hover:border-primary/30">
                                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                            <span className="font-semibold text-foreground/90">{career}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <GraduationCap size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold">Kỹ năng cốt lõi</h2>
                                </div>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    {data.skills.map((skill: string, idx: number) => (
                                        <div key={idx} className="rounded-xl border border-border bg-background px-5 py-2.5 font-medium text-foreground">
                                            {skill}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-8">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }} className="rounded-[28px] border border-border/80 bg-surface p-6 shadow-sm">
                                <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Nhóm Holland phù hợp</p>
                                <div className="mt-5 space-y-3">
                                    {data.holland.map((tag: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="w-full justify-start border-border bg-background px-4 py-2.5 text-sm font-medium">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.25, ease: EASE }} className="rounded-[28px] border border-primary/20 bg-primary/5 p-6 shadow-sm">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <Users size={24} />
                                </div>
                                <h3 className="mt-5 text-xl font-bold text-foreground">Tìm kiếm Định hướng?</h3>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                    Kết nối với các chuyên gia thực chiến trong lĩnh vực {data.title.toLowerCase()} để được tư vấn lộ trình học phù hợp nhất.
                                </p>
                                <Link to="/mentors" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), "mt-6 w-full gap-2")}>
                                    Kết nối Mentor <ArrowRight size={18} />
                                </Link>
                            </motion.div>
                        </aside>

                    </div>
                </section>
            </main>
        </>
    );
}
