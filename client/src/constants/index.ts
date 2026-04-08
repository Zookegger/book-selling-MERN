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
	CHECKOUT: "/checkout",
	PAYMENT_RESULT: "/payment-result",
	ORDER_HISTORY: "/orders/history",
	BOOKS: "/books",
	BOOK: (bookId: string) => `/books/${bookId}`,
	BOOK_DETAIL: (bookIdentifier: string) => `/books/${bookIdentifier}`,
	
	CATEGORY: "/categories",
	WISHLIST: "/wishlist",
	CATEGORY_DETAIL: (slug: string) => `/categories/${slug}`,

	
	ADMIN_DASHBOARD: "/admin",
	ADMIN_PUBLISHERS: "/admin/publishers",
	ADMIN_AUTHORS: "/admin/authors",
	ADMIN_CATEGORIES: "/admin/categories",
} as const;

export const ROUTER_PATHS = ROUTES;
