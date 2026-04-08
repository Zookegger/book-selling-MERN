import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { Suspense, type ReactElement } from "react";
import MainLayout from "@layout/MainLayout";
import { RootErrorBoundaryPage, HomePage, LoginPage, NotFoundPage, RegisterPage, UnauthorizePage, VerifyEmailPage, ResendVerificationPage, ProfilePage, CategoryPage } from "@pages";
import ProtectedRoute from "./ProtectedRoute";

export const ROUTER_PATHS = {
    HOME: "/",
    LOGIN: "/account/sign-in",
    REGISTER: "/account/sign-up",
    FORGOT_PASSWORD: "/account/forgot-password",
    UNAUTHORIZE: "/unauthorized",
    ERROR: "/error",
    VERIFY_EMAIL: "/verify-email",
    RESEND_VERIFICATION: "/resend-verification",
    PROFILE: "/account/profile",
    CATEGORY: "/categories"
    
}

const router = createBrowserRouter([
    {
        path: ROUTES.HOME,
        element: (
			<MainLayout>
				<Suspense fallback={<LoadingSkeleton />}>
					<Outlet />
				</Suspense>
			</MainLayout>
		),
        errorElement: <RootErrorBoundaryPage />,
        children: [
            {
                index: true,
                lazy: async () => {
					const { default: HomePage } = await import("@pages/Home");
					return { Component: HomePage };
				},
            },
            {
                path: ROUTES.BOOK_DETAIL,
                lazy: async () => {
					const { default: BookDetail } = await import("@pages/Book/BookDetail");
					return { Component: BookDetail };
				},
            },
            {
                path: ROUTES.LOGIN,
                lazy: async () => {
					const { default: LoginPage } = await import("@pages/Login");
					return { Component: LoginPage };
				},
            },
            {
                path: ROUTES.REGISTER,
                lazy: async () => {
					const { default: RegisterPage } = await import("@pages/Register");
					return { Component: RegisterPage };
				},
            },
            {
                path: ROUTES.UNAUTHORIZE,
                element: <UnauthorizePage />,
            },
            {
                path: ROUTES.VERIFY_EMAIL,
                lazy: async () => {
					const { default: VerifyEmailPage } = await import("@pages/VerifyEmail");
					return { Component: VerifyEmailPage };
				},
            },
            {
                path: ROUTES.RESEND_VERIFICATION,
                lazy: async () => {
					const { default: ResendVerificationPage } = await import("@pages/ResendVerification");
					return { Component: ResendVerificationPage };
				},
            },
            {
                path: ROUTES.PROFILE,
                element: (
					<RequireAuth>
						<ProfilePage />
					</RequireAuth>
				),
            },
            {
                path: ROUTES.NOT_FOUND,
                element: <NotFoundPage />,
            },
            {
                path: "*",
                element: <Navigate to={ROUTES.NOT_FOUND} replace />,
            },
            {
                path: ROUTER_PATHS.CATEGORY,
                element: <ProtectedRoute allowedRoles={["admin"]}><CategoryPage /></ProtectedRoute>
            },
        ]
    }
]);

export default router;