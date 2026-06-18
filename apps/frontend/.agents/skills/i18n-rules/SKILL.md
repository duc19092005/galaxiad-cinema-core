---
name: i18n-rules
description: |
  I18n & translation rules for Cinema Pro project.
  Every UI-facing string must be in translation files (vi/en/ru) and called via t().
  Vietnamese text MUST have proper diacritics (dấu). No Vietnamese without accents.
---

# I18N & Translation Rules

## 1. Bắt buộc dùng i18n
Mọi nội dung hiển thị trên UI (text, label, title, description, error message, tooltip, placeholder) **PHẢI** được đặt trong file translation và gọi qua `t()` hoặc `useTranslation()`.

## 2. Hỗ trợ 3 ngôn ngữ
Mỗi key translation phải có đủ 3 bản dịch:
- 🇻🇳 **vi**: Tiếng Việt (bắt buộc có dấu đầy đủ)
- 🇬🇧 **en**: Tiếng Anh
- 🇷🇺 **ru**: Tiếng Nga

### File location:
`src/i18n/locales/{vi,en,ru}/translation.json`

## 3. Tiếng Việt bắt buộc có dấu
Tất cả nội dung tiếng Việt trong file translation phải **VIẾT CÓ DẤU** đầy đủ. Không được dùng tiếng Việt không dấu.

✅ Đúng: "Chính Sách Bảo Mật"
❌ Sai: "Chinh Sach Bao Mat"

## 4. Cấu trúc key
Dùng cấu trúc phân cấp (nested JSON) theo module/page:

```json
{
  "homePage": {
    "title": "...",
    "subtitle": "..."
  },
  "cookiePolicy": {
    "title": "...",
    "useItem1": "..."
  }
}
```

## 5. Khi thêm trang/nội dung mới
Luôn làm theo trình tự:
1. Thêm tất cả các key translation vào cả 3 file (`vi`, `en`, `ru`)
2. Viết component dùng `useTranslation()` và `t()` để gọi
3. Kiểm tra bằng `npm run build`

## 6. Với nội dung có HTML
Dùng `dangerouslySetInnerHTML` kèm component wrapper (ví dụ `HtmlPara`) và lưu HTML string trong translation.

## 7. Xử lý mảng bullet/list items
Lưu **mỗi item thành một key riêng**, không lưu cả mảng.
Ví dụ thay vì `items: ["a", "b", "c"]`, dùng:
- `item1: "a"`
- `item2: "b"`
- `item3: "c"`

## 8. Contact & Legal info
Các thông tin liên hệ, địa chỉ, email, hotline **PHẢI** để trong translation để có thể dịch phù hợp cho từng ngôn ngữ.
