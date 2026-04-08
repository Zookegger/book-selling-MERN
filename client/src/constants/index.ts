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

	ADMIN_DASHBOARD: "/admin",
	ADMIN_PUBLISHERS: "/admin/publishers",

	BOOK: (bookId: string) => `/books/${bookId}`,
	BOOK_DETAIL: (bookIdentifier: string) => `/books/${bookIdentifier}`,

	CATEGORY: "/categories",
	WISHLIST: "/wishlist",
	CATEGORY_DETAIL: (slug: string) => `/categories/${slug}`,
} as const;

export const ROUTER_PATHS = ROUTES;
