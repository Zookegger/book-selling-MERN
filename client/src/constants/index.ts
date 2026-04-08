export const ROUTES = {
	HOME: "/",
	LOGIN: "/account/sign-in",
	REGISTER: "/account/sign-up",
	FORGOT_PASSWORD: "/account/forgot-password",
	UNAUTHORIZE: "/unauthorized",
	ERROR: "/error",
	NOT_FOUND: "/not-found",
	VERIFY_EMAIL: "/verify-email",
	RESEND_VERIFICATION: "/resend-verification",
	PROFILE: "/account/profile",
	CART: "/cart",
	BOOKS: "/books",
	BOOK_DETAIL: "/books/:bookId",
	
	ADMIN_DASHBOARD: "/admin",
	ADMIN_PUBLISHERS: "/admin/publishers",
	BOOK: (bookId: string) => `/books/${bookId}`,
<<<<<<< Updated upstream

	CATEGORY: "/categories",
	CATEGORY_DETAIL: (slug: string) => `/categories/${slug}`,
=======
	ADMIN_AUTHORS: "/admin/authors",
	ADMIN_CATEGORIES: "/admin/categories",
>>>>>>> Stashed changes
} as const;

export const ROUTER_PATHS = ROUTES;