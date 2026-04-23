# Backend

Base backend Node.js cho du an.

## Scripts

- `npm install`: cai dependency
- `npm run dev`: chay server voi watch mode
- `npm start`: chay server production mode
- `npm run prisma:validate`: kiem tra schema Prisma hop le
- `npm run prisma:format`: format file `prisma/schema.prisma`
- `npm run prisma:generate`: generate Prisma Client

## API

- `GET /api/health`: kiem tra backend dang hoat dong
- `GET /api/blogs`: lay danh sach bai viet da xuat ban (public)
- `GET /api/blogs/:slug`: lay chi tiet bai viet da xuat ban (public)
- `GET /api/blogs/:slug/comments`: lay binh luan cua bai viet (public)
- `POST /api/blogs/:slug/comments`: gui binh luan moi (public/guest)
- `POST /api/blogs`: admin tao bai viet moi (draft/scheduled/published)
- `GET /api/admin/blogs`: admin lay danh sach bai viet theo bo loc
- `GET /api/admin/blogs/:id`: admin lay chi tiet bai viet
- `PATCH /api/admin/blogs/:id`: admin cap nhat bai viet
- `POST /api/admin/blogs/:id/publish`: admin xuat ban ngay
- `POST /api/admin/blogs/:id/schedule`: admin len lich xuat ban
- `DELETE /api/admin/blogs/:id`: admin xoa mem bai viet
- `POST /api/admin/blogs/:id/restore`: admin khoi phuc bai viet da xoa mem
- `GET /api/admin/blogs/:id/preview`: admin xem truoc bai viet
- `PATCH /api/admin/comments/:id/status`: admin an/hien binh luan
- `DELETE /api/admin/comments/:id`: admin xoa mem binh luan
- `POST /api/uploads/images`: admin upload anh (tra URL local `/uploads/*`)
- `POST /api/auth/register`: dang ky tai khoan va auto login
- `POST /api/auth/login`: dang nhap va tra access token
- `POST /api/auth/refresh`: cap access token moi tu refresh cookie
- `POST /api/auth/logout`: dang xuat phien hien tai
- `POST /api/auth/logout-all`: dang xuat tat ca thiet bi
- `GET /api/auth/me`: lay thong tin user hien tai
- `POST /api/auth/verify-email/request`: tao token xac thuc email
- `POST /api/auth/verify-email/confirm`: xac nhan email bang token
- `POST /api/auth/forgot-password`: tao token dat lai mat khau, chi ap dung cho tai khoan da xac thuc email
- `POST /api/auth/reset-password`: dat lai mat khau bang token

## Environment variables

- `PORT`: cong server, mac dinh `5000`
- `DATABASE_URL`: chuoi ket noi MySQL cho Prisma
- `FRONTEND_URL`: URL frontend duoc phep goi API (CORS)
- `JWT_ACCESS_SECRET`: secret ky access token
- `ACCESS_TOKEN_TTL`: thoi gian song access token, vi du `15m`
- `REFRESH_TOKEN_TTL_DAYS`: so ngay song refresh token
- `REFRESH_TOKEN_COOKIE_NAME`: ten cookie luu refresh token
- `COOKIE_SECURE`: bat/tat secure cookie (`true` tren HTTPS)
- `COOKIE_DOMAIN`: domain cookie (de trong khi local)

## Database foundation

- `prisma/schema.prisma`: lop map giua code va bang/cot MySQL hien co
- `prisma/migrations/0001_auth_foundation/migration.sql`: cac bang auth co ban cho session, xac thuc email va dat lai mat khau
- `prisma/migrations/0002_blog_posts/migration.sql`: bang bai viet blog co ban
- `prisma/migrations/0003_blog_editorial_comments/migration.sql`: workflow bien tap, SEO, comment, soft delete
- `src/db/prisma.js`: Prisma Client dung chung cho backend
