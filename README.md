# Google Auth Helper

Công cụ nhỏ giúp bạn tạo trang web để đăng nhập Google và lấy token OAuth 2.0 (access_token, refresh_token nếu có).

## Tính năng
- Trang chủ với nút "Đăng nhập Google để lấy token".
- Tự động chuyển hướng tới màn hình consent của Google.
- Trang hiển thị token sau khi xác thực, hỗ trợ copy JSON và xem ở dạng `/tokens.json`.

## Thư viện sử dụng
- express: Web framework đơn giản, nhanh.
- ejs: View engine để render các trang HTML.
- dotenv: Đọc biến môi trường từ file `.env`.
- google-auth-library: Thư viện chính thức của Google để thực hiện OAuth 2.0 trong Node.js.
- (tuỳ chọn) nodemon: Tự động reload server khi thay đổi code.

## Cấu trúc thư mục
```
google-auth-helper/
├── README.md
├── Makefile
└── google-helper/
    ├── package.json
    ├── server.js
    └── views/
        ├── index.ejs
        └── tokens.ejs
```

## Cấu hình .env
Tạo file `.env` bên trong thư mục `google-helper/` với nội dung mẫu:
```
PORT=3000
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```
Ghi chú:
- `GOOGLE_REDIRECT_URI` phải trùng với cấu hình trong Google Cloud Console (OAuth consent + Authorized redirect URIs).
- Để nhận được `refresh_token`, bạn cần `access_type=offline` và `prompt=consent` (đã cấu hình sẵn trong mã nguồn).

## Cài đặt & chạy
1. Cài dependencies:
   ```bash
   cd google-helper
   npm install
   ```
2. Chạy server:
   - Qua Makefile:
     ```bash
     cd ..
     make up
     ```
     Make sẽ ưu tiên dùng `nodemon` nếu có (local hoặc global). Nếu không, sẽ dùng `node`.
   - Hoặc qua npm scripts:
     ```bash
     npm run start         # node server.js
     npm run dev           # nodemon server.js (nếu đã cài)
     ```
3. Mở trình duyệt tại: `http://localhost:3000`.

## Lưu ý bảo mật
- Token chỉ lưu tạm thời trong bộ nhớ server (không ghi file). Bạn nên copy và lưu trữ an toàn.
- Không commit file `.env` lên repository công khai.

---
Bản quyền: ISC. Sử dụng tuỳ ý cho mục đích hỗ trợ phát triển.
