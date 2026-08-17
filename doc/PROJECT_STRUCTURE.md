# 📁 Cấu Trúc Dự Án — My App

> Tài liệu này giải thích chi tiết từng thư mục, file, thư viện và công nghệ được sử dụng trong dự án.

---

## 🧰 Công Nghệ Nền Tảng (Tech Stack)

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **Next.js** | 16.3.1 | Framework React chính — routing, SSR, SSG |
| **React** | 19.2.8 | Thư viện UI cốt lõi |
| **TypeScript** | ^5 | Kiểm tra kiểu tĩnh, tăng độ an toàn code |
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **Axios** | ^1.19 | HTTP client để gọi API |
| **clsx** | ^2.1 | Kết hợp class name có điều kiện |
| **tailwind-merge** | ^3.6 | Merge Tailwind class tránh xung đột |

### Dev Dependencies

| Công nghệ | Vai trò |
|---|---|
| `@tailwindcss/postcss` | Tích hợp Tailwind với PostCSS |
| `@types/node`, `@types/react`, `@types/react-dom` | TypeScript type definitions |
| `eslint` + `eslint-config-next` | Linting code |

---

## 🗂️ Tổng Quan Cấu Trúc

```
my-app/
├── public/                     # File tĩnh (ảnh, icon, robots.txt)
├── src/                        # Toàn bộ mã nguồn chính
│   ├── app/                    # App Router của Next.js (routing)
│   │   ├── (auth)/             # Route Group — trang xác thực
│   │   │   ├── login/          # Trang đăng nhập (/login)
│   │   │   └── register/       # Trang đăng ký (/register)
│   │   ├── dashboard/          # Trang quản trị (/dashboard)
│   │   │   ├── page.tsx        # Giao diện chính dashboard
│   │   │   └── layout.tsx      # Layout riêng (Sidebar + Header)
│   │   ├── favicon.ico         # Icon tab trình duyệt
│   │   ├── layout.tsx          # Root layout bao toàn bộ app
│   │   └── page.tsx            # Trang chủ (/)
│   ├── components/             # Các component UI tái sử dụng
│   │   ├── ui/                 # Button, Input, Modal cơ bản
│   │   └── layouts/            # Header, Sidebar (layout wrapper)
│   ├── hooks/                  # Custom React Hooks
│   ├── lib/                    # Thư viện cấu hình sẵn (axios, constants)
│   ├── services/               # Gọi API backend
│   ├── styles/                 # CSS toàn cục
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Hàm tiện ích nhỏ
├── doc/                        # Tài liệu dự án
├── .env.local                  # Biến môi trường (không commit git)
├── next.config.ts              # Cấu hình Next.js
├── tsconfig.json               # Cấu hình TypeScript
├── postcss.config.mjs          # Cấu hình PostCSS (cho Tailwind)
└── package.json                # Quản lý dependencies & scripts
```

---

## 📂 Chi Tiết Từng Thư Mục

---

### `public/`

**Mục đích:** Chứa các file tĩnh được Next.js phục vụ trực tiếp tại root URL.

- Các file đặt ở đây sẽ được truy cập qua đường dẫn `/ten-file` (vd: `/logo.png`)
- Không bị xử lý qua webpack/bundler
- Dùng để chứa: ảnh, icon, `robots.txt`, `sitemap.xml`, `manifest.json`

> **Lưu ý:** Ảnh cần tối ưu hóa nên dùng `next/image` thay vì đặt vào `public/` trực tiếp.

---

### `src/app/`

**Mục đích:** Bộ định tuyến chính theo chuẩn **App Router** của Next.js 13+.

Mỗi thư mục con tương ứng một **route URL**. Next.js nhận diện các file đặc biệt:

| File | Vai trò |
|---|---|
| `page.tsx` | Giao diện của route đó |
| `layout.tsx` | Layout bao bọc page (và các route con) |
| `loading.tsx` | UI hiển thị khi đang tải (Suspense) |
| `error.tsx` | UI hiển thị khi có lỗi runtime |
| `not-found.tsx` | UI trang 404 |

---

#### `src/app/(auth)/` — Route Group Xác Thực

**Công dụng:** Nhóm các route liên quan đến xác thực mà **không ảnh hưởng URL**.

Dấu ngoặc đơn `(auth)` là cú pháp **Route Group** của Next.js — tên thư mục bị ẩn khỏi URL:
- `(auth)/login/` → URL: `/login` ✅ (không phải `/auth/login`)
- `(auth)/register/` → URL: `/register` ✅

**Đặc điểm:**
- Dùng `"use client"` vì có state (useState, form handling)
- Gọi `authService.login()` / `authService.register()` để tương tác với API
- Redirect sang `/dashboard` sau khi thành công

---

#### `src/app/dashboard/` — Khu Vực Quản Trị

**Công dụng:** Trang dashboard chính sau khi đăng nhập.

**`layout.tsx`** — Layout đặc thù cho dashboard:
- Bao gồm `<Sidebar />` (menu điều hướng bên trái)
- Bao gồm `<Header />` (thanh trên: breadcrumb, notification, avatar)
- Phần còn lại là `{children}` — nội dung từng trang con

**`page.tsx`** — Trang tổng quan:
- Hiển thị 4 stat cards (người dùng, doanh thu, đơn hàng, tỷ lệ chuyển đổi)
- Section "Hoạt động gần đây" (placeholder sẵn cho data thật)

---

#### `src/app/layout.tsx` — Root Layout

**Công dụng:** Layout gốc bao bọc **toàn bộ** ứng dụng.

- Khai báo `<html>` và `<body>` — chỉ được phép có **một** file này
- Load font **Inter** từ Google Fonts qua `next/font/google`
- Khai báo **SEO metadata** toàn cục (title template, description, robots)
- Import `globals.css`

---

### `src/components/`

**Mục đích:** Chứa tất cả các React component UI có thể tái sử dụng ở nhiều nơi.

#### `src/components/ui/` — Component Cơ Bản (Atomic)

##### `Button.tsx`
- **5 variants:** `primary` | `secondary` | `danger` | `ghost` | `outline`
- **3 sizes:** `sm` | `md` | `lg`
- **Props:** `loading` (spinner), `leftIcon`, `rightIcon`, `disabled`
- Dùng `React.forwardRef` để hỗ trợ ref forwarding

##### `Input.tsx`
- **Props:** `label`, `error`, `hint`, `leftAddon`, `rightAddon`
- Tự sinh `id` từ `label` nếu không truyền
- Dùng `React.forwardRef`

##### `Modal.tsx`
- **4 sizes:** `sm` | `md` | `lg` | `xl`
- Đóng bằng phím **Escape** hoặc click backdrop
- Khóa scroll `body` khi mở
- Accessibility: `role="dialog"`, `aria-modal`, `aria-labelledby`
- Hiệu ứng: `fade-in` + `zoom-in-95`

##### `index.ts` — Barrel Export
```ts
// Import gọn từ bất kỳ đâu:
import { Button, Input, Modal } from "@/components/ui";
```

---

#### `src/components/layouts/` — Component Layout

##### `Sidebar.tsx`
- Menu điều hướng bên trái dashboard
- Highlight active link dựa trên `usePathname()`
- Danh sách nav có thể mở rộng qua mảng `navItems`
- Hiển thị logo + tên app ở trên, user profile ở dưới

##### `Header.tsx`
- Thanh header ngang phía trên dashboard
- **Breadcrumb động** — tự đọc `pathname` để hiện tên trang
- Nút thông báo (notification bell với badge đỏ)
- Avatar người dùng

---

### `src/hooks/`

**Mục đích:** Các React Hook tùy chỉnh — tách logic ra khỏi UI.

> **Quy tắc:** Tên hook phải bắt đầu bằng `use`. Hook chỉ chứa logic, không chứa JSX.

##### `useDisclosure.ts`
```ts
const { isOpen, open, close, toggle } = useDisclosure();
// Dùng để điều khiển Modal, Drawer, Dropdown...
```
Quản lý trạng thái boolean mở/đóng, trả về `{ isOpen, open, close, toggle }`.

##### `useDebounce.ts`
```ts
const debouncedSearch = useDebounce(searchQuery, 300);
// Dùng để delay gọi API khi user gõ search
```
Generic hook hoạt động với mọi kiểu `<T>`, tự cleanup timer khi unmount.

---

### `src/lib/`

**Mục đích:** Thư viện cấu hình sẵn và các module singleton dùng toàn app.

##### `apiClient.ts`
Axios instance đã được cấu hình sẵn:

- **Base URL:** lấy từ `NEXT_PUBLIC_API_URL` trong `.env.local`
- **Timeout:** 10 giây
- **Request Interceptor:** Tự động đính kèm `Authorization: Bearer <token>` vào mọi request
- **Response Interceptor:** Nếu nhận `401 Unauthorized` → xóa token + redirect về `/login`

##### `constants.ts`
Hằng số toàn ứng dụng:

| Constant | Nội dung |
|---|---|
| `APP_NAME` | `"My App"` |
| `API_BASE_URL` | URL backend API |
| `STORAGE_KEYS` | Keys của localStorage (`access_token`, `refresh_token`, `user`) |
| `ROUTES` | Đường dẫn tất cả các trang |
| `DEFAULT_PAGE_SIZE` | `20` (số item mỗi trang) |

> **Lý do dùng constants:** Tránh hard-code string ở nhiều nơi — khi đổi route chỉ cần sửa 1 chỗ.

---

### `src/services/`

**Mục đích:** Tầng giao tiếp với Backend API. Mỗi file service quản lý một nhóm endpoint liên quan.

> **Quy tắc:** Component/Hook không được gọi `axios` trực tiếp — phải đi qua service.

##### `authService.ts`

| Method | Endpoint | Mô tả |
|---|---|---|
| `login()` | `POST /auth/login` | Đăng nhập, lưu token |
| `register()` | `POST /auth/register` | Đăng ký tài khoản |
| `logout()` | `POST /auth/logout` | Đăng xuất, xóa token |
| `getProfile()` | `GET /auth/me` | Lấy thông tin user hiện tại |

##### `userService.ts`

| Method | Endpoint | Mô tả |
|---|---|---|
| `getAll()` | `GET /users` | Lấy danh sách có phân trang |
| `getById()` | `GET /users/:id` | Lấy 1 user theo ID |
| `update()` | `PATCH /users/:id` | Cập nhật thông tin |
| `delete()` | `DELETE /users/:id` | Xóa user |

---

### `src/styles/`

**Mục đích:** File CSS toàn cục, được import duy nhất tại `src/app/layout.tsx`.

##### `globals.css`

Cấu trúc file:
1. `@import "tailwindcss"` — Load Tailwind v4
2. `:root { ... }` — CSS Custom Properties (design tokens)
3. Reset & base styles — box-sizing, margin, padding
4. Typography — font, line-height, heading styles
5. `:focus-visible` — Outline cho keyboard navigation
6. Scrollbar styles — Custom scrollbar (Webkit)
7. `@keyframes` + `.animate-*` — Animation utilities

**Design Tokens (CSS Variables):**
```css
--color-primary: 37 99 235;      /* blue-600  */
--color-danger:  220 38 38;      /* red-600   */
--color-success: 22 163 74;      /* green-600 */
--font-sans:     var(--font-inter, system-ui, sans-serif);
```

---

### `src/types/`

**Mục đích:** Định nghĩa TypeScript types/interfaces dùng chung toàn dự án.

> **Quy tắc:** Không đặt type trong file component — luôn đặt ở `types/` để tái sử dụng.

##### `auth.ts`
```
LoginRequest      { email, password }
RegisterRequest   { name, email, password }
AuthResponse      { accessToken, refreshToken?, user }
User              Entity người dùng đầy đủ
UserRole          "admin" | "editor" | "viewer"
UserStatus        "active" | "inactive" | "banned"
```

##### `common.ts`
```
ApiResponse<T>          { data: T, message?, success }
PaginatedResponse<T>    { data: T[], total, page, pageSize, totalPages }
PaginationParams        { page?, pageSize?, search?, sortBy?, sortOrder? }
ID                      = string
Nullable<T>             T | null
Optional<T>             T | undefined
RequireFields<T, K>     Làm một số key của T thành required
PartialFields<T, K>     Làm một số key của T thành optional
```

---

### `src/utils/`

**Mục đích:** Các hàm tiện ích thuần JavaScript (pure functions), không có side effects.

##### `cn.ts`
```ts
cn("px-4 py-2", isActive && "bg-blue-500", "bg-red-500")
// → "px-4 py-2 bg-red-500"  (bg-blue-500 bị ghi đè đúng cách)
```
Kết hợp **`clsx`** + **`tailwind-merge`** để compose class names an toàn.

##### `formatters.ts`

| Hàm | Ví dụ kết quả |
|---|---|
| `formatCurrency(84500000)` | `"₫84.500.000"` |
| `formatDate("2024-01-15")` | `"15 tháng 1, 2024"` |
| `formatRelativeTime("2024-01-10")` | `"7 ngày trước"` |
| `truncate("Chuỗi dài...", 50)` | `"Chuỗi dài…"` |
| `getInitials("Nguyễn Văn A")` | `"NA"` |

---

### `.env.local`

**Mục đích:** Biến môi trường cho local development.

```bash
NEXT_PUBLIC_APP_NAME=My App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

> ⚠️ **Quan trọng:**
> - File này **không được commit** vào git (đã có trong `.gitignore`)
> - Biến `NEXT_PUBLIC_` dùng được ở **client-side**
> - Biến không có `NEXT_PUBLIC_` chỉ dùng được ở **server-side**
> - Tạo file `.env.example` để team biết cần những biến nào

---

### `tsconfig.json` — Path Alias

Điểm quan trọng nhất là path alias `@/*`:

```json
"paths": { "@/*": ["./src/*"] }
```

Cho phép import tuyệt đối thay vì relative path:
```ts
// ❌ Tránh:
import { Button } from "../../../../components/ui/Button";

// ✅ Dùng:
import { Button } from "@/components/ui/Button";
```

---

## 🔄 Luồng Dữ Liệu (Data Flow)

```
User Action (UI)
    ↓
Component (src/app/ hoặc src/components/)
    ↓
Custom Hook (src/hooks/) — quản lý state/logic
    ↓
Service (src/services/) — gọi API
    ↓
apiClient (src/lib/apiClient.ts) — Axios instance
    ↓
Backend API (NEXT_PUBLIC_API_URL)
    ↓
Response → Type (src/types/) → Component re-render
```

---

## 📐 Quy Ước Đặt Tên (Naming Conventions)

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Component | PascalCase | `UserCard.tsx`, `Button.tsx` |
| Hook | camelCase + `use` prefix | `useDisclosure.ts` |
| Service | camelCase + `Service` suffix | `authService.ts` |
| Type/Interface | PascalCase | `UserRole`, `LoginRequest` |
| Utility | camelCase | `formatCurrency`, `cn` |
| CSS class | kebab-case | `animate-in`, `fade-in` |
| Hằng số | SCREAMING_SNAKE_CASE | `STORAGE_KEYS`, `DEFAULT_PAGE_SIZE` |

---

## ➕ Mở Rộng Dự Án

Khi cần thêm tính năng mới, tuân theo pattern sau:

### Thêm một trang mới
```
src/app/dashboard/products/page.tsx       # Trang danh sách
src/app/dashboard/products/[id]/page.tsx  # Chi tiết (dynamic route)
```

### Thêm một entity mới (ví dụ: Product)
```
src/types/product.ts               # Định nghĩa type Product
src/services/productService.ts     # CRUD API calls
src/components/ui/ProductCard.tsx  # Component hiển thị
src/hooks/useProducts.ts           # Hook quản lý state + fetching
```

### Thứ tự tạo file khi thêm feature
1. Định nghĩa **Type** (`src/types/`)
2. Tạo **Service** (`src/services/`)
3. Tạo **Hook** (`src/hooks/`)
4. Tạo **Component** (`src/components/`)
5. Tạo **Page** (`src/app/`)

---

*Tài liệu được cập nhật lần cuối: 08/2026*
