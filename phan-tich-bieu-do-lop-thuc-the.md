# Phân tích hệ thống phục vụ vẽ biểu đồ lớp thực thể

Tài liệu này tổng hợp các thực thể chính, quan hệ, trạng thái và ranh giới nghiệp vụ của hệ thống để dùng làm đầu vào cho AI khác sinh **biểu đồ lớp thực thể**.

---

## 1) Tổng quan hệ thống

Hệ thống có 6 cụm nghiệp vụ lớn:

1. **Xác thực / tài khoản**
2. **Hồ sơ người dùng / quản trị user**
3. **Mentor / lịch trống / đặt lịch**
4. **Conversation / message / notification**
5. **Assessment / kết quả gợi ý**
6. **Blog / comment / audit log**

### Ý nghĩa mô hình
- **User** là thực thể gốc của tài khoản.
- **UserProfile** là hồ sơ mở rộng của User.
- **Mentor** là hồ sơ chuyên gia, có thể liên kết hoặc không liên kết với User.
- **MentorBooking** là thực thể giao dịch trung tâm cho nghiệp vụ đặt lịch.
- **Conversation** phụ thuộc vào booking, không nên xem là độc lập hoàn toàn.
- **Notification** là dữ liệu phát sinh từ sự kiện nghiệp vụ, không phải nguồn sự thật.
- **AssessmentAttempt** lưu lịch sử làm bài, kết quả mới nhất được dùng cho gợi ý mentor.
- **BlogPost** và **BlogComment** có vòng đời riêng, kèm soft delete / moderation.
- **Audit log** là cụm riêng, phục vụ truy vết admin.

---

## 2) Danh sách thực thể chính

## 2.1 User

### Vai trò
Thực thể tài khoản trung tâm của toàn hệ thống.

### Thuộc tính chính
- `id`
- `fullName`
- `email` (unique)
- `passwordHash`
- `role`
- `status`
- `emailVerifiedAt`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `UserRole`: `STUDENT | MENTOR | ADMIN`
- `UserStatus`: `ACTIVE | SUSPENDED | BLOCKED`

### Quan hệ
- 1–1 `UserProfile`
- 0..1–1 `Mentor`
- 1–n `AuthSession`
- 1–n `EmailVerificationToken`
- 1–n `PasswordResetToken`
- 1–n `BlogPost` (tác giả)
- 1–n `BlogComment` (nếu comment bằng tài khoản)
- 1–n `AssessmentAttempt`
- 1–n `MentorBooking` (vai trò student)
- 1–n `Conversation` (vai trò student)
- 1–n `Message`
- 1–n `Notification`
- 1–n `UserAdminAuditLog` (actor/target)
- 1–n `AdminAuditLog` (actor)

### Ghi chú modeling
- Nên coi `User` là **aggregate root**.
- Không gộp dữ liệu profile / mentor vào User nếu cần tách vai trò.

---

## 2.2 UserProfile

### Vai trò
Hồ sơ mở rộng cho user.

### Thuộc tính chính
- `id`
- `userId` (unique)
- `avatarUrl`
- `coverImageUrl`
- `phoneNumber`
- `location`
- `birthYear`
- `gender`
- `province`
- `schoolOrCompany`
- `department`
- `bio`
- `githubUrl`
- `linkedinUrl`
- `jobTitle`
- `createdAt`
- `updatedAt`

### Quan hệ
- Thuộc về đúng 1 `User`

### Ghi chú modeling
- Đây là entity satellite của User.
- Hợp lý hơn nếu biểu diễn riêng thay vì nhét hết vào User.

---

## 2.3 Mentor

### Vai trò
Hồ sơ mentor / chuyên gia.

### Thuộc tính chính
- `id`
- `userId` (unique, nullable)
- `name`
- `slug` (unique)
- `avatarUrl`
- `title`
- `bio`
- `level`
- `expertiseArea`
- `yearsOfExperience`
- `hourlyRate`
- `currentSchool`
- `currentCompany`
- `currentJobTitle`
- `consultationLang`
- `reviewCount`
- `isVerified`
- `status`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `MentorLevel`
- `MentorStatus`: `ACTIVE | PAUSED`

### Quan hệ
- 0..1–1 `User`
- 1–n `MentorAvailability`
- 0..1–1 `MentorBookingSetting`
- 1–n `MentorBooking`
- 1–n `Conversation`

### Ghi chú modeling
- Một User chỉ map tối đa một Mentor.
- Mentor có thể tồn tại độc lập ở mức admin tạo dữ liệu.
- `slug` là khóa tự nhiên quan trọng cho route public.

---

## 2.4 MentorAvailability

### Vai trò
Khung giờ lặp theo tuần.

### Thuộc tính chính
- `id`
- `mentorId`
- `weekday`
- `startMinute`
- `endMinute`
- `isActive`
- `createdAt`
- `updatedAt`

### Quan hệ
- Thuộc về 1 `Mentor`

### Ghi chú modeling
- Đây là template lịch lặp, không phải lịch booking thực tế.
- Dùng để kiểm tra slot khi tạo booking.

---

## 2.5 MentorBookingSetting

### Vai trò
Cấu hình chính sách đặt lịch cho từng mentor.

### Thuộc tính chính
- `id`
- `mentorId` (unique)
- `minDurationMinute`
- `maxDurationMinute`
- `defaultDurationMinute`
- `durationStepMinute`
- `bookingNoticeHour`
- `maxAdvanceDay`
- `bufferBeforeMinute`
- `bufferAfterMinute`
- `autoConfirm`
- `createdAt`
- `updatedAt`

### Quan hệ
- 1–1 `Mentor`

### Ghi chú modeling
- Là entity cấu hình phụ thuộc mentor.
- Ảnh hưởng trực tiếp validation khi tạo booking.

---

## 2.6 MentorBooking

### Vai trò
Thực thể giao dịch trung tâm của toàn cụm đặt lịch.

### Thuộc tính chính
- `id`
- `mentorId`
- `studentUserId`
- `startAt`
- `endAt`
- `durationMinute`
- `status`
- `requestType`
- `note`
- `cancelReason`
- `cancelledBy`
- `cancelledAt`
- `confirmedAt`
- `completedAt`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `BookingStatus`: `REQUESTED | CONFIRMED | CANCELLED_BY_STUDENT | CANCELLED_BY_MENTOR | COMPLETED | NO_SHOW`
- `BookingRequestType`: `AVAILABILITY_SLOT | CUSTOM_TIME`
- `BookingCancellationActor`: `STUDENT | MENTOR | SYSTEM`

### Quan hệ
- Thuộc về 1 `Mentor`
- Thuộc về 1 `User` ở vai trò student
- 0..1–1 `Conversation`

### Ghi chú modeling
- Đây là **nguồn sự thật** cho vòng đời booking.
- Các entity như conversation, notification, audit đều phát sinh từ booking.
- Nên thể hiện rõ trạng thái lifecycle.

---

## 2.7 Conversation

### Vai trò
Luồng chat gắn với booking.

### Thuộc tính chính
- `id`
- `bookingId` (unique)
- `mentorId`
- `studentUserId`
- `type`
- `lastMessageAt`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `ConversationType`: `BOOKING_DIRECT`

### Quan hệ
- 1–1 `MentorBooking`
- Thuộc về 1 `Mentor`
- Thuộc về 1 `User` ở vai trò student
- 1–n `Message`

### Ghi chú modeling
- Không nên xem conversation là entity độc lập toàn cục.
- Nó phụ thuộc booking và chỉ hợp lệ sau khi booking được xác nhận.

---

## 2.8 Message

### Vai trò
Tin nhắn trong conversation.

### Thuộc tính chính
- `id`
- `conversationId`
- `senderUserId`
- `type`
- `content`
- `readAt`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `MessageType`: `TEXT | SYSTEM`

### Quan hệ
- Thuộc về 1 `Conversation`
- Thuộc về 1 `User` (sender)

### Ghi chú modeling
- Message hệ thống nên được biểu diễn riêng với message text thường.

---

## 2.9 Notification

### Vai trò
Hộp thư thông báo của user.

### Thuộc tính chính
- `id`
- `userId`
- `type`
- `title`
- `body`
- `dataJson`
- `dedupeKey` (unique, nullable)
- `readAt`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `NotificationType` theo luồng booking / reminder

### Quan hệ
- Thuộc về 1 `User`

### Ghi chú modeling
- Đây là dữ liệu sinh từ event.
- Không nên coi nó là nguồn sự thật của booking hay chat.

---

## 2.10 AuthSession

### Vai trò
Phiên đăng nhập / refresh session.

### Thuộc tính chính
- `id`
- `userId`
- `tokenHash` (unique)
- `userAgent`
- `ipAddress`
- `expiresAt`
- `revokedAt`
- `createdAt`
- `updatedAt`

### Quan hệ
- Thuộc về 1 `User`

### Ghi chú modeling
- Chỉ lưu hash token, không lưu token thô.

---

## 2.11 EmailVerificationToken

### Vai trò
Token xác minh email.

### Thuộc tính chính
- `id`
- `userId`
- `tokenHash` (unique)
- `expiresAt`
- `usedAt`
- `createdAt`
- `updatedAt`

### Quan hệ
- Thuộc về 1 `User`

---

## 2.12 PasswordResetToken

### Vai trò
Token đặt lại mật khẩu.

### Thuộc tính chính
- `id`
- `userId`
- `tokenHash` (unique)
- `expiresAt`
- `usedAt`
- `createdAt`
- `updatedAt`

### Quan hệ
- Thuộc về 1 `User`

---

## 2.13 AssessmentAttempt

### Vai trò
Lưu lịch sử làm assessment và kết quả.

### Thuộc tính chính
- `id`
- `userId`
- `quizType`
- `quizVersion`
- `status`
- `resultCode`
- `topTraits`
- `rawScoresJson`
- `answersJson`
- `summaryJson`
- `startedAt`
- `submittedAt`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `AssessmentQuizType`: `IT_COMPASS_V1`
- `AssessmentAttemptStatus`: `SUBMITTED`

### Quan hệ
- Thuộc về 1 `User`

### Ghi chú modeling
- Kết quả mới nhất thường là dữ liệu được dùng nhiều nhất.
- `summaryJson` là payload dẫn xuất cho recommendation.

---

## 2.14 BlogPost

### Vai trò
Bài blog với vòng đời nội dung + SEO.

### Thuộc tính chính
- `id`
- `authorId`
- `title`
- `slug` (unique)
- `excerpt`
- `content`
- `tag`
- `coverImageUrl`
- `readTimeText`
- `status`
- `isFeatured`
- `metaTitle`
- `metaDescription`
- `canonicalUrl`
- `ogImageUrl`
- `noIndex`
- `keywords`
- `views`
- `likes`
- `publishedAt`
- `scheduledAt`
- `publishedBy`
- `deletedAt`
- `deletedBy`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `BlogPostStatus`: `DRAFT | SCHEDULED | PUBLISHED`

### Quan hệ
- Thuộc về 1 `User` làm tác giả
- 1–n `BlogComment`

### Ghi chú modeling
- Có soft delete + scheduled publish.
- Trạng thái bài viết là một state machine quan trọng.

---

## 2.15 BlogComment

### Vai trò
Bình luận bài viết.

### Thuộc tính chính
- `id`
- `postId`
- `userId` (nullable)
- `guestName` (nullable)
- `content`
- `status`
- `deletedAt`
- `deletedBy`
- `createdAt`
- `updatedAt`

### Enum liên quan
- `BlogCommentStatus`: `VISIBLE | HIDDEN`

### Quan hệ
- Thuộc về 1 `BlogPost`
- Có thể thuộc về 1 `User` hoặc comment ẩn danh qua `guestName`

### Ghi chú modeling
- Hỗ trợ guest comment.
- Có moderation/soft-delete.

---

## 2.16 UserAdminAuditLog

### Vai trò
Audit riêng cho thao tác admin với user.

### Thuộc tính chính
- `id`
- `actorUserId`
- `targetUserId`
- `action`
- `reason`
- `beforeJson`
- `afterJson`
- `createdAt`

### Quan hệ
- Actor là 1 `User`
- Target là 1 `User`

### Ghi chú modeling
- Nên tách riêng khỏi audit tổng quát vì có before/after snapshot user.

---

## 2.17 AdminAuditLog

### Vai trò
Audit tổng quát cho thao tác admin.

### Thuộc tính chính
- `id`
- `actorUserId`
- `action`
- `targetType`
- `targetId`
- `reason`
- `metadataJson`
- `createdAt`

### Quan hệ
- Actor là 1 `User`

### Ghi chú modeling
- Dùng cho blog/comment và các thao tác admin khác.

---

## 3) Quan hệ tổng thể giữa các thực thể

### Quan hệ cốt lõi
- `User 1—1 UserProfile`
- `User 0..1—1 Mentor`
- `Mentor 1—n MentorAvailability`
- `Mentor 1—1 MentorBookingSetting`
- `Mentor 1—n MentorBooking`
- `User 1—n MentorBooking` (student)
- `MentorBooking 0..1—1 Conversation`
- `Conversation 1—n Message`
- `User 1—n Message` (sender)
- `User 1—n Notification`
- `User 1—n AuthSession`
- `User 1—n EmailVerificationToken`
- `User 1—n PasswordResetToken`
- `User 1—n AssessmentAttempt`
- `User 1—n BlogPost` (author)
- `BlogPost 1—n BlogComment`
- `User 1—n BlogComment` (nếu có tài khoản)
- `User 1—n UserAdminAuditLog` (actor/target)
- `User 1—n AdminAuditLog` (actor)

---

## 4) Trạng thái / enum nên thể hiện trong class diagram

### User
- `role`
- `status`

### Mentor
- `level`
- `status`
- `isVerified`

### Booking
- `status`
- `requestType`
- `cancelledBy`

### Conversation
- `type`

### Message
- `type`

### Notification
- `type`

### Assessment
- `quizType`
- `status`

### Blog
- `status`

### Comment
- `status`

### Audit
- `action`
- `targetType`

---

## 5) Các flow nghiệp vụ ảnh hưởng trực tiếp đến mô hình

## 5.1 Auth flow
- Đăng ký tạo `User` + `UserProfile`.
- Xác minh email dùng `EmailVerificationToken`.
- Đăng nhập / refresh tạo `AuthSession`.
- Quên mật khẩu dùng `PasswordResetToken`.
- Logout revoke session.

## 5.2 User profile flow
- User tự cập nhật profile của chính mình.
- Không cho client chọn `userId` trực tiếp.

## 5.3 Mentor flow
- Mentor public read từ `Mentor`.
- Mentor self-service có thể upsert mentor nếu chưa có.
- `slug` phải unique.

## 5.4 Booking flow
Booking là flow phức tạp nhất.

Khi tạo booking cần kiểm tra:
- duration nằm trong `MentorBookingSetting`
- step phút hợp lệ
- booking trước bao lâu (`bookingNoticeHour`)
- không vượt `maxAdvanceDay`
- có nằm trong `MentorAvailability`
- không overlap booking khác
- buffer trước/sau

Khi booking đổi trạng thái:
- tạo conversation nếu booking được confirm
- tạo notification cho mentor/student
- ghi nhận `confirmedAt`, `completedAt`, `cancelledAt`
- có thể chuyển sang `NO_SHOW`

## 5.5 Conversation / message flow
- Conversation chỉ hợp lệ sau booking.
- Message chỉ gửi trong conversation hợp lệ.
- Có `lastMessageAt` để tối ưu danh sách chat.

## 5.6 Notification flow
- Notification được sinh từ sự kiện booking / reminder.
- Dùng `dedupeKey` để tránh trùng.
- `readAt` là trạng thái đã đọc.

## 5.7 Assessment flow
- Assessment attempt thuộc về user.
- Kết quả mới nhất thường được dùng để gợi ý mentor.
- Phần score / answer / summary lưu JSON để linh hoạt.

## 5.8 Blog flow
- Public chỉ thấy bài published.
- Admin quản lý draft / scheduled / published.
- Comment hỗ trợ user hoặc guest.
- Có soft delete và moderation.

## 5.9 Admin audit flow
- Mọi thao tác admin quan trọng đều nên ghi audit.
- `UserAdminAuditLog` dùng cho thay đổi user.
- `AdminAuditLog` dùng cho blog/comment và thao tác tổng quát.

---

## 6) Gợi ý khi vẽ biểu đồ lớp thực thể

### Nên giữ
- Các entity chính ở mức domain: `User`, `UserProfile`, `Mentor`, `MentorAvailability`, `MentorBookingSetting`, `MentorBooking`, `Conversation`, `Message`, `Notification`, `AssessmentAttempt`, `BlogPost`, `BlogComment`, `AuthSession`, `EmailVerificationToken`, `PasswordResetToken`, `UserAdminAuditLog`, `AdminAuditLog`.
- Enum trạng thái chính.
- Bội số quan hệ 1–1, 1–n, 0..1–1.

### Nên làm nổi bật
- `MentorBooking` là trung tâm của booking domain.
- `Conversation` phụ thuộc `MentorBooking`.
- `Notification` là entity phát sinh từ event.
- `BlogPost` có state machine.
- `AssessmentAttempt.summaryJson` là payload dẫn xuất.

### Không nên làm
- Không gộp tất cả trường vào `User`.
- Không coi `Conversation` là entity độc lập với booking.
- Không coi `Notification` là nguồn dữ liệu gốc.
- Không làm `BlogComment` chỉ dành cho user, vì hệ thống có guest comment.

---

## 7) Mô tả ngắn gọn để AI khác dựng diagram

Nếu cần prompt ngắn cho AI vẽ ảnh, có thể dùng:

> Hãy vẽ biểu đồ lớp thực thể cho hệ thống gồm các entity: User, UserProfile, Mentor, MentorAvailability, MentorBookingSetting, MentorBooking, Conversation, Message, Notification, AuthSession, EmailVerificationToken, PasswordResetToken, AssessmentAttempt, BlogPost, BlogComment, UserAdminAuditLog, AdminAuditLog. Thể hiện đầy đủ quan hệ 1-1, 1-n, 0..1-1, cùng các enum trạng thái như UserRole, UserStatus, MentorStatus, BookingStatus, BlogPostStatus, BlogCommentStatus. Nhấn mạnh MentorBooking là entity trung tâm của booking domain và Conversation phụ thuộc vào MentorBooking.

---

## 8) Kết luận

Mô hình dữ liệu của hệ thống có thể chia thành:
- **Core account model**: User + profile/token/session
- **Mentor booking model**: Mentor + availability + setting + booking + conversation + message + notification
- **Assessment model**: assessment attempt + kết quả
- **Content model**: blog post + comment
- **Audit model**: admin audit log

Tài liệu này đủ để AI khác dựng class diagram ở mức domain/entity mà không cần đọc thêm toàn bộ source.
