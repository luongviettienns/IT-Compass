/**
 * @file serializeUser.ts - Chuyển đổi user từ database sang DTO (Data Transfer Object) trả về client.
 *
 * File này chịu trách nhiệm:
 * - Chuyển BigInt ID sang string (JSON không hỗ trợ BigInt).
 * - Chỉ expose các field profile mà frontend thực sự dùng (bảo mật + ổn định contract).
 * - Tạo auth/me response contract chuẩn cho mọi flow bootstrap/refresh/login.
 */
/**
 * Serialize user profile từ database sang DTO.
 * Chỉ expose các field profile mà frontend thực sự dùng để contract auth/me ổn định và tránh lộ quan hệ thô.
 */
const serializeUserProfile = (profile) => ({
    avatarUrl: profile.avatarUrl,
    coverImageUrl: profile.coverImageUrl,
    phoneNumber: profile.phoneNumber,
    location: profile.location,
    birthYear: profile.birthYear,
    gender: profile.gender,
    province: profile.province,
    schoolOrCompany: profile.schoolOrCompany,
    department: profile.department,
    bio: profile.bio,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    jobTitle: profile.jobTitle,
});
/**
 * Serialize user từ database sang DTO an toàn để trả về client.
 * - ID luôn trả dạng string để client JSON không phải tự xử lý bigint.
 * - Profile chỉ được gắn nếu có, tránh trả null profile khi chưa tạo.
 *
 * @param user - User object từ Prisma (có thể include profile).
 * @returns SerializedUser DTO.
 */
export const serializeUser = (user) => {
    const serialized = {
        // API luôn trả ID dạng string để client JSON không phải tự xử lý bigint.
        id: String(user.id),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
    if (user.profile) {
        serialized.profile = serializeUserProfile(user.profile);
    }
    return serialized;
};
