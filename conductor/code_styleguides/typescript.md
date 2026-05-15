# TypeScript Style Guide

Quy ước TypeScript cho ITCompass.

## Strict mode là bắt buộc

Repo hiện đang dùng cấu hình TypeScript chặt:

- `strict: true`
- `noImplicitAny: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

## Type safety

- Tránh `any` nếu có thể.
- Dùng `unknown` ở boundary rồi narrow dần.
- Ưu tiên type rõ ràng ở service boundary, DTO và API response.
- Dùng `import type` cho type-only import.

## Interface vs type

- Dùng `interface` cho object shape.
- Dùng `type` cho union, tuple, mapped type và computed type.
- Giữ public API dễ đọc hơn là quá thông minh.

## Async code

- Ưu tiên `async/await` thay vì promise chain dài.
- Khai báo return type cho async function ở service layer.
- Dùng `Promise.all` khi các tác vụ độc lập có thể chạy song song.

## Boundary typing

- Parse và validate dữ liệu ngay khi vào system boundary.
- Tách rõ dữ liệu từ request, dữ liệu từ DB và dữ liệu trả ra client.
- Với Prisma `BigInt`, serialize ở boundary thay vì để rò vào JSON raw.

## Export và import

- Ưu tiên named export.
- Hạn chế default export nếu không thật sự cần.
- Sắp xếp import theo thứ tự: external → internal → relative.

## Generics

- Chỉ dùng generic khi giúp API rõ hơn.
- Đặt constraint tối thiểu cần thiết.
- Đừng tạo generic chỉ để “linh hoạt” nếu không có lợi ích thực.

## Error types

- Dùng error class rõ ràng cho lỗi nghiệp vụ hoặc lỗi domain.
- Preserve `cause` hoặc context tương đương khi cần trace.
- Không dùng string magic thay cho type rõ ràng.

## Examples theo codebase

### Service

```ts
export const login = async (input: LoginInput): Promise<AuthResponse> => {
  // ...
};
```

### Type guard

```ts
function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
```

### DTO rõ ràng

```ts
interface RefreshResponse {
  user: AuthUser | null;
  accessToken: string | null;
}
```

## Testing types

- Dùng test compile-time cho utility type phức tạp nếu có.
- Ưu tiên hành vi runtime ở phần business logic.
