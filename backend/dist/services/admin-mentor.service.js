import { prisma } from '../db/prisma.js';
import { adminMentorSelect, serializeAdminMentor } from '../utils/serializeMentor.js';
import { HttpError } from '../utils/httpError.js';
import { toBigIntId } from '../utils/ids.js';
import { sanitizeNullableRichText, sanitizeNullableSingleLineText, sanitizeOptionalUrl, sanitizeSingleLineText } from '../utils/sanitize.js';
import { slugify } from '../utils/slug.js';
const normalizePositiveInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const normalizeSlugCandidate = (value) => {
    const candidate = slugify(sanitizeSingleLineText(value));
    if (!candidate) {
        throw new HttpError(400, 'Could not generate a valid slug');
    }
    return candidate;
};
const sanitizeMentorPayload = (input) => ({
    userId: input.userId === undefined ? undefined : input.userId === null ? null : toBigIntId(String(input.userId), 'userId'),
    name: input.name === undefined ? undefined : sanitizeSingleLineText(String(input.name)),
    slug: input.slug === undefined ? undefined : normalizeSlugCandidate(String(input.slug)),
    avatarUrl: sanitizeOptionalUrl(input.avatarUrl),
    title: sanitizeNullableSingleLineText(input.title),
    bio: sanitizeNullableRichText(input.bio),
    level: input.level ?? undefined,
    expertiseArea: sanitizeNullableSingleLineText(input.expertiseArea),
    yearsOfExperience: input.yearsOfExperience,
    hourlyRate: input.hourlyRate,
    currentSchool: sanitizeNullableSingleLineText(input.currentSchool),
    currentCompany: sanitizeNullableSingleLineText(input.currentCompany),
    currentJobTitle: sanitizeNullableSingleLineText(input.currentJobTitle),
    consultationLang: sanitizeNullableSingleLineText(input.consultationLang),
    reviewCount: input.reviewCount,
    isVerified: input.isVerified,
    status: input.status,
});
const ensureUserExists = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user) {
        throw new HttpError(404, 'User not found', undefined, 'USER_NOT_FOUND');
    }
    return user;
};
const ensureUniqueSlug = async (slug, excludeId) => {
    // Slug được khóa ở service layer để cả create/update/admin actions đều dùng chung một luật duy nhất.
    const existing = await prisma.mentor.findUnique({
        where: { slug },
        select: { id: true },
    });
    if (existing && existing.id !== excludeId) {
        throw new HttpError(409, 'Slug is already in use');
    }
};
const ensureUserMentorLinkAvailable = async (userId, excludeId) => {
    // Một user chỉ được gắn với một mentor profile để dashboard admin không tạo quan hệ 1-n gây lệch self-service flow.
    const existing = await prisma.mentor.findFirst({
        where: {
            userId,
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
    });
    if (existing) {
        throw new HttpError(409, 'This user is already linked to another mentor profile');
    }
};
const mentorWhereBase = ({ search, status, level, isVerified, }) => {
    const normalizedSearch = typeof search === 'string' ? sanitizeSingleLineText(search) : undefined;
    return {
        ...(status && status !== 'all' ? { status } : {}),
        ...(level ? { level } : {}),
        ...(isVerified === 'true' ? { isVerified: true } : isVerified === 'false' ? { isVerified: false } : {}),
        ...(normalizedSearch
            ? {
                OR: [
                    { name: { contains: normalizedSearch } },
                    { slug: { contains: normalizedSearch } },
                    { title: { contains: normalizedSearch } },
                    { expertiseArea: { contains: normalizedSearch } },
                    { currentCompany: { contains: normalizedSearch } },
                    { user: { is: { fullName: { contains: normalizedSearch } } } },
                    { user: { is: { email: { contains: normalizedSearch } } } },
                ],
            }
            : {}),
    };
};
const buildOrderBy = (sortBy, sortOrder) => {
    if (sortBy === 'name') {
        return [{ name: sortOrder }, { updatedAt: 'desc' }, { id: 'desc' }];
    }
    return [{ [sortBy]: sortOrder }, { updatedAt: 'desc' }, { id: 'desc' }];
};
const getMentorOrThrow = async (id) => {
    const mentor = await prisma.mentor.findUnique({
        where: { id: toBigIntId(id, 'mentor id') },
        select: adminMentorSelect,
    });
    if (!mentor) {
        throw new HttpError(404, 'Mentor not found');
    }
    return mentor;
};
export const adminListMentors = async (input) => {
    const page = normalizePositiveInt(input.page, 1);
    const limit = normalizePositiveInt(input.limit, 20);
    const sortBy = input.sortBy || 'updatedAt';
    const sortOrder = (input.sortOrder || 'desc');
    const where = mentorWhereBase(input);
    const [total, mentors, statusCounts] = await Promise.all([
        prisma.mentor.count({ where }),
        prisma.mentor.findMany({
            where,
            select: adminMentorSelect,
            orderBy: buildOrderBy(sortBy, sortOrder),
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.mentor.groupBy({
            by: ['status'],
            where,
            _count: { status: true },
        }),
    ]);
    const statusMap = new Map(statusCounts.map((item) => [item.status, item._count.status]));
    return {
        mentors: mentors.map(serializeAdminMentor),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        summary: {
            // Summary dùng cùng filter hiện tại để badge tổng hợp trên admin không mâu thuẫn với list đang xem.
            total,
            active: statusMap.get('ACTIVE') || 0,
            paused: statusMap.get('PAUSED') || 0,
            verified: await prisma.mentor.count({ where: { ...where, isVerified: true } }),
        },
    };
};
export const adminGetMentorById = async ({ id }) => {
    const mentor = await getMentorOrThrow(id);
    return serializeAdminMentor(mentor);
};
export const adminCreateMentor = async (input) => {
    const sanitized = sanitizeMentorPayload(input);
    const slug = sanitized.slug || normalizeSlugCandidate(String(sanitized.name || ''));
    await ensureUniqueSlug(slug);
    if (!sanitized.name) {
        throw new HttpError(400, 'Name is required');
    }
    if (sanitized.userId) {
        await ensureUserExists(sanitized.userId);
        await ensureUserMentorLinkAvailable(sanitized.userId);
    }
    const mentor = await prisma.mentor.create({
        data: {
            userId: sanitized.userId,
            name: sanitized.name,
            slug,
            avatarUrl: sanitized.avatarUrl,
            title: sanitized.title,
            bio: sanitized.bio,
            level: sanitized.level,
            expertiseArea: sanitized.expertiseArea,
            yearsOfExperience: sanitized.yearsOfExperience,
            hourlyRate: sanitized.hourlyRate,
            currentSchool: sanitized.currentSchool,
            currentCompany: sanitized.currentCompany,
            currentJobTitle: sanitized.currentJobTitle,
            consultationLang: sanitized.consultationLang,
            reviewCount: sanitized.reviewCount ?? 0,
            isVerified: sanitized.isVerified ?? false,
            status: sanitized.status ?? 'ACTIVE',
        },
        select: adminMentorSelect,
    });
    return serializeAdminMentor(mentor);
};
export const adminUpdateMentor = async ({ id, ...input }) => {
    const mentorId = toBigIntId(id, 'mentor id');
    await getMentorOrThrow(id);
    const sanitized = sanitizeMentorPayload(input);
    const nextSlug = sanitized.slug ?? (sanitized.name ? normalizeSlugCandidate(String(sanitized.name)) : undefined);
    if (nextSlug) {
        await ensureUniqueSlug(nextSlug, mentorId);
    }
    if (sanitized.userId) {
        await ensureUserExists(sanitized.userId);
        await ensureUserMentorLinkAvailable(sanitized.userId, mentorId);
    }
    const mentor = await prisma.mentor.update({
        where: { id: mentorId },
        data: {
            ...(sanitized.userId !== undefined ? { userId: sanitized.userId } : {}),
            ...(sanitized.name !== undefined ? { name: sanitized.name } : {}),
            ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
            ...(sanitized.avatarUrl !== undefined ? { avatarUrl: sanitized.avatarUrl } : {}),
            ...(sanitized.title !== undefined ? { title: sanitized.title } : {}),
            ...(sanitized.bio !== undefined ? { bio: sanitized.bio } : {}),
            ...(sanitized.level !== undefined ? { level: sanitized.level } : {}),
            ...(sanitized.expertiseArea !== undefined ? { expertiseArea: sanitized.expertiseArea } : {}),
            ...(sanitized.yearsOfExperience !== undefined ? { yearsOfExperience: sanitized.yearsOfExperience } : {}),
            ...(sanitized.hourlyRate !== undefined ? { hourlyRate: sanitized.hourlyRate } : {}),
            ...(sanitized.currentSchool !== undefined ? { currentSchool: sanitized.currentSchool } : {}),
            ...(sanitized.currentCompany !== undefined ? { currentCompany: sanitized.currentCompany } : {}),
            ...(sanitized.currentJobTitle !== undefined ? { currentJobTitle: sanitized.currentJobTitle } : {}),
            ...(sanitized.consultationLang !== undefined ? { consultationLang: sanitized.consultationLang } : {}),
            ...(sanitized.reviewCount !== undefined ? { reviewCount: sanitized.reviewCount } : {}),
            ...(sanitized.isVerified !== undefined ? { isVerified: sanitized.isVerified } : {}),
            ...(sanitized.status !== undefined ? { status: sanitized.status } : {}),
        },
        select: adminMentorSelect,
    });
    return serializeAdminMentor(mentor);
};
export const adminUpdateMentorStatus = async ({ id, status }) => {
    const mentor = await prisma.mentor.update({
        where: { id: toBigIntId(id, 'mentor id') },
        data: { status: status },
        select: adminMentorSelect,
    }).catch(() => {
        throw new HttpError(404, 'Mentor not found');
    });
    return serializeAdminMentor(mentor);
};
export const adminUpdateMentorVerification = async ({ id, isVerified }) => {
    const mentor = await prisma.mentor.update({
        where: { id: toBigIntId(id, 'mentor id') },
        data: { isVerified },
        select: adminMentorSelect,
    }).catch(() => {
        throw new HttpError(404, 'Mentor not found');
    });
    return serializeAdminMentor(mentor);
};
