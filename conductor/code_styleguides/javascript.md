# JavaScript Style Guide

Quy ước JavaScript cho các file config, helper và phần JS thuần trong ITCompass.

## Modern syntax

- Dùng `const` trước, `let` khi cần thay đổi.
- Không dùng `var`.
- Ưu tiên object shorthand, destructuring, optional chaining và nullish coalescing.
- Dùng template literals thay vì nối chuỗi dài.

## Async patterns

- Ưu tiên `async/await`.
- Dùng `Promise.all` cho các tác vụ độc lập.
- Tránh promise chain dài nếu có thể viết rõ hơn bằng `async/await`.

## Functions

- Function nên nhỏ và rõ mục đích.
- Tránh mutation đầu vào nếu không cần.
- Dùng default parameter cho giá trị mặc định hợp lý.

## Objects and arrays

- Dùng spread để tạo bản sao thay vì sửa trực tiếp.
- Dùng array methods như `map`, `filter`, `find`, `some`, `every`, `reduce` thay cho loop phức tạp khi hợp lý.
- Ưu tiên pure function cho logic lặp lại.

## Modules

- Giữ import theo nhóm: external → internal → relative.
- Dùng named export khi có thể.
- Đặt file config ngắn, mục đích rõ.

## Error handling

- Bắt lỗi ở mức hợp lý, không nuốt lỗi.
- Trả về message đủ để debug nhưng không lộ chi tiết nhạy cảm.
- Giữ context khi rethrow.

## Best practices theo project

- Trong React component, chỉ tạo wrapper khi thật sự phục vụ layout hoặc accessibility.
- Tránh thêm lớp DOM dư thừa chỉ để bọc nội dung.
- Giữ logic trình bày và logic dữ liệu tách biệt.

## Example

```js
const buildHeaders = (headers, accessToken) => {
  const result = new Headers(headers || {});

  if (accessToken) {
    result.set('Authorization', `Bearer ${accessToken}`);
  }

  return result;
};
```
