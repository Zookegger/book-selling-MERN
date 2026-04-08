# Admin Authorization Implementation

## Overview

Đã triển khai phân quyền admin cho các trang quản lý tác giả và thể loại sách. Chỉ user có role "admin" mới có thể truy cập các trang này, user thường sẽ bị chuyển hướng đến trang Unauthorized.

## Changes Made

### 1. Updated AuthContext (`client/src/contexts/AuthContext.tsx`)

- **Thêm `isAdmin` property** vào `AuthContextType`
- **Cập nhật user state type** từ `null` thành `GetMeResponseDto | null`
- **Thêm logic kiểm tra admin** trong context value: `isAdmin: user?.role === "admin"`

### 2. Created RequireAdmin Component (`client/src/components/common/Router.tsx`)

- **Tạo component `RequireAdmin`** để kiểm tra quyền admin
- **Logic kiểm tra:**
  - Nếu đang loading: hiển thị LoadingSkeleton
  - Nếu chưa đăng nhập: chuyển hướng đến login
  - Nếu đã đăng nhập nhưng không phải admin: chuyển hướng đến unauthorized
  - Nếu là admin: hiển thị component

### 3. Updated Admin Routes

- **Thay đổi từ `RequireAuth` thành `RequireAdmin`** cho các route:
  - `/admin/authors` - Quản lý tác giả
  - `/admin/categories` - Quản lý thể loại sách

### 4. Backend Support

- **Backend đã hỗ trợ role** trong response của `/auth/me`
- **User model có field `role: "customer" | "admin"`**
- **Seed data có user admin** với thông tin:
  - Email: `admin@luminabooks.local`
  - Password: `AdminPass123!@#`

## How It Works

### Authentication Flow

1. **User đăng nhập** → Backend trả về token + user info (bao gồm role)
2. **AuthContext lưu user data** → Bao gồm role
3. **Context cung cấp `isAdmin`** → `user?.role === "admin"`

### Authorization Flow

1. **User truy cập `/admin/authors`** hoặc `/admin/categories`
2. **RequireAdmin component kiểm tra:**
   - `isAuthenticated` → Nếu false → redirect to login
   - `isAdmin` → Nếu false → redirect to unauthorized
   - Nếu cả hai true → render admin page

### User Roles

- **"customer"**: User thường, không thể truy cập admin pages
- **"admin"**: Admin user, có thể truy cập tất cả admin pages

## Testing

### Test Admin Access

1. **Đăng nhập với tài khoản admin:**
   - Email: `admin@luminabooks.local`
   - Password: `AdminPass123!@#`

2. **Truy cập các URL:**
   - `http://localhost:5173/admin/authors`
   - `http://localhost:5173/admin/categories`

3. **Kết quả:** Admin có thể truy cập và quản lý

### Test Customer Access

1. **Đăng nhập với tài khoản customer** (bất kỳ user nào trong seed data)

2. **Truy cập admin URLs**

3. **Kết quả:** Chuyển hướng đến trang Unauthorized với message "Access Denied"

## Security Features

- **Server-side validation**: Backend kiểm tra role trong middleware
- **Client-side protection**: Router ngăn truy cập trước khi render
- **Token-based authentication**: JWT token chứa user info
- **Role-based access control**: Chỉ admin mới truy cập admin features

## Future Enhancements

### Additional Admin Pages

Có thể áp dụng pattern tương tự cho các trang admin khác:

```tsx
// Trong Router.tsx
{
    path: ROUTES.ADMIN_BOOKS,
    element: (
        <RequireAdmin>
            <BookManagement />
        </RequireAdmin>
    ),
},
```

### Role-based UI

Có thể ẩn/hiện UI elements dựa trên role:

```tsx
const { isAdmin } = useAuth();

return (
    <div>
        {isAdmin && (
            <Link to={ROUTES.ADMIN_AUTHORS}>Quản Lý Tác Giả</Link>
        )}
    </div>
);
```

### Multiple Roles

Có thể mở rộng thành nhiều role:

```typescript
type UserRole = "customer" | "admin" | "moderator" | "editor";
```

---

**Implemented**: April 8, 2026
**Security Level**: Role-based access control with client + server validation</content>
<parameter name="filePath">c:\NNPTUDM-ST5\book-selling-MERN\ADMIN_AUTHORIZATION.md