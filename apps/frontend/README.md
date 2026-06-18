# 🎬 Cinema Management - Frontend

## Giới thiệu

Frontend cho hệ thống quản lý rạp chiếu phim, xây dựng với **React + TypeScript + Vite**.

---

## Tài khoản đăng nhập (môi trường Dev / Seed Data)

> **Mật khẩu chung tất cả tài khoản:** `anhduc9a5`

| Vai trò | Email | Mô tả |
|---------|-------|-------|
| **Admin** | `admin@cinema.com` | Quản trị hệ thống (full quyền) |
| **Quản lý phim** | `movie.manager@cinema.com` | Quản lý nội dung phim |
| **Quản lý rạp** | `theater.manager@cinema.com` | Quản lý vận hành rạp + duyệt ca |
| **Quản lý CSVC** | `facilities.manager@cinema.com` | Quản lý cơ sở vật chất |
| **Thu ngân (Vé)** | `quay_ve_01@cinema.com` | Bán vé tại quầy |
| **Thu ngân (Bắp nước)** | `quay_bapnuoc_01@cinema.com` | Bán bắp nước tại quầy |

> **Lưu ý:** Khi tạo rạp mới trên trang Admin / Facilities Manager, hệ thống sẽ **tự động tạo tài khoản thu ngân** cho rạp đó với mật khẩu mặc định `123456`. Email có dạng `cashier_{ma_rap}@cinema.com`.

---

## Công nghệ sử dụng

- React 19 + TypeScript
- Vite 7
- React Router v7
- Axios / SignalR
- React i18next (đa ngôn ngữ: EN, RU, VI)
- Lucide React (icons)

## Hướng dẫn chạy

```bash
cd Frontend/renew_cinema_project_frontend
npm install
npm run dev
```

Truy cập: `http://localhost:5173`

## Build production

```bash
npm run build
```
