import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { Suspense, type ReactElement } from "react";
import MainLayout from "@layout/MainLayout";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";
import useAuth from "@hooks/useAuth";
import { ROUTES } from "@constants/index";
import { RootErrorBoundaryPage, NotFoundPage, UnauthorizePage, ProfilePage } from "@pages";

export const ROUTER_PATHS = ROUTES;

const RequireAuth = ({ children }: { children: ReactElement }) => {
	const { isLoading, isAuthenticated } = useAuth();
	const location = useLocation();

	if (isLoading) return <LoadingSkeleton />;
	if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
	return children;
};

const router = createBrowserRouter([
    {
        path: ROUTES.HOME,
        hydrateFallbackElement: <LoadingSkeleton />,
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
        ]
    }
]);

export default router;