/**
 * @file careerPaths.ts - Static data cho 6 hướng đi CNTT.
 * Dữ liệu đồng bộ với assessment.results.ts trên backend.
 * Icon sử dụng tên Lucide React icon.
 */

import type { LucideIcon } from 'lucide-react';
import {
    Code2,
    Database,
    ShieldCheck,
    Palette,
    Briefcase,
    Server,
} from 'lucide-react';

export type CareerPath = {
    slug: string;
    resultCode: string;
    icon: LucideIcon;
    title: string;
    headline: string;
    description: string;
    matchedCareers: string[];
    suggestedMajors: string[];
    color: string;
    iconColor: string;
    iconBg: string;
};

export const CAREER_PATHS: CareerPath[] = [
    {
        slug: 'ky-thuat-phan-mem',
        resultCode: 'SE',
        icon: Code2,
        title: 'Kỹ thuật phần mềm',
        headline: 'Xây dựng sản phẩm số từ ý tưởng đến thực tế',
        description:
            'Biến các yêu cầu mơ hồ thành sản phẩm chạy được — từ frontend, backend đến mobile. Tư duy hệ thống, khả năng phân tích và sự kiên trì là chìa khóa.',
        matchedCareers: ['Frontend Developer', 'Backend Developer', 'Full-stack Engineer', 'Mobile Developer'],
        suggestedMajors: ['Kỹ thuật phần mềm', 'Công nghệ phần mềm'],
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
    },
    {
        slug: 'du-lieu-va-ai',
        resultCode: 'Data',
        icon: Database,
        title: 'Dữ liệu và AI',
        headline: 'Khai phá giá trị từ dữ liệu',
        description:
            'Tìm quy luật ẩn trong dữ liệu, xây dựng mô hình dự đoán và hệ thống AI thông minh. Phù hợp với tư duy phân tích sâu và sự kiên nhẫn.',
        matchedCareers: ['Data Analyst', 'Data Engineer', 'ML Engineer', 'AI Engineer'],
        suggestedMajors: ['Khoa học dữ liệu', 'Trí tuệ nhân tạo'],
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
    },
    {
        slug: 'an-toan-thong-tin',
        resultCode: 'Cybersecurity',
        icon: ShieldCheck,
        title: 'An toàn thông tin',
        headline: 'Bảo vệ thế giới số',
        description:
            'Kết hợp tò mò kỹ thuật và phản xạ thực chiến — bảo vệ hệ thống, phát hiện lỗ hổng và xử lý sự cố bảo mật.',
        matchedCareers: ['Security Engineer', 'Pentester', 'Security Analyst', 'AppSec Engineer'],
        suggestedMajors: ['An toàn thông tin', 'An ninh mạng'],
        color: 'bg-red-50 text-red-700 border-red-200',
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
    },
    {
        slug: 'thiet-ke-ui-ux',
        resultCode: 'UXUI',
        icon: Palette,
        title: 'Thiết kế UI/UX',
        headline: 'Kiến tạo trải nghiệm số',
        description:
            'Nhìn công nghệ qua lăng kính con người — kết hợp thẩm mỹ, sự đồng cảm và khả năng tổ chức trải nghiệm người dùng.',
        matchedCareers: ['UI Designer', 'UX Designer', 'Product Designer', 'Frontend UI Engineer'],
        suggestedMajors: ['Thiết kế UI/UX', 'Thiết kế trải nghiệm'],
        color: 'bg-violet-50 text-violet-700 border-violet-200',
        iconColor: 'text-violet-600',
        iconBg: 'bg-violet-100',
    },
    {
        slug: 'quan-ly-du-an',
        resultCode: 'QLDA',
        icon: Briefcase,
        title: 'Quản lý dự án & Nghiệp vụ',
        headline: 'Cầu nối giữa kinh doanh và kỹ thuật',
        description:
            'Điều phối, phân tích và dẫn dắt sản phẩm — kết nối nhu cầu kinh doanh với giải pháp công nghệ.',
        matchedCareers: ['Business Analyst', 'Project Manager', 'Product Owner', 'Scrum Master'],
        suggestedMajors: ['Hệ thống thông tin', 'Phân tích nghiệp vụ'],
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
    },
    {
        slug: 'devops-he-thong',
        resultCode: 'DevOps',
        icon: Server,
        title: 'DevOps và Hệ thống',
        headline: 'Vận hành hạ tầng công nghệ',
        description:
            'Tự động hóa, ổn định hệ thống và scale ứng dụng — phù hợp với người thích cloud, CI/CD và giải quyết bài toán hạ tầng.',
        matchedCareers: ['DevOps Engineer', 'Cloud Engineer', 'Platform Engineer', 'System Engineer'],
        suggestedMajors: ['DevOps & Hệ thống', 'Điện toán đám mây'],
        color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        iconColor: 'text-cyan-600',
        iconBg: 'bg-cyan-100',
    },
];
