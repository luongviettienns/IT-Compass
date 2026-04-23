import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import {
    ArrowRight,
    Compass,
    ShieldCheck,
    Sparkles,
    Target,
    Users,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { buttonVariants } from '../components/ui/Button';
import { cn } from '../lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

const POSITIONING_PILLARS = [
    {
        icon: Target,
        title: 'Chọn theo độ phù hợp',
        description:
            'IT Compass không đẩy bạn vào một ngành “đang hot”. Chúng tôi giúp bạn nhìn ra hướng đi hợp với thiên hướng, cách học và kiểu công việc bạn sẽ gắn bó lâu dài.',
    },
    {
        icon: Users,
        title: 'Kết nối với người đang làm nghề',
        description:
            'Từ bài trắc nghiệm tới mentor, mọi trải nghiệm đều hướng về một mục tiêu: biến thông tin mơ hồ thành lời khuyên thực tế từ người có va chạm thị trường.',
    },
    {
        icon: ShieldCheck,
        title: 'Lộ trình rõ ràng, không phô trương',
        description:
            'Chúng tôi ưu tiên dữ liệu dễ hiểu, nội dung có thể hành động được và giao diện giúp bạn ra quyết định, thay vì gây choáng ngợp bởi quá nhiều thuật ngữ.',
    },
] as const;

const JOURNEY_STEPS = [
    {
        step: '01',
        title: 'Hiểu mình trước',
        description:
            'Làm assessment để biết bạn nghiêng về xây dựng sản phẩm, dữ liệu, bảo mật, trải nghiệm hay điều phối hệ thống.',
    },
    {
        step: '02',
        title: 'Đối chiếu với thế giới nghề nghiệp',
        description:
            'Xem majors, career path, blog và mentor tương ứng để hiểu mỗi hướng đi thực sự yêu cầu gì ngoài thị trường.',
    },
    {
        step: '03',
        title: 'Chốt một lộ trình khả thi',
        description:
            'Khi đã có bức tranh đủ rõ, bạn có thể bắt đầu học đúng mũi nhọn thay vì thử lan man quá nhiều công cụ cùng lúc.',
    },
] as const;

const DIFFERENTIATORS = [
    'Assessment, major, mentor và profile được nối thành một hành trình liền mạch.',
    'Nội dung được viết để hỗ trợ quyết định học tập, không chỉ để đọc cho biết.',
    'Thiết kế ưu tiên cảm giác định hướng rõ ràng, bình tĩnh và có thể hành động ngay.',
] as const;

export default function AboutUsPage() {
    return (
        <>
            <Helmet>
                <title>Về IT Compass — Nền tảng định hướng ngành CNTT</title>
                <meta
                    name="description"
                    content="Tìm hiểu cách IT Compass giúp học sinh, sinh viên và người mới vào ngành CNTT chọn đúng hướng đi bằng assessment, majors, mentor và nội dung thực chiến."
                />
            </Helmet>

            <main className="bg-background">
                <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_24%),linear-gradient(180deg,#f8fafc,#ffffff)]">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: EASE }}
                            className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end"
                        >
                            <div>
                                <Badge variant="outline" className="border-primary/20 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-primary">
                                    Về IT Compass
                                </Badge>
                                <h1 className="mt-8 max-w-4xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                                    Một nền tảng định hướng để bạn hiểu ngành CNTT theo cách gần với chính mình hơn.
                                </h1>
                                <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                                    IT Compass được xây dựng để trả lời một câu hỏi rất thực tế: nếu không muốn chọn ngành theo phong trào,
                                    bạn nên bắt đầu từ đâu? Chúng tôi ghép assessment, majors, mentor và nội dung thực chiến thành một
                                    bản đồ học tập rõ ràng để bạn ra quyết định với ít mơ hồ hơn.
                                </p>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link to="/test" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
                                        Làm bài trắc nghiệm <ArrowRight size={18} />
                                    </Link>
                                    <Link to="/majors" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
                                        Xem các nhóm ngành
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-[32px] border border-border/70 bg-background/90 p-6 shadow-xl shadow-primary/5 backdrop-blur">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <Compass size={28} />
                                </div>
                                <h2 className="mt-5 text-2xl font-bold text-foreground">Không chỉ là một trang giới thiệu ngành học.</h2>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    IT Compass được thiết kế như một hệ thống định hướng: bạn khám phá thiên hướng, đọc đúng ngữ cảnh,
                                    gặp đúng người và quay về profile với một hướng đi có cơ sở hơn.
                                </p>
                                <div className="mt-6 space-y-3">
                                    {DIFFERENTIATORS.map((item) => (
                                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface/50 px-4 py-3">
                                            <Sparkles size={16} className="mt-1 shrink-0 text-primary" />
                                            <p className="text-sm leading-6 text-foreground/90">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.45, ease: EASE }}
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">IT Compass tin rằng</p>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                            Định hướng tốt không bắt đầu từ việc học cái gì trước, mà từ việc hiểu mình hợp với kiểu công việc nào.
                        </h2>
                    </motion.div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {POSITIONING_PILLARS.map((item, index) => (
                            <motion.article
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.4, delay: index * 0.06, ease: EASE }}
                                className="rounded-[28px] border border-border/70 bg-background p-6 shadow-sm"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <item.icon size={22} />
                                </div>
                                <h3 className="mt-5 text-2xl font-bold text-foreground">{item.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </section>

                <section className="border-y border-border/60 bg-surface/35">
                    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Cách nền tảng vận hành</p>
                            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                                Một hành trình ngắn, nhưng đủ để biến “em chưa biết mình hợp gì” thành kế hoạch hành động cụ thể.
                            </h2>
                        </div>

                        <div className="mt-10 grid gap-6 lg:grid-cols-3">
                            {JOURNEY_STEPS.map((item, index) => (
                                <motion.article
                                    key={item.step}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ duration: 0.4, delay: index * 0.06, ease: EASE }}
                                    className="rounded-[28px] border border-border/70 bg-background p-6"
                                >
                                    <p className="text-sm font-black tracking-[0.26em] text-primary">{item.step}</p>
                                    <h3 className="mt-4 text-2xl font-bold text-foreground">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                        <motion.div
                            initial={{ opacity: 0, x: -16 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.45, ease: EASE }}
                            className="rounded-[32px] border border-border/70 bg-background p-6 sm:p-8"
                        >
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Chúng tôi đang xây</p>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                                Một trải nghiệm chọn ngành bớt áp lực hơn, nhưng không hời hợt hơn.
                            </h2>
                            <p className="mt-5 text-base leading-8 text-muted-foreground">
                                Rất nhiều người mới bước vào CNTT bị kéo giữa quá nhiều lời khuyên: học frontend hay backend, data hay an ninh mạng,
                                nên đi học tiếp hay đi làm sớm. IT Compass không thay bạn quyết định, nhưng giúp bạn nhìn rõ hơn những biến số quan trọng
                                trước khi quyết định.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to="/mentors" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
                                    Khám phá mentor <ArrowRight size={16} />
                                </Link>
                                <Link to="/blog" className={cn(buttonVariants({ variant: 'ghost' }))}>
                                    Đọc thêm từ blog
                                </Link>
                            </div>
                        </motion.div>

                        <motion.aside
                            initial={{ opacity: 0, x: 16 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.45, delay: 0.06, ease: EASE }}
                            className="rounded-[32px] border border-primary/15 bg-primary/5 p-6 shadow-sm"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                <Compass size={24} />
                            </div>
                            <h3 className="mt-5 text-2xl font-bold text-foreground">Bắt đầu từ đâu?</h3>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                Nếu bạn mới bước vào hệ sinh thái IT Compass, bài assessment là nơi nhanh nhất để có một gợi ý đủ tốt cho bước tiếp theo.
                            </p>
                            <Link to="/test" className={cn(buttonVariants({ size: 'lg' }), 'mt-6 w-full justify-center gap-2')}>
                                Bắt đầu assessment <ArrowRight size={18} />
                            </Link>
                        </motion.aside>
                    </div>
                </section>
            </main>
        </>
    );
}
