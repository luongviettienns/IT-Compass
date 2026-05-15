import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from '../src/db/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import {
  sanitizeEmailAddress,
  sanitizeRichText,
  sanitizeSingleLineText,
} from '../src/utils/sanitize.js';
import { slugify } from '../src/utils/slug.js';

type SeedRole = 'ADMIN' | 'STUDENT' | 'MENTOR';
type SeedGender = 'MALE' | 'FEMALE' | 'OTHER';
type SeedMentorLevel = 'FRESHER' | 'JUNIOR' | 'MIDDLE' | 'SENIOR';

type SeedProfile = {
  avatarUrl: string | null;
  coverImageUrl: string | null;
  phoneNumber: string | null;
  location: string | null;
  birthYear: number | null;
  gender: SeedGender | null;
  province: string | null;
  schoolOrCompany: string | null;
  department: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  jobTitle: string | null;
};

type SeedMentor = {
  title: string | null;
  bio: string | null;
  level: SeedMentorLevel | null;
  expertiseArea: string | null;
  yearsOfExperience: number | null;
  hourlyRate: number | null;
  currentSchool: string | null;
  currentCompany: string | null;
  currentJobTitle: string | null;
  consultationLang: string | null;
  reviewCount: number;
  isVerified: boolean;
};

type SeedAccount = {
  key: string;
  fullName: string;
  email: string;
  role: SeedRole;
  password: string;
  note: string;
  profile: SeedProfile;
  mentor?: SeedMentor;
};

type SeedAccountWithHash = SeedAccount & {
  passwordHash: string;
};

type SeededUser = {
  id: bigint;
  fullName: string;
  email: string;
  role: SeedRole;
};

const SEED_TIME = new Date('2026-05-01T09:00:00.000Z');
const BLOG_PUBLISHED_AT = new Date('2026-05-02T08:00:00.000Z');
const BLOG_TITLE = 'Lập kế hoạch học tập 12 tuần để chuẩn bị phỏng vấn thực tập';
const BLOG_EXCERPT =
  'Một lộ trình 12 tuần gọn, thực tế và dễ áp dụng cho sinh viên công nghệ muốn hoàn thiện hồ sơ, dự án và kỹ năng phỏng vấn.';
const BLOG_TAG = 'Hướng nghiệp';
const BLOG_READ_TIME = '8 phút đọc';
const BLOG_KEYWORDS = 'hướng nghiệp, kế hoạch học tập, phỏng vấn thực tập, mentor';

const seedAccounts: SeedAccount[] = [
  {
    key: 'admin',
    fullName: 'Trần Minh Quân',
    email: 'admin@example.com',
    role: 'ADMIN',
    password: 'Admin@123456',
    note: 'Tài khoản quản trị duy nhất',
    profile: {
      avatarUrl: null,
      coverImageUrl: null,
      phoneNumber: '0901 234 567',
      location: 'Quận 3, TP. Hồ Chí Minh',
      birthYear: 1990,
      gender: 'MALE',
      province: 'TP. Hồ Chí Minh',
      schoolOrCompany: 'Bộ phận vận hành nền tảng',
      department: 'Quản trị hệ thống',
      bio: 'Phụ trách vận hành, kiểm duyệt nội dung và giám sát dữ liệu nền tảng.',
      githubUrl: null,
      linkedinUrl: null,
      jobTitle: 'Quản trị viên hệ thống',
    },
  },
  {
    key: 'student-thao-vy',
    fullName: 'Nguyễn Thảo Vy',
    email: 'thao.vy@example.com',
    role: 'STUDENT',
    password: 'Student@123456',
    note: 'Sinh viên năm cuối cần theo dõi lộ trình thực tập',
    profile: {
      avatarUrl: null,
      coverImageUrl: null,
      phoneNumber: '0909 112 233',
      location: 'Cầu Giấy, Hà Nội',
      birthYear: 2003,
      gender: 'FEMALE',
      province: 'Hà Nội',
      schoolOrCompany: 'Đại học Bách khoa Hà Nội',
      department: 'Khoa học máy tính',
      bio: 'Sinh viên năm cuối thích giao diện sạch, đang chuẩn bị hồ sơ thực tập backend và frontend.',
      githubUrl: null,
      linkedinUrl: null,
      jobTitle: 'Sinh viên Công nghệ thông tin',
    },
  },
  {
    key: 'student-gia-huy',
    fullName: 'Lê Gia Huy',
    email: 'gia.huy@example.com',
    role: 'STUDENT',
    password: 'Student@123456',
    note: 'Sinh viên đang tìm mentor cho hướng dữ liệu',
    profile: {
      avatarUrl: null,
      coverImageUrl: null,
      phoneNumber: '0912 556 778',
      location: 'Hải Châu, Đà Nẵng',
      birthYear: 2004,
      gender: 'MALE',
      province: 'Đà Nẵng',
      schoolOrCompany: 'Đại học Duy Tân',
      department: 'Kỹ thuật phần mềm',
      bio: 'Quan tâm đến dữ liệu, product và cách xây sản phẩm có thể đo lường.',
      githubUrl: null,
      linkedinUrl: null,
      jobTitle: 'Sinh viên Kỹ thuật phần mềm',
    },
  },
  {
    key: 'mentor-duc-long',
    fullName: 'Phạm Đức Long',
    email: 'duc.long@example.com',
    role: 'MENTOR',
    password: 'Mentor@123456',
    note: 'Mentor frontend và hướng nghề',
    profile: {
      avatarUrl: null,
      coverImageUrl: null,
      phoneNumber: '0934 778 901',
      location: 'TP. Thủ Đức, TP. Hồ Chí Minh',
      birthYear: 1991,
      gender: 'MALE',
      province: 'TP. Hồ Chí Minh',
      schoolOrCompany: 'FPT Software',
      department: 'Digital Experience',
      bio: 'Kỹ sư phần mềm tập trung vào sản phẩm hướng người dùng, đang hướng dẫn sinh viên xây portfolio và phỏng vấn.',
      githubUrl: null,
      linkedinUrl: null,
      jobTitle: 'Senior Frontend Engineer',
    },
    mentor: {
      title: 'Senior Frontend Engineer tại FPT Software',
      bio: 'Hỗ trợ sinh viên xây portfolio, luyện phỏng vấn và thiết kế lộ trình học 12 tuần.',
      level: 'SENIOR',
      expertiseArea: 'Frontend, React, Career Coaching',
      yearsOfExperience: 10,
      hourlyRate: 450000,
      currentSchool: null,
      currentCompany: 'FPT Software',
      currentJobTitle: 'Senior Frontend Engineer',
      consultationLang: 'Tiếng Việt',
      reviewCount: 18,
      isVerified: true,
    },
  },
  {
    key: 'mentor-thu-ha',
    fullName: 'Võ Thu Hà',
    email: 'thu.ha@example.com',
    role: 'MENTOR',
    password: 'Mentor@123456',
    note: 'Mentor dữ liệu và phân tích',
    profile: {
      avatarUrl: null,
      coverImageUrl: null,
      phoneNumber: '0987 321 654',
      location: 'Cầu Giấy, Hà Nội',
      birthYear: 1992,
      gender: 'FEMALE',
      province: 'Hà Nội',
      schoolOrCompany: 'Viettel Digital',
      department: 'Data Platform',
      bio: 'Làm việc với data pipeline, phân tích sản phẩm và mentoring cho sinh viên mới ra trường.',
      githubUrl: null,
      linkedinUrl: null,
      jobTitle: 'Data Engineer',
    },
    mentor: {
      title: 'Data Engineer tại Viettel Digital',
      bio: 'Tập trung vào SQL, dashboard và cách biến dữ liệu thành quyết định sản phẩm.',
      level: 'MIDDLE',
      expertiseArea: 'Data, SQL, Analytics',
      yearsOfExperience: 8,
      hourlyRate: 400000,
      currentSchool: null,
      currentCompany: 'Viettel Digital',
      currentJobTitle: 'Data Engineer',
      consultationLang: 'Tiếng Việt',
      reviewCount: 27,
      isVerified: true,
    },
  },
  {
    key: 'mentor-minh-duc',
    fullName: 'Nguyễn Minh Đức',
    email: 'minh.duc@example.com',
    role: 'MENTOR',
    password: 'Mentor@123456',
    note: 'Mentor backend và kiến trúc API',
    profile: {
      avatarUrl: null,
      coverImageUrl: null,
      phoneNumber: '0917 204 688',
      location: 'Hà Đông, Hà Nội',
      birthYear: 1989,
      gender: 'MALE',
      province: 'Hà Nội',
      schoolOrCompany: 'VNG',
      department: 'Platform Engineering',
      bio: 'Kỹ sư backend tập trung vào API, database và chất lượng hệ thống cho các sản phẩm tăng trưởng nhanh.',
      githubUrl: null,
      linkedinUrl: null,
      jobTitle: 'Backend Engineer',
    },
    mentor: {
      title: 'Backend Engineer tại VNG',
      bio: 'Hướng dẫn sinh viên thiết kế API, chuẩn bị phỏng vấn backend và viết project có thể mở rộng.',
      level: 'SENIOR',
      expertiseArea: 'Backend, Node.js, MySQL',
      yearsOfExperience: 11,
      hourlyRate: 500000,
      currentSchool: null,
      currentCompany: 'VNG',
      currentJobTitle: 'Backend Engineer',
      consultationLang: 'Tiếng Việt',
      reviewCount: 24,
      isVerified: true,
    },
  },
  {
    key: 'mentor-thanh-truc',
    fullName: 'Lê Thanh Trúc',
    email: 'thanh.truc@example.com',
    role: 'MENTOR',
    password: 'Mentor@123456',
    note: 'Mentor UI/UX và case study',
    profile: {
      avatarUrl: null,
      coverImageUrl: null,
      phoneNumber: '0904 883 120',
      location: 'Quận 7, TP. Hồ Chí Minh',
      birthYear: 1993,
      gender: 'FEMALE',
      province: 'TP. Hồ Chí Minh',
      schoolOrCompany: 'Tiki',
      department: 'Product Design',
      bio: 'Thiết kế sản phẩm tập trung vào trải nghiệm rõ ràng, ngắn gọn và dễ dùng cho người học.',
      githubUrl: null,
      linkedinUrl: null,
      jobTitle: 'Product Designer',
    },
    mentor: {
      title: 'Product Designer tại Tiki',
      bio: 'Hỗ trợ xây portfolio UI/UX, luyện feedback design và trình bày case study rõ ràng.',
      level: 'MIDDLE',
      expertiseArea: 'UI/UX, Product Design, Portfolio',
      yearsOfExperience: 9,
      hourlyRate: 380000,
      currentSchool: null,
      currentCompany: 'Tiki',
      currentJobTitle: 'Product Designer',
      consultationLang: 'Tiếng Việt',
      reviewCount: 16,
      isVerified: true,
    },
  },
  {
    key: 'mentor-gia-han',
    fullName: 'Đỗ Gia Hân',
    email: 'gia.han@example.com',
    role: 'MENTOR',
    password: 'Mentor@123456',
    note: 'Mentor dữ liệu và KPI sản phẩm',
    profile: {
      avatarUrl: null,
      coverImageUrl: null,
      phoneNumber: '0978 334 552',
      location: 'Cầu Giấy, Hà Nội',
      birthYear: 1994,
      gender: 'FEMALE',
      province: 'Hà Nội',
      schoolOrCompany: 'MoMo',
      department: 'Data Insights',
      bio: 'Làm việc với dữ liệu sản phẩm, dashboard và storytelling cho team sản phẩm.',
      githubUrl: null,
      linkedinUrl: null,
      jobTitle: 'Data Analyst',
    },
    mentor: {
      title: 'Data Analyst tại MoMo',
      bio: 'Giúp sinh viên đọc dữ liệu, chọn KPI và trình bày insight thuyết phục hơn.',
      level: 'MIDDLE',
      expertiseArea: 'Data, Analytics, SQL',
      yearsOfExperience: 7,
      hourlyRate: 350000,
      currentSchool: null,
      currentCompany: 'MoMo',
      currentJobTitle: 'Data Analyst',
      consultationLang: 'Tiếng Việt',
      reviewCount: 21,
      isVerified: true,
    },
  },
];

const blogContent = sanitizeRichText(`
# ${BLOG_TITLE}

Nếu bạn đang ở giai đoạn chuẩn bị thực tập, điều quan trọng nhất không phải là học thật nhiều, mà là học đúng thứ trong thời gian đủ ngắn. Một kế hoạch 12 tuần sẽ giúp bạn nhìn rõ mục tiêu, đo tiến độ và tránh tình trạng ôm quá nhiều chủ đề cùng lúc.

## 1. Chọn một mục tiêu chính

Trước khi bắt đầu, hãy trả lời thật rõ ba câu hỏi:

- Bạn muốn thực tập ở mảng nào: frontend, backend, dữ liệu hay product?
- Kết quả cuối cùng cần có là gì: CV, portfolio, bài test hay mock interview?
- Mỗi tuần bạn có thể dành bao nhiêu giờ học tập trung?

> Kế hoạch tốt không phải là kế hoạch dài nhất, mà là kế hoạch bạn có thể làm đều đặn đến cuối cùng.

## 2. Chia 12 tuần thành 3 chặng

### Tuần 1–4: Củng cố nền tảng

- Ôn lại kiến thức cốt lõi của chuyên ngành.
- Chọn một project nhỏ để luyện tay.
- Viết ghi chú ngắn sau mỗi buổi học.

### Tuần 5–8: Nâng chất lượng đầu ra

- Hoàn thiện project chính với README rõ ràng.
- Rà lại CV, mô tả kinh nghiệm và kỹ năng.
- Bắt đầu luyện câu hỏi phỏng vấn theo nhóm chủ đề.

### Tuần 9–12: Chuyển sang chế độ ứng tuyển

- Gửi hồ sơ thử cho các vị trí phù hợp.
- Làm mock interview cùng bạn bè hoặc mentor.
- Rà lại những câu hỏi mình hay trả lời chưa rõ.

## 3. Một checklist hàng tuần rất đơn giản

\`\`\`ts
const weeklyPlan = [
  'Ôn kiến thức nền',
  'Làm 1 bài tập nhỏ',
  'Viết ghi chú',
  'Luyện phỏng vấn thử',
  'Rà lại CV và portfolio',
];
\`\`\`

Checklist này không cần cầu kỳ. Điều quan trọng là bạn giữ được nhịp đều trong nhiều tuần, thay vì học dồn rồi bỏ giữa chừng.

## 4. Đừng học một mình quá lâu

Khi có mentor hoặc bạn học đồng hành, bạn sẽ thấy rõ mình đang thiếu gì và cần sửa gì. Một buổi review ngắn có thể tiết kiệm cho bạn rất nhiều tuần đi sai hướng.

Bạn có thể bắt đầu từ việc xem lại các mentor phù hợp trong [danh sách mentor](/mentors), sau đó chọn một người có kinh nghiệm gần với mục tiêu của mình.

## 5. Kết luận

Một lộ trình tốt cần ba thứ: mục tiêu rõ, nhịp học đều và phản hồi sớm. Nếu bạn làm được ba điều đó trong 12 tuần, cơ hội phỏng vấn thực tập sẽ sáng hơn rất nhiều.
`);

const backendPortfolioContent = sanitizeRichText(`
# Thiết kế portfolio backend để vượt qua vòng hồ sơ

Một portfolio backend tốt không cần quá nhiều dự án, nhưng cần cho người xem hiểu rõ bạn xử lý vấn đề gì, chọn công nghệ như thế nào và kết quả ra sao.

## 1. Bắt đầu từ một bài toán cụ thể

- Quản lý lịch học
- Đăng ký mentor
- Theo dõi tiến độ học
- Gửi thông báo nhắc lịch

> Dự án có ngữ cảnh rõ luôn giúp bạn trả lời phỏng vấn tự tin hơn.

## 2. README phải đủ ngắn để đọc hết

\`\`\`md
# Study Mentor API
- Mục tiêu: hỗ trợ sinh viên quản lý lịch học và đặt lịch mentor
- Stack: Node.js, Express, Prisma, MySQL
- Điểm nổi bật: JWT, phân quyền, audit log
\`\`\`

## 3. Đừng quên phần vận hành

- Ghi chú cách chạy local
- Chỉ rõ biến môi trường cần thiết
- Thêm ví dụ request/response quan trọng

Nếu bạn muốn xem portfolio mẫu theo từng vai trò, hãy bắt đầu từ [trang mentor](/mentors) để hiểu người đọc đang kỳ vọng điều gì.
`);

const uxPortfolioContent = sanitizeRichText(`
# Checklist xây portfolio UI/UX gọn và thuyết phục

Nhiều portfolio thiết kế bị dài mà không có trọng tâm. Thay vì kể tất cả, hãy chọn ít case study nhưng trình bày rõ ràng.

## 1. Chọn đúng 2 case study

- Một bài có nhiều vòng feedback
- Một bài thể hiện khả năng xử lý vấn đề
- Một bài có kết quả đo được sau khi triển khai

## 2. Viết case study theo khung ngắn

\`\`\`txt
Vấn đề -> Giải pháp -> Kết quả
\`\`\`

## 3. Cho nhà tuyển dụng thấy cách bạn tư duy

- Bối cảnh
- Lý do chọn giải pháp
- Trade-off đã cân nhắc
- Kết quả cuối cùng

> Portfolio tốt không cần đẹp nhất, mà cần giúp người xem hiểu bạn làm việc như thế nào.

Hãy thử đối chiếu case study của bạn với [danh sách mentor](/mentors) để xem phần nào còn thiếu.
`);

const analyticsPortfolioContent = sanitizeRichText(`
# Từ dữ liệu đến quyết định: cách đọc KPI cho dự án sinh viên

KPI chỉ hữu ích khi nó gắn với quyết định cụ thể. Nếu không, con số chỉ là con số.

## 1. Chọn KPI theo mục tiêu

| Mục tiêu | KPI gợi ý | Câu hỏi cần trả lời |
| --- | --- | --- |
| Thu hút người dùng mới | Activation rate | Người dùng có bắt đầu dùng tính năng chính không? |
| Giữ chân | Retention 7 ngày | Họ có quay lại không? |
| Chất lượng | Completion rate | Họ có hoàn thành luồng không? |

## 2. Đừng đo quá nhiều

- Một dashboard nên có ít nhưng đúng
- Mỗi số liệu phải trả lời một quyết định
- Nếu không hành động được, đừng thêm vào dashboard

## 3. Viết kết luận bằng ngôn ngữ sản phẩm

\`\`\`ts
const insight = 'Tăng activation 8% sau khi rút ngắn form đăng ký';
\`\`\`

> Báo cáo tốt không dừng ở dữ liệu, mà phải chỉ ra bước tiếp theo.

Nếu bạn muốn luyện đọc dữ liệu bằng mentor, hãy xem [trang mentor](/mentors) và chọn người có kinh nghiệm gần với mục tiêu của mình.
`);

const seedBlogPosts: SeedBlogPost[] = [
  {
    key: 'internship-plan',
    authorKey: 'mentor-duc-long',
    title: BLOG_TITLE,
    excerpt: BLOG_EXCERPT,
    tag: BLOG_TAG,
    readTimeText: BLOG_READ_TIME,
    keywords: BLOG_KEYWORDS,
    publishedAt: BLOG_PUBLISHED_AT,
    isFeatured: true,
    views: 268,
    likes: 41,
    content: blogContent,
    comments: [
      {
        userKey: 'student-thao-vy',
        content:
          'Bài viết rất thực tế, em sẽ chia lại kế hoạch học theo từng tuần để dễ theo dõi tiến độ hơn.',
      },
      {
        guestName: 'Mai Linh',
        content:
          'Cách chia ba chặng 12 tuần rất dễ áp dụng cho người mới bắt đầu chuẩn bị hồ sơ thực tập.',
      },
    ],
  },
  {
    key: 'backend-portfolio',
    authorKey: 'mentor-minh-duc',
    title: 'Thiết kế portfolio backend để vượt qua vòng hồ sơ',
    excerpt:
      'Một portfolio backend hiệu quả cần kể được câu chuyện kỹ thuật, thay vì chỉ liệt kê công nghệ đã dùng.',
    tag: 'Backend',
    readTimeText: '7 phút đọc',
    keywords: 'backend, portfolio, api, mysql, interview',
    publishedAt: new Date('2026-05-04T08:00:00.000Z'),
    isFeatured: false,
    views: 194,
    likes: 33,
    content: backendPortfolioContent,
    comments: [
      {
        userKey: 'student-gia-huy',
        content:
          'Phần checklist README rất rõ, em sẽ thêm sơ đồ API và ví dụ request/response vào project của mình.',
      },
    ],
  },
  {
    key: 'ux-portfolio',
    authorKey: 'mentor-thanh-truc',
    title: 'Checklist xây portfolio UI/UX gọn và thuyết phục',
    excerpt:
      'Portfolio UI/UX nên ít case study nhưng kể rõ được cách bạn ra quyết định và nhận phản hồi.',
    tag: 'UI/UX',
    readTimeText: '6 phút đọc',
    keywords: 'ui/ux, portfolio, case study, design system',
    publishedAt: new Date('2026-05-05T08:00:00.000Z'),
    isFeatured: false,
    views: 162,
    likes: 29,
    content: uxPortfolioContent,
    comments: [
      {
        guestName: 'Hồng Ngọc',
        content:
          'Khung case study ngắn gọn giúp em biết nên viết gì để không bị lan man trong portfolio.',
      },
    ],
  },
  {
    key: 'analytics-kpi',
    authorKey: 'mentor-gia-han',
    title: 'Từ dữ liệu đến quyết định: cách đọc KPI cho dự án sinh viên',
    excerpt:
      'KPI chỉ thật sự hữu ích khi nó gắn với một quyết định cụ thể trong sản phẩm hoặc dự án.',
    tag: 'Data',
    readTimeText: '7 phút đọc',
    keywords: 'data, kpi, dashboard, analytics, product',
    publishedAt: new Date('2026-05-06T08:00:00.000Z'),
    isFeatured: false,
    views: 181,
    likes: 35,
    content: analyticsPortfolioContent,
    comments: [
      {
        userKey: 'student-thao-vy',
        content:
          'Bảng KPI và ví dụ insight giúp em hiểu rõ hơn cách viết phần kết luận cho project môn học.',
      },
    ],
  },
];

const seedAccountsMarkdown = [
  '# Seed Accounts',
  '',
  '> File này được sinh từ seed cố định để tránh tạo trùng account ở các lần test sau.',
  '',
  '| Vai trò | Họ tên | Email | Mật khẩu | Ghi chú |',
  '| --- | --- | --- | --- | --- |',
  ...seedAccounts.map((account) => {
    const role = escapeMarkdownCell(account.role);
    const fullName = escapeMarkdownCell(account.fullName);
    const email = escapeMarkdownCell(account.email);
    const password = escapeMarkdownCell(account.password);
    const note = escapeMarkdownCell(account.note);
    return `| ${role} | ${fullName} | ${email} | ${password} | ${note} |`;
  }),
  '',
].join('\n');

const prismaDir = fileURLToPath(new URL('.', import.meta.url));
const seedAccountsPath = resolve(prismaDir, 'seed-accounts.md');

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br />');
}

function cleanSingleLine(value: string | null): string | null {
  if (value === null) return null;
  return sanitizeSingleLineText(value);
}

function cleanRichText(value: string | null): string | null {
  if (value === null) return null;
  return sanitizeRichText(value);
}

function ensureUniqueSeedDefinitions() {
  const emails = seedAccounts.map((account) => sanitizeEmailAddress(account.email));
  const slugs = seedAccounts.map((account) => slugify(account.fullName));

  if (new Set(emails).size !== emails.length) {
    throw new Error('Seed accounts contain duplicate emails.');
  }

  if (new Set(slugs).size !== slugs.length) {
    throw new Error('Seed accounts contain duplicate generated slugs.');
  }
}

async function resetDatabase() {
  const tables = await prisma.$queryRaw<Array<{ tableName: string }>>`
    SELECT table_name AS tableName
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
      AND table_name <> 'prisma_migrations'
    ORDER BY table_name ASC
  `;

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

  try {
    for (const { tableName } of tables) {
      const escapedTableName = tableName.replace(/`/g, '``');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${escapedTableName}\``);
    }
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function buildSeedAccounts() {
  const hashedSeedAccounts: SeedAccountWithHash[] = await Promise.all(
    seedAccounts.map(async (account) => ({
      ...account,
      passwordHash: await hashPassword(account.password),
    })),
  );

  const seededUsers = new Map<string, SeededUser>();

  await prisma.$transaction(async (tx) => {
    for (const account of hashedSeedAccounts) {
      const user = await tx.user.create({
        data: {
          fullName: sanitizeSingleLineText(account.fullName),
          email: sanitizeEmailAddress(account.email),
          passwordHash: account.passwordHash,
          role: account.role,
          status: 'ACTIVE',
          emailVerifiedAt: SEED_TIME,
          profile: {
            create: {
              avatarUrl: account.profile.avatarUrl,
              coverImageUrl: account.profile.coverImageUrl,
              phoneNumber: cleanSingleLine(account.profile.phoneNumber),
              location: cleanSingleLine(account.profile.location),
              birthYear: account.profile.birthYear,
              gender: account.profile.gender,
              province: cleanSingleLine(account.profile.province),
              schoolOrCompany: cleanSingleLine(account.profile.schoolOrCompany),
              department: cleanSingleLine(account.profile.department),
              bio: cleanRichText(account.profile.bio),
              githubUrl: account.profile.githubUrl,
              linkedinUrl: account.profile.linkedinUrl,
              jobTitle: cleanSingleLine(account.profile.jobTitle),
            },
          },
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      });

      seededUsers.set(account.key, user);

      if (account.mentor) {
        await tx.mentor.create({
          data: {
            userId: user.id,
            name: user.fullName,
            slug: slugify(user.fullName),
            avatarUrl: account.profile.avatarUrl,
            title: cleanSingleLine(account.mentor.title),
            bio: cleanRichText(account.mentor.bio),
            level: account.mentor.level,
            expertiseArea: cleanSingleLine(account.mentor.expertiseArea),
            yearsOfExperience: account.mentor.yearsOfExperience,
            hourlyRate: account.mentor.hourlyRate,
            currentSchool: cleanSingleLine(account.mentor.currentSchool),
            currentCompany: cleanSingleLine(account.mentor.currentCompany),
            currentJobTitle: cleanSingleLine(account.mentor.currentJobTitle),
            consultationLang: cleanSingleLine(account.mentor.consultationLang),
            reviewCount: account.mentor.reviewCount,
            isVerified: account.mentor.isVerified,
            status: 'ACTIVE',
          },
        });
      }
    }

    const resolveSeededUser = (key: string): SeededUser => {
      const user = seededUsers.get(key);
      if (!user) {
        throw new Error(`Seed user was not created: ${key}.`);
      }

      return user;
    };

    const admin = resolveSeededUser('admin');

    for (const blogSeed of seedBlogPosts) {
      const author = resolveSeededUser(blogSeed.authorKey);

      const blogPost = await tx.blogPost.create({
        data: {
          authorId: author.id,
          title: sanitizeSingleLineText(blogSeed.title),
          slug: slugify(blogSeed.title),
          excerpt: sanitizeSingleLineText(blogSeed.excerpt),
          content: blogSeed.content,
          tag: blogSeed.tag,
          coverImageUrl: null,
          readTimeText: blogSeed.readTimeText,
          status: 'PUBLISHED',
          isFeatured: blogSeed.isFeatured,
          metaTitle: sanitizeSingleLineText(blogSeed.title),
          metaDescription: sanitizeSingleLineText(blogSeed.excerpt),
          canonicalUrl: null,
          ogImageUrl: null,
          noIndex: false,
          keywords: blogSeed.keywords,
          views: blogSeed.views,
          likes: blogSeed.likes,
          publishedAt: blogSeed.publishedAt,
          scheduledAt: null,
          publishedBy: admin.id,
        },
      });

      if (blogSeed.comments.length > 0) {
        await tx.blogComment.createMany({
          data: blogSeed.comments.map((comment) => ({
            postId: blogPost.id,
            userId: comment.userKey ? resolveSeededUser(comment.userKey).id : null,
            guestName: comment.guestName ? sanitizeSingleLineText(comment.guestName) : null,
            content: sanitizeRichText(comment.content),
            status: 'VISIBLE',
          })),
        });
      }
    }
  });
}

async function assertSeedState() {
  const [adminCount, userCount, profileCount, mentorCount, blogPostCount, blogCommentCount] =
    await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count(),
      prisma.userProfile.count(),
      prisma.mentor.count(),
      prisma.blogPost.count(),
      prisma.blogComment.count(),
    ]);

  const expectedMentorCount = seedAccounts.filter((account) => account.role === 'MENTOR').length;
  const expectedBlogPostCount = seedBlogPosts.length;
  const expectedBlogCommentCount = seedBlogPosts.reduce(
    (total, blogPost) => total + blogPost.comments.length,
    0,
  );

  if (adminCount !== 1) {
    throw new Error(`Expected exactly one admin account, received ${adminCount}.`);
  }

  if (userCount !== seedAccounts.length) {
    throw new Error(`Expected ${seedAccounts.length} users, received ${userCount}.`);
  }

  if (profileCount !== seedAccounts.length) {
    throw new Error(`Expected ${seedAccounts.length} profiles, received ${profileCount}.`);
  }

  if (mentorCount !== expectedMentorCount) {
    throw new Error(`Expected ${expectedMentorCount} mentors, received ${mentorCount}.`);
  }

  if (blogPostCount !== expectedBlogPostCount) {
    throw new Error(`Expected ${expectedBlogPostCount} blog posts, received ${blogPostCount}.`);
  }

  if (blogCommentCount !== expectedBlogCommentCount) {
    throw new Error(`Expected ${expectedBlogCommentCount} blog comments, received ${blogCommentCount}.`);
  }
}

async function writeSeedAccountsManifest() {
  await mkdir(prismaDir, { recursive: true });
  await writeFile(seedAccountsPath, seedAccountsMarkdown, 'utf8');
}

async function main() {
  ensureUniqueSeedDefinitions();
  await resetDatabase();
  await buildSeedAccounts();
  await assertSeedState();
  await writeSeedAccountsManifest();

  console.log('Seed completed successfully.');
  console.log(`Seed accounts manifest: ${seedAccountsPath}`);
}

main()
  .catch((error) => {
    console.error('Seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
