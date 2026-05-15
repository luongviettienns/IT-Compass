# Nguyên tắc sản phẩm

## Giọng điệu và cách nói

### Brand voice

ITCompass nói chuyện như một người hướng dẫn bình tĩnh, có chuyên môn và biết khích lệ. Nội dung cần rõ ràng, thẳng vào vấn đề, không phô trương và không làm người dùng thấy bị phán xét.

### Thuộc tính giọng điệu

- **Rõ ràng:** Câu ngắn, từ ngữ dễ hiểu, đi thẳng vào ý chính.
- **Khích lệ:** Luôn để người dùng thấy còn bước tiếp theo.
- **Đáng tin:** Không hứa quá mức, không tô vẽ kết quả.

### Biến thể theo ngữ cảnh

| Ngữ cảnh | Giọng điệu | Ví dụ |
| --- | --- | --- |
| Thành công | Tích cực, ngắn gọn | "Đã lưu kết quả. Bạn có thể xem gợi ý tiếp theo ngay." |
| Lỗi | Rõ ràng, có hành động sửa | "Không thể tải dữ liệu. Vui lòng thử lại sau." |
| Onboarding | Ấm áp, hướng dẫn | "Bắt đầu bằng vài câu hỏi ngắn để tìm hướng phù hợp hơn." |
| Empty state | Hữu ích, gợi bước tiếp theo | "Chưa có dữ liệu. Hãy làm trắc nghiệm để nhận gợi ý đầu tiên." |

### Từ ngữ nên dùng

- trắc nghiệm
- lộ trình
- mentor
- gợi ý
- phù hợp
- bước tiếp theo

### Từ ngữ nên tránh

- mơ hồ
- phóng đại quá mức
- thuật ngữ quá nặng khi không cần thiết
- văn phong quảng cáo quá tay

## Thông điệp sản phẩm

### Thông điệp chính

> Khám phá hướng IT phù hợp với bạn và biết bước tiếp theo là gì.

### Thông điệp hỗ trợ

1. Trắc nghiệm là điểm khởi đầu, không phải kết luận cuối cùng.
2. Mentor và nội dung giúp biến kết quả thành hành động.
3. Giao diện phải rõ ràng, tin cậy và dễ dùng trên mobile.

### Thứ tự ưu tiên thông điệp

1. **Phải truyền tải:** Kết quả phù hợp + bước tiếp theo.
2. **Nên truyền tải:** Blog, mentor và booking là phần mở rộng tự nhiên.
3. **Có thể truyền tải:** Cảm giác hiện đại, mượt và thân thiện của trải nghiệm.

### Thông điệp theo nhóm người dùng

| Nhóm người dùng | Thông điệp chính | Bằng chứng |
| --- | --- | --- |
| Học sinh, sinh viên | Bạn có thể tìm ra hướng IT phù hợp hơn với mình | Trắc nghiệm Holland, gợi ý ngành/nghề, kết quả rõ ràng |
| Mentor | Bạn có thể giúp người khác đi tiếp bằng kinh nghiệm của mình | Mentor profile, booking, chat realtime |

## Nguyên tắc thiết kế

### 1. Rõ ràng hơn phức tạp

Mọi màn hình cần trả lời nhanh 3 câu hỏi: tôi đang ở đâu, tôi nên làm gì tiếp, và vì sao.

**Nên làm:**

- Dùng bố cục gọn, có phân cấp rõ.
- Giữ nội dung chính dễ quét bằng mắt.

**Không nên làm:**

- Nhồi nhiều khối nội dung không cần thiết.
- Tạo wrapper hoặc lớp DOM chỉ để trang trí nếu không phục vụ layout hoặc accessibility.

### 2. Dựa trên bằng chứng và ngữ cảnh thật

Kết quả và gợi ý phải dựa trên trắc nghiệm, dữ liệu hồ sơ và các luồng nội dung thực tế của sản phẩm.

**Nên làm:**

- Giải thích ngắn vì sao gợi ý này xuất hiện.
- Cho người dùng đường đi tiếp theo ngay sau khi có kết quả.

**Không nên làm:**

- Nói chung chung kiểu “rất phù hợp” mà không có cơ sở.
- Trả kết quả xong rồi để người dùng tự bơi.

### 3. Mobile-first, tin cậy và dễ đọc

Phần lớn người dùng mục tiêu sẽ xem trên điện thoại trước tiên, nên UI cần nhẹ, cân bằng và dễ thao tác bằng ngón tay.

**Nên làm:**

- Ưu tiên spacing hợp lý và CTA rõ.
- Chữ đủ lớn, tương phản tốt, trạng thái rõ.

**Không nên làm:**

- Nhét quá nhiều thông tin vào một màn hình.
- Hy sinh khả năng đọc chỉ để tăng hiệu ứng thị giác.

## Tiêu chuẩn accessibility

### Mục tiêu

WCAG 2.1 AA là chuẩn tham chiếu tối thiểu.

### Yêu cầu cốt lõi

#### Perceivable

- Ảnh có alt text có ý nghĩa.
- Không dùng màu sắc làm tín hiệu duy nhất.
- Tỷ lệ tương phản đủ tốt.
- Nội dung đọc được ở mức zoom cao.

#### Operable

- Mọi chức năng dùng được bằng keyboard.
- Focus state luôn nhìn thấy được.
- Không có chuyển động gây chói mắt hoặc quá gắt.

#### Understandable

- Ngôn ngữ ngắn gọn, dễ hiểu.
- Label và error message phải chỉ ra cách sửa.
- Điều hướng nhất quán giữa các màn hình.

#### Robust

- HTML semantic hợp lệ.
- ARIA chỉ dùng khi thật sự cần.
- Tương thích với screen reader.

### Kiểm thử

- Dùng keyboard-only để đi hết các luồng chính.
- Kiểm tra với NVDA hoặc VoiceOver.
- Kiểm tra contrast trước khi merge.
- Chạy accessibility scan tự động cho các màn hình quan trọng.

## Triết lý xử lý lỗi

### Phòng lỗi

- Validate dữ liệu ở ranh giới hệ thống.
- Giữ form state để người dùng không phải nhập lại.
- Xác nhận trước các thao tác có thể gây mất dữ liệu.

### Hiển thị lỗi

1. Nói rõ đã lỗi ở đâu.
2. Nói rõ người dùng có thể làm gì tiếp.
3. Không đổ lỗi cho người dùng.
4. Không tiết lộ chi tiết nội bộ không cần thiết.

### Mẫu thông báo lỗi

`[Điều gì xảy ra] + [Vì sao nếu cần] + [Cách sửa]`

### Ví dụ

| Xấu | Tốt |
| --- | --- |
| "Invalid input" | "Email phải có ký tự @" |
| "Error 500" | "Không thể lưu thay đổi. Vui lòng thử lại." |
| "Failed" | "Không thể kết nối. Kiểm tra mạng rồi thử lại." |

## Quy ước nội dung

### Dùng khi nào

- Giải thích WHY của một lựa chọn.
- Các workaround không hiển nhiên.
- Hành vi đặc biệt của auth, booking, realtime hoặc admin.

### Không dùng khi nào

- Chỉ để lặp lại điều code đã nói rõ.
- Để ghi lịch sử thay đổi.
- Để lại TODO mơ hồ không có ngữ cảnh.
