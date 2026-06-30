# CellZone - Đồ Án Poly
# Website bán điện thoại với ReactJS + FastAPI + PostgreSQL

## Tổng Quan Kiến Trúc

```
Frontend (React + Vite + TypeScript)  →  Deploy: Vercel
Backend  (FastAPI + Python)             →  Deploy: Railway
Database (PostgreSQL)                  →  Deploy: Railway (managed)
```

## Công Nghệ Sử Dụng

### Frontend
- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS 3** — Custom theme với bảng màu CellZone
- **TanStack Query** — Data fetching
- **React Router v6** — Routing
- **Leaflet + leaflet-routing-machine** — Bản đồ theo dõi đơn hàng
- **Tiptap** — Rich text editor cho blog
- **Axios** — HTTP client

### Backend
- **FastAPI 0.115** + **Python 3.10+**
- **SQLAlchemy 2** + **Alembic** — ORM & migrations
- **PostgreSQL** — Cơ sở dữ liệu
- **JWT (python-jose)** — Xác thực người dùng
- **WebSockets** — Cập nhật vị trí giao hàng real-time
- **httpx** — Gọi API bên ngoài (geocoding)

## Cấu Trúc Thư Mục

```
phone-store/
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── api/client.ts      # API client (axios)
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── MapTracker.tsx         # Bản đồ theo dõi đơn hàng
│   │   │   ├── RichTextEditor.tsx     # Editor cho blog (Tiptap)
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── AdminMapPicker.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── TrackOrder.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── BlogDetail.tsx
│   │   │   ├── NotFound.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── AdminProducts.tsx
│   │   │       ├── AdminOrders.tsx
│   │   │       └── AdminBlog.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── CartContext.tsx
│   │   ├── types.ts
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.ts
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── config.py          # Pydantic Settings
│   │   ├── database.py        # SQLAlchemy session
│   │   ├── deps.py           # Dependencies (auth, hash)
│   │   ├── websocket.py       # WebSocket manager
│   │   ├── models/__init__.py
│   │   ├── schemas/__init__.py
│   │   ├── routers/
│   │   │   ├── auth.py       # Register, Login, Me
│   │   │   ├── products.py   # CRUD products
│   │   │   ├── orders.py     # Place order, Track order
│   │   │   ├── admin.py      # Admin: products, orders, blog
│   │   │   └── blog.py       # Blog posts (public)
│   │   └── services/
│   │       ├── orders.py
│   │       └── geocoding.py
│   ├── uploads/               # Uploaded images
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── railway.json
│   └── .env
└── README.md
```

## Tính Năng Chính

### 1. Trang Chủ & Sản Phẩm
- Hiển thị danh sách điện thoại với filter theo nhãn (iPhone, Samsung, Xiaomi...)
- Quick-add sản phẩm từ dashboard admin
- Full-add với mô tả và tồn kho

### 2. Giỏ Hàng & Thanh Toán
- Thêm/bớt/xóa sản phẩm trong giỏ
- Checkout với địa chỉ giao hàng và số điện thoại
- Tạo đơn hàng với mã theo dõi

### 3. Theo Dõi Đơn Hàng (Map Tracking)
- Bản đồ **Leaflet** với **leaflet-routing-machine** vẽ lộ trình theo đường thật (OSRM)
- Marker xe tải giao hàng tại vị trí hiện tại
- Marker cửa hàng và khách hàng
- WebSocket real-time cập nhật vị trí
- Thanh tiến trình: Đã đặt → Đang xử lý → Đã xuất kho → Đang giao → Đã giao

### 4. Blog
- Rich text editor (Tiptap) cho admin viết bài
- Chèn ảnh inline (kích thước đầy đủ hoặc nhỏ)
- CSS cho ảnh blog: max-width 100%, border-radius, resize được
- Public blog page với bài viết nổi bật

### 5. Admin Dashboard
- Dashboard tổng quan (sản phẩm, đơn hàng, doanh thu, cảnh báo tồn kho)
- Quản lý sản phẩm: Thêm nhanh / Thêm đầy đủ / Sửa / Xóa
- Quản lý đơn hàng: Cập nhật vị trí giao hàng trên bản đồ
- Quản lý blog: Viết bài với Tiptap editor

## API Endpoints

### Auth
- `POST /api/auth/register` — Đăng ký
- `POST /api/auth/login` — Đăng nhập → JWT token
- `GET /api/auth/me` — Thông tin user hiện tại

### Products
- `GET /api/products` — Danh sách sản phẩm
- `GET /api/products/{id}` — Chi tiết sản phẩm

### Orders
- `POST /api/orders` — Tạo đơn hàng (cần auth)
- `GET /api/orders/track/{tracking_code}` — Theo dõi đơn hàng (public)

### Admin
- `GET /api/admin/products` — Danh sách sản phẩm
- `POST /api/admin/products` — Tạo sản phẩm
- `POST /api/admin/products/quick` — Tạo nhanh sản phẩm
- `PUT /api/admin/products/{id}` — Cập nhật sản phẩm
- `DELETE /api/admin/products/{id}` — Xóa sản phẩm
- `GET /api/admin/orders` — Danh sách đơn hàng
- `PATCH /api/admin/orders/{id}/location` — Cập nhật vị trí giao hàng
- `PATCH /api/admin/orders/{id}` — Cập nhật địa chỉ/số điện thoại/trạng thái
- `GET /api/blog` — Danh sách bài viết
- `GET /api/blog/{slug}` — Chi tiết bài viết
- `POST /api/admin/blog` — Tạo bài viết
- `PUT /api/admin/blog/{id}` — Cập nhật bài viết
- `DELETE /api/admin/blog/{id}` — Xóa bài viết

### WebSocket
- `WS /ws/orders/{tracking_code}` — Cập nhật vị trí real-time

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
STORE_LAT=10.762622
STORE_LNG=106.660172
STORE_NAME=Phone Store HQ
ADMIN_EMAIL=admin@phone-store.com
ADMIN_PASSWORD=admin123
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.up.railway.app
```

## Các Lệnh Chạy

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deploy

### Railway (Backend)
1. Push code lên GitHub
2. Tạo project mới trên Railway
3. Thêm PostgreSQL plugin
4. Set environment variables
5. Deploy từ GitHub repo
6. Railway tự động detect `Dockerfile` hoặc `requirements.txt`

### Vercel (Frontend)
1. Push code lên GitHub (repo riêng hoặc subfolder)
2. Import repo trên Vercel
3. Set `VITE_API_URL` = URL Railway backend
4. Set root directory: `frontend`
5. Deploy tự động khi push lên main

## Bảng Màu CellZone

| Tên | Hex | Sử dụng |
|------|-----|----------|
| Charcoal Black | #181417 | Background chính |
| Dark Graphite | #262127 | Card background |
| Gunmetal | #353039 | Borders, secondary bg |
| Warm White | #EEE7E8 | Text chính |
| Soft Gray | #C9C4C6 | Text phụ |
| Light Pink | #F4A2B7 | Accents nhẹ |
| Sakura Pink | #F28CA6 | Hover states |
| Rose Pink | #E36A86 | Active states |
| Crimson | #D94A63 | Primary buttons, prices |
| Raspberry | #C63D59 | Danger/hover |
| Deep Rose | #A82F49 | Dark danger |
| Wine Red | #7D2438 | Very dark accent |
| Burgundy | #58202D | Deepest accent |
| Steel Gray | #8A858A | Muted text |
| Silver Gray | #BDB7BC | Borders |
| Antique Gold | #B88B52 | Badges, trust icons |
| Bronze | #8D683E | Secondary gold |

## Ghi Chú Quan Trọng

- Frontend sử dụng `baseURL: ""` (same-origin) khi chạy local. Khi deploy, cần set `VITE_API_URL` để trỏ đến Railway backend.
- Bản đồ dùng **OpenStreetMap** tiles (miễn phí) và **OSRM** routing service (miễn phí cho dev).
- File upload được lưu trong thư mục `uploads/` trên Railway filesystem (lưu ý: Railway ephemeral storage — nên dùng object storage cho production).
- WebSocket URL: `wss://backend.up.railway.app/ws/orders/{tracking_code}`
