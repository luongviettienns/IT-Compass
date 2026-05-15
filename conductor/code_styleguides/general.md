# General Code Style Guide

Nguyên tắc chung áp dụng cho toàn bộ codebase ITCompass.

## Độ rõ ràng

- Viết code để người đọc hiểu trước, máy tính hiểu sau.
- Ưu tiên cấu trúc đơn giản, dễ đọc hơn là mẹo vặt khó hiểu.
- Nếu một đoạn code cần comment để giải thích WHAT, hãy cân nhắc viết lại.

## Cấu trúc

- Giữ function ngắn và có một nhiệm vụ rõ ràng.
- Tách logic theo cấp độ abstraction.
- Dùng early return để giảm lồng nhau.
- Nhóm code liên quan lại gần nhau.

## Đặt tên

- Tên phải nói rõ ý định.
- Tránh viết tắt mơ hồ.
- Dùng động từ cho function, danh từ cho type/class.

## Comment

Chỉ comment để giải thích **WHY** hoặc một ngoại lệ không hiển nhiên.

Nên comment khi:

- Có workaround đặc biệt.
- Có business rule khó thấy từ code.
- Có ràng buộc bảo mật hoặc realtime cần ghi nhớ.

Không nên comment khi:

- Code đã tự nói đủ.
- Chỉ lặp lại điều function đang làm.
- Để lại TODO mơ hồ.

## Xử lý lỗi

- Fail fast và rõ ràng.
- Giữ context lỗi khi rethrow.
- Trả message đủ giúp người dùng biết phải làm gì tiếp theo.
- Không nuốt lỗi.

## Kiến trúc file

- Mỗi file nên có một ý chính.
- Import theo nhóm rõ ràng.
- Hạn chế coupling không cần thiết.

## Testing mindset

- Viết code dễ test.
- Tránh global state nếu không cần.
- Ưu tiên hàm nhỏ, input/output rõ.

## Bảo mật cơ bản

- Validate dữ liệu tại ranh giới hệ thống.
- Không hardcode secret.
- Không log access token, refresh token hoặc dữ liệu nhạy cảm.
- Fail closed khi có nghi ngờ về auth hoặc quyền truy cập.

## Code review

Tự hỏi trước khi merge:

- Code có dễ hiểu không?
- Edge case đã được tính tới chưa?
- Có lộ secret hay giảm bảo mật không?
- Có thêm độ phức tạp không cần thiết không?
- Có phá quy ước hiện tại không?
