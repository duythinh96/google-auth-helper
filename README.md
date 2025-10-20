# Google Auth Helper

Công cụ giúp tạo trang web đăng nhập Google và lấy token OAuth 2.0 (access_token, refresh_token nếu có).

## Tổng quan
- UI có panel để nhập GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI (lưu tạm vào sessionStorage).
- Hệ thống có thể dùng cấu hình .env phía server hoặc cấu hình bạn nhập ở UI.
- Mặc định server chạy tại `http://localhost:9999` và callback là `http://localhost:9999/callback`.

## Endpoints (server.js)
- GET `/` — Trang chủ UI.
- GET `/login` — Bắt đầu luồng OAuth tiêu chuẩn (scopes: `openid`, `email`, `profile`).
  - Query hỗ trợ: `client_id`, `client_secret`, `redirect_uri`.
  - Nếu thiếu ENV ở client và server, trang sẽ hiển thị prompt để nhập, lưu vào sessionStorage rồi tự chuyển hướng lại `/login` với query tương ứng.
  - Khi có ENV, giá trị sẽ được đóng gói trong `state` (base64) để mang qua callback.
- GET `/drive` — Bắt đầu luồng OAuth với quyền Google Drive (scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.readonly`).
  - Hành vi tương tự `/login` và cũng hỗ trợ `client_id`, `client_secret`, `redirect_uri`.
- GET `/callback` — Nhận `code` từ Google, giải mã `state` (nếu có) để khởi tạo OAuth2Client, trao đổi token, rồi render trang `tokens.ejs`.
- GET `/tokens.json` — Trả về JSON token cuối cùng server đã nhận (lưu tạm trong biến bộ nhớ `lastTokens`).
- GET `/health-check` — Trả về JSON: `{ status, uptime, timestamp, port, envConfigured }`.

## Biến môi trường (.env trong thư mục `google-helper/`)
Ví dụ:
```
PORT=9999
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:9999/callback
```
Ghi chú:
- `GOOGLE_REDIRECT_URI` cần khớp với cấu hình `Authorized redirect URIs` trên Google Cloud Console.
- Để có `refresh_token`, server yêu cầu `access_type=offline` và `prompt=consent`.

## Cài đặt & chạy
1) Cài dependencies:
```
cd google-helper
npm install
```
2) Chạy server:
- Qua Makefile (từ thư mục gốc dự án):
```
make up
```
- Hoặc qua npm:
```
npm run start   # node server.js
npm run dev     # nodemon server.js (nếu có)
```
3) Mở trình duyệt:
- Trang chủ: `http://localhost:9999/`
- Bắt đầu đăng nhập: bấm nút trên UI, hoặc dùng trực tiếp:
  - OAuth tiêu chuẩn: `http://localhost:9999/login`
  - OAuth Drive: `http://localhost:9999/drive`

## Cách dùng nhanh (nhập ENV từ UI)
1) Nhập Client ID, Client Secret, Redirect URI ở panel bên trái, bấm "Lưu ENV".
2) Bấm "Đăng nhập Google để lấy token" (hoặc "Đăng nhập Google Drive").
3) Sau khi xác thực, trang kết quả hiển thị token:
   - Nút "Copy JSON" để copy JSON token.
   - Nút "Copy Base64" để copy JSON token dưới dạng Base64.

## Lưu ý bảo mật
- Đây là demo/public helper: Client Secret có thể đi qua `state` và query. Chỉ sử dụng trong môi trường tin cậy.
- Token chỉ lưu tạm trong memory; không ghi ra file.
- Không commit `.env` lên repository công khai.

Bản quyền: ISC. Dùng tự do cho mục đích hỗ trợ phát triển.
