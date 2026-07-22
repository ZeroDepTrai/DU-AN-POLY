# CellZone — New Commits Summary (Jul 21, 2026)

## Pulled Commits

| Hash | Message |
|------|---------|
| `43f85fe` | fix page behavior full-screen every load |
| `51dfa04` | fixed flashing every loading |
| `e49d667` | adjust page to pre-load mode, fix when click on product doesnt go back on-top |
| `0d73e46` | fix add to card move to login, fix image load |
| `ae34ec8` | fix(railway): align public domain target port |
| `98c150e` | fix(railway): bind API to assigned port |
| `2e8f0a4` | fix(deploy): start API before legacy image migration |
| `f6ecee0` | change Home page to pre-load mode |
| `a3023d1` | image load optimization |

---

## Files Changed

**Backend:**
- `backend/Dockerfile` — updated
- `backend/app/main.py` — API configuration changes
- `backend/app/routers/admin.py` — admin endpoints
- `backend/app/routers/blog.py` — blog endpoints
- `backend/app/routers/products.py` — product endpoints
- `backend/app/schemas/__init__.py` — schema updates
- `backend/app/services/images.py` — **NEW** image processing service
- `backend/app/services/legacy_image_migration.py` — **NEW** migration for old images
- `backend/migrate_and_start.py` — startup script
- `backend/requirements.txt` — added dependency

**Frontend:**
- `frontend/src/App.tsx` — routing updates
- `frontend/src/api/client.ts` — API client changes
- `frontend/src/components/BlogCard.tsx` — optimized images
- `frontend/src/components/OptimizedImage.tsx` — **NEW** smart image component
- `frontend/src/components/PageReadyGate.tsx` — **NEW** page loading gate
- `frontend/src/components/ProductCard.tsx` — image optimization
- `frontend/src/components/ProtectedRoute.tsx` — auth route changes
- `frontend/src/context/CartContext.tsx` — cart context updates
- `frontend/src/index.css` — navigation progress CSS
- `frontend/src/pages/Blog.tsx` — optimized images
- `frontend/src/pages/BlogDetail.tsx` — optimized images
- `frontend/src/pages/Cart.tsx` — image updates
- `frontend/src/pages/Checkout.tsx` — image updates
- `frontend/src/pages/Home.tsx` — pre-load mode integration
- `frontend/src/pages/ProductDetail.tsx` — optimized images
- `frontend/src/types.ts` — type definitions
- `frontend/tsconfig.tsbuildinfo` — build cache

**Infrastructure:**
- `railway.json` — **NEW** Railway deployment config

---

## Key Features

### 1. OptimizedImage Component

A smart image component that automatically handles responsive images.

**File:** `frontend/src/components/OptimizedImage.tsx`

**Features:**
- Generates responsive `srcset` from WebP image URLs
- Creates 3 variants: 320w, 640w, 1200w
- Lazy loading by default
- Priority loading (`eager`) for above-fold images
- Graceful fallback if responsive variants fail
- Gradient placeholder while loading
- Smooth opacity transition on load

**How it works:**

```typescript
// Input URL: /uploads/abc123.webp
// Output srcset:
// /uploads/abc123-320.webp 320w,
// /uploads/abc123-640.webp 640w,
// /uploads/abc123-1200.webp 1200w
```

**Component Usage:**

```tsx
// Normal image (lazy loaded)
<OptimizedImage src="/uploads/image.webp" alt="Product" />

// Priority image (eager loaded, above fold)
<OptimizedImage src="/uploads/image.webp" alt="Hero" priority />
```

---

### 2. PageReadyGate Component

Fixes the "full-screen flash every load" issue by coordinating page transitions.

**File:** `frontend/src/components/PageReadyGate.tsx`

**Features:**

| Feature | Description |
|---------|-------------|
| **Preparing Screen** | Branded CellZone loading spinner (shows after 180ms) |
| **Navigation Progress** | Thin gradient bar at top during transitions |
| **Content Visibility** | Page hidden until fully ready |
| **Image Waiting** | Waits for important images before showing |
| **Minimum Progress** | 320ms visual feedback for transitions |
| **Abort Handling** | Clean cancellation on route changes |

**Page Transition Flow:**

```
User clicks link
       ↓
NavigationProgress bar appears (top)
       ↓
PageReadyGate intercepts
       ↓
Wait for (up to 12s):
  - Auth/Cart context loaded
  - React Query fetches complete
  - Important images loaded
  - At least 320ms elapsed
       ↓
Hide Preparing Screen
Content becomes visible
NavigationProgress disappears
```

**CSS Addition:**

```css
.page-navigation-progress {
  animation: navigation-progress 0.3s ease-out;
}
```

---

### 3. Backend Image Service

**File:** `backend/app/services/images.py`

Handles image processing:
- WebP conversion
- Responsive variant generation
- Inline base64 image persistence
- Upload directory management

---

### 4. Legacy Image Migration

**File:** `backend/app/services/legacy_image_migration.py`

Idempotent migration that:
- Scans all products, media, and blog posts
- Converts old images to optimized WebP format
- Updates database URLs
- Does NOT delete originals (safe rollback)

**Run manually if needed:**

```bash
python -m app.services.legacy_image_migration
```

---

### 5. Railway Deployment Config

**File:** `railway.json`

Ensures proper port binding and service startup order:
1. Start API before image migration
2. Bind to Railway-assigned port
3. Proper health checks

---

## Color Palette (from Tailwind Config)

All UI components use the CellZone brand colors:

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-charcoal` | `#181417` | Background |
| `--color-graphite` | `#232028` | Cards, surfaces |
| `--color-gunmetal` | `#3A2F33` | Borders |
| `--color-sakura` | `#F28CA6` | Accent |
| `--color-rose` | `#E36A86` | Primary hover |
| `--color-crimson` | `#D94A63` | Primary action |
| `--color-deeprose` | `#A82F49` | Deep accent |
| `--color-warmwhite` | `#EEE7E8` | Text |
| `--color-softgray` | `#C9C4C6` | Secondary text |
| `--color-gold` | `#B88B52` | Premium accent |

---

## Migration Notes

### For Developers

1. **Using OptimizedImage:**
   ```tsx
   import OptimizedImage from "@/components/OptimizedImage";

   // Replace <img> with OptimizedImage
   <OptimizedImage src={product.image} alt={product.name} priority />
   ```

2. **PageReadyGate:**
   - Already wrapped around App content
   - No changes needed for new pages
   - Use `PageFallback` for React Suspense boundaries

3. **Image URLs:**
   - Backend automatically generates variants on upload
   - Legacy images migrated on startup
   - No manual intervention needed

### For Deployment

1. Ensure `pillow` is installed for image processing
2. First run may be slow due to migration
3. Check logs for `[IMAGE MIGRATION]` status messages

---

*Generated: July 22, 2026*
