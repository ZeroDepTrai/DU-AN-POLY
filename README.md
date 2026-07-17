# CellZone - Đồ Án Poly

Website bán điện thoại với **ReactJS** (Frontend) + **FastAPI** (Backend) + **PostgreSQL** (Database).

## Tính Năng

- Trang chủ & danh sách sản phẩm với filter theo nhãn
- Giỏ hàng & thanh toán (COD, chuyển khoản, trả góp)
- **Theo dõi đơn hàng real-time** với bản đồ Leaflet, vẽ lộ trình theo đường thật (OSRM)
- **Blog với Rich Text Editor** (Tiptap) cho phép chèn ảnh inline có thể resize
- **Admin Dashboard** quản lý sản phẩm, đơn hàng, blog
- **Aurora UI design system** — animated gradients, glassmorphism, glow trên toàn site
- **Hệ thống đánh giá · yêu thích · favorite** (sao + like + tab Yêu thích trên Profile)
- Đăng nhập / Đăng ký với JWT

## Công Nghệ

| Phần | Công nghệ |
|------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Tiptap |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL |
| Deploy | **Vercel** (frontend), **Railway** (backend) |

## Hướng Dẫn Deploy Nhanh

### Migration cơ sở dữ liệu

Sau khi pull code mới (đặc biệt sau khi thêm migration mới như `004_rating_like_favorite.py`), chạy:

```bash
cd backend
alembic upgrade head
```

### Bước 1: Tạo GitHub Repo

```bash
# Di chuyển vào thư mục project
cd C:\Users\nchit\Projects\phone-store

# Khởi tạo git (nếu chưa có)
git init

# Thêm tất cả file
git add .

# Commit
git commit -m "Initial commit - CellZone phone store"

# Tạo repo trên GitHub (truy cập https://github.com/new)
# Đặt tên repo: DU-AN-POLY
# Copy remote URL từ GitHub

# Thêm remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/DU-AN-POLY.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

### Bước 2: Deploy Backend lên Railway

1. Truy cập [railway.app](https://railway.app) và đăng nhập
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Chọn repo **DU-AN-POLY**
4. Railway tự động detect `backend/Dockerfile` hoặc `requirements.txt`
5. Thêm **PostgreSQL** plugin: Click **"Add a plugin"** → **"PostgreSQL"**
6. Sau khi PostgreSQL được tạo, copy **Connection URL** (dạng `postgresql://...`)
7. Trong project Railway, vào **Variables** và thêm:

```
DATABASE_URL = postgresql://user:pass@host:5432/dbname
# (paste PostgreSQL URL từ bước 6)

JWT_SECRET = super-secret-key-change-me
JWT_ALGORITHM = HS256
JWT_EXPIRE_HOURS = 24
STORE_LAT = 10.762622
STORE_LNG = 106.660172
STORE_NAME = CellZone Store
ADMIN_EMAIL = admin@cellzone.com
ADMIN_PASSWORD = admin123456
CORS_ORIGINS = https://du-an-poly.vercel.app
```

8. Click **"Deploy"** — đợi build và start
9. Sau khi deploy xong, copy **URL của backend** (VD: `https://du-an-poly.railway.app`)

### Bước 3: Deploy Frontend lên Vercel

1. Truy cập [vercel.com](https://vercel.com) và đăng nhập (đăng nhập bằng GitHub)
2. Click **"Add New..."** → **"Project"**
3. Chọn repo **DU-AN-POLY** từ danh sách GitHub
4. Framework: **Vite** (sẽ tự detect)
5. Root Directory: `frontend`
6. Build Command: `npm install && npm run build`
7. Output Directory: `dist`
8. **Environment Variables**, thêm:

```
VITE_API_URL = https://your-railway-url.up.railway.app
# (paste Railway backend URL từ bước 2)
```

9. Click **"Deploy"** — đợi build và deploy
10. Sau khi deploy xong, bạn sẽ có URL like: `https://du-an-poly.vercel.app`

### Bước 4: Cập nhật Backend CORS

Quay lại Railway → Variables → cập nhật `CORS_ORIGINS`:

```
CORS_ORIGINS = https://du-an-poly.vercel.app
```

Redeploy backend để áp dụng.

## Chạy Local

### Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Copy và sửa .env
copy .env.example .env
# Sửa DATABASE_URL thành local PostgreSQL

uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Database Schema

- **users** — Tài khoản người dùng (email, password hash, role)
- **products** — Sản phẩm (name, price, tag, description, stock, image_url)
- **orders** — Đơn hàng (tracking_code, status, delivery address/location)
- **order_items** — Chi tiết đơn hàng
- **blog_posts** — Bài viết blog (title, slug, content, author)

## API URL Notes

- **Local**: Frontend gọi API trực tiếp (`baseURL: ""`)
- **Production**: Frontend gọi `VITE_API_URL` (Railway backend URL)

## Bảng Màu

| Tên | Hex |
|-----|-----|
| Charcoal Black | #181417 |
| Crimson | #D94A63 |
| Sakura Pink | #F28CA6 |
| Warm White | #EEE7E8 |
| Antique Gold | #B88B52 |

Xem `CONTEXT.md` để biết thêm chi tiết kiến trúc và API endpoints.
