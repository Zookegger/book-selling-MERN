# Admin Author Management - Documentation

## Overview

I've created a complete admin author management page for your MERN book-selling application. This page allows you to manage authors with full CRUD operations (Create, Read, Update, Delete) along with search and pagination features.

## Created Files

### Client-side Files

1. **`client/src/services/author.services.ts`** - API service for author operations
   - `listAuthors()` - Fetch paginated list of authors with search
   - `getAuthor()` - Get single author details
   - `createAuthor()` - Create new author
   - `updateAuthor()` - Update author information
   - `deleteAuthor()` - Delete an author

2. **`client/src/pages/Admin/AuthorManagement.tsx`** - Main admin page component
   - Displays author list with pagination
   - Search functionality
   - Inline form for create/edit operations
   - Error handling and loading states

3. **`client/src/pages/Admin/components/AuthorForm.tsx`** - Form component for creating/editing authors
   - Form fields: Name, Email, Birth Date, Website, Bio
   - Client-side validation
   - Disabled email field when editing (prevents changes)

4. **`client/src/pages/Admin/components/AuthorTable.tsx`** - Table component for displaying authors
   - Shows author details including name, email, birth date, website
   - Edit and delete buttons for each author
   - Formatted dates using Vietnamese locale

5. **CSS Files**
   - `AuthorManagement.css` - Main page styles
   - `AuthorForm.css` - Form modal styles
   - `AuthorTable.css` - Table styles

### Updated Files

- `client/src/pages/index.ts` - Added AuthorManagementPage export
- `client/src/constants/index.ts` - Added `ADMIN_AUTHORS: "/admin/authors"` route
- `client/src/components/common/Router.tsx` - Added protected route for admin authors

## Features

### Search & Pagination
- Search authors by name in real-time
- Adjustable page size (5, 10, 20, 50 items per page)
- Next/Previous pagination buttons
- Current page indicator

### Create New Author
- Click "Thêm Tác Giả Mới" (Add New Author) button
- Fill in the form with required fields (Name, Email)
- Optional fields: Birth Date, Website, Bio
- Client-side validation with error messages

### Edit Author
- Click the edit (✎) button in the table row
- Modify author information (all fields except email)
- Email is read-only to prevent accidental changes
- Click "Cập Nhật" (Update) to save

### Delete Author
- Click the delete (🗑) button in the table row
- Confirm deletion in the confirmation dialog
- Author is removed from the list

## Accessing the Page

### URL
Navigate to: `http://localhost:5173/admin/authors` (or your client port)

### Authentication
- The page requires authentication
- Users must be logged in to access it
- Unauthenticated users will be redirected to login page

### Navigation
You can add a link to your navigation menu:
```tsx
import { ROUTES } from "@constants/index";

// In your navigation component
<Link to={ROUTES.ADMIN_AUTHORS}>Quản Lý Tác Giả</Link>
```

## API Endpoints Used

The service calls these backend endpoints:
- `GET /api/authors` - List authors (with query params: page, limit, search)
- `GET /api/authors/:id` - Get author details
- `POST /api/authors` - Create new author
- `PATCH /api/authors/:id` - Update author
- `DELETE /api/authors/:id` - Delete author

All requests are authenticated using the Bearer token from localStorage.

## Types Used

The page uses TypeScript types from `client/src/types/author.dto.ts`:

```typescript
interface AuthorDto {
  id: string;
  name: string;
  slug: string;
  email: string;
  bio?: string;
  birthDate?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

interface ListAuthorsResponseDto {
  data: AuthorDto[];
  total: number;
  page: number;
  totalPages: number;
}
```

## Styling Notes

- Uses responsive design that works on mobile and desktop
- Custom CSS with consistent styling
- Color scheme:
  - Primary buttons: Blue (#007bff)
  - Success/Edit: Green (#28a745)
  - Delete: Red (#dc3545)
  - Secondary: Gray (#6c757d)

## Error Handling

- Network errors display in an alert banner
- form validation shows field-level error messages
- Errors can be dismissed by clicking the close button
- Automatic error clearing when fields are corrected

## Responsive Design

- Works on mobile devices (stacks vertically)
- Table scrolls horizontally on small screens
- Touch-friendly button sizing
- Optimized form layout for different screen sizes

## Vietnamese Localization

All UI text is in Vietnamese:
- "Quản Lý Tác Giả" (Author Management)
- "Thêm Tác Giả Mới" (Add New Author)
- "Chỉnh Sửa Tác Giả" (Edit Author)
- Dates formatted in Vietnamese locale (vi-VN)

## Next Steps (Optional Enhancements)

1. **Bulk Operations**
   - Select multiple authors and delete in batch
   - Export authors to CSV

2. **Advanced Search**
   - Filter by date range
   - Search by email or website

3. **Sorting**
   - Click column headers to sort
   - Sort by name, date created, etc.

4. **Author Details Page**
   - View all books written by an author
   - Display author biography
   - Show author statistics

5. **Permissions**
   - Add role-based access control (only admins can access)
   - Add author creation/edit audit logging

## Troubleshooting

### Page shows "Không tìm thấy tác giả nào" (No authors found)
- Check if authors were created in the database
- Verify API connection is working
- Check browser console for errors

### Form not submitting
- Ensure all required fields are filled
- Check for validation error messages
- Verify server is running and accessible

### Search not working
- Check that server supports search parameter
- Try searching with exact author name
- Clear search box and try again

---

**Created**: April 8, 2026
**Technology Stack**: React, TypeScript, Material-UI, Axios
