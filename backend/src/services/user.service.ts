import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { serializeUser } from '../utils/serializeUser.js';
import { HttpError } from '../utils/httpError.js';
import {
  sanitizeNullableRichText,
  sanitizeNullableSingleLineText,
  sanitizeOptionalUrl,
  sanitizeSingleLineText,
} from '../utils/sanitize.js';

type UpdateProfileData = {
  fullName?: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  birthYear?: number | null;
  gender?: string | null;
  province?: string | null;
  schoolOrCompany?: string | null;
  department?: string | null;
  bio?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  jobTitle?: string | null;
};

export const updateProfile = async ({ userId, data }: { userId: bigint; data: UpdateProfileData }) => {
  const { fullName, ...profileData } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found', undefined, 'USER_NOT_FOUND');
  }

  const sanitizedProfileData = {
    avatarUrl: sanitizeOptionalUrl(profileData.avatarUrl),
    coverImageUrl: sanitizeOptionalUrl(profileData.coverImageUrl),
    phoneNumber: sanitizeNullableSingleLineText(profileData.phoneNumber),
    location: sanitizeNullableSingleLineText(profileData.location),
    birthYear: profileData.birthYear,
    gender: profileData.gender,
    province: sanitizeNullableSingleLineText(profileData.province),
    schoolOrCompany: sanitizeNullableSingleLineText(profileData.schoolOrCompany),
    department: sanitizeNullableSingleLineText(profileData.department),
    bio: sanitizeNullableRichText(profileData.bio),
    githubUrl: sanitizeOptionalUrl(profileData.githubUrl),
    linkedinUrl: sanitizeOptionalUrl(profileData.linkedinUrl),
    jobTitle: sanitizeNullableSingleLineText(profileData.jobTitle),
  };

  // UserProfile luôn tồn tại từ lúc đăng ký, nhưng vẫn fallback create để tránh lỗi dữ liệu cũ.
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(fullName !== undefined ? { fullName: sanitizeSingleLineText(fullName) } : {}),
      profile: user.profile
        ? {
            update: sanitizedProfileData as Prisma.UserProfileUncheckedUpdateWithoutUserInput,
          }
        : {
            create: sanitizedProfileData as Prisma.UserProfileUncheckedCreateWithoutUserInput,
          },
    },
    include: {
      profile: true,
    },
  });

  // Trả về serializeUser để ProfilePage và auth/me tiếp tục dùng cùng một contract user đã chuẩn hóa.
  return serializeUser(updatedUser);
};
