import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { Suspense, type ReactElement } from "react";
import MainLayout from "@layout/MainLayout";
import DashboardLoadingSkeleton from "@layout/DashboardLoadingSkeleton";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";
import useAuth from "@hooks/useAuth";
import { ROUTES } from "@constants/index";
import { RootErrorBoundaryPage, NotFoundPage, UnauthorizePage, CartPage } from "@pages";


export const ROUTER_PATHS = ROUTES;

const ProtectedRoute = ({ children, allowedRoles }: { children: ReactElement, allowedRoles?: string[] }) => {
    const { isLoading, isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (isLoading) return <LoadingSkeleton />;
    if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to={ROUTES.UNAUTHORIZE} replace />;
    }
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
                    const { default: LoginPage } = await import("@pages/Auth/Login");
                    return { Component: LoginPage };
                },
            },
            {
                path: ROUTES.REGISTER,
                lazy: async () => {
                    const { default: RegisterPage } = await import("@pages/Auth/Register");
                    return { Component: RegisterPage };
                },
            },
            {
                path: ROUTES.VERIFY_EMAIL,
                lazy: async () => {
                    const { default: VerifyEmailPage } = await import("@pages/Auth/VerifyEmail");
                    return { Component: VerifyEmailPage };
                },
            },
            {
                path: ROUTES.RESEND_VERIFICATION,
                lazy: async () => {
                    const { default: ResendVerificationPage } = await import("@pages/Auth/ResendVerification");
                    return { Component: ResendVerificationPage };
                },
            },
            {
                path: ROUTES.PROFILE,
                lazy: async () => {
                    const { default: ProfilePage } = await import("@pages/Profile/Profile");
                    return { Component: ProfilePage };
                },
            },
            {
                path: ROUTES.CART,
                lazy: async () => {
                    const { default: CartPage } = await import("@pages/Cart/Cart");
                    return { Component: CartPage };
                },
            },
            {
                path: ROUTES.CATEGORY,
                lazy: async () => {
                    const { default: CategoryList } = await import("@pages/Category/List");
                    return { Component: CategoryList };
                },
            },
            {
                path: ROUTES.CATEGORY_DETAIL(":slug"),
                lazy: async () => {
                    const { default: CategoryDetail } = await import("@pages/Category/Detail");
                    return { Component: CategoryDetail };
                }
            },
        ]
    }, {
        path: ROUTES.ADMIN_DASHBOARD,
        hydrateFallbackElement: <DashboardLoadingSkeleton />,
        lazy: async () => {
            const { default: AdminDashboardPage } = await import("@components/layout/DashboardLayout");
            return {
                element: (
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                ),
            };
        },
        errorElement: <RootErrorBoundaryPage />,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: DashboardHome } = await import("@pages/Admin/Home");
                    return { Component: DashboardHome };
                },
            },

            {
                path: ROUTER_PATHS.ADMIN_PUBLISHERS,
                lazy: async () => {
                    const { default: AdminPublishersPage } = await import("@pages/Admin/Publisher/AdminPublishers");
                    return { Component: AdminPublishersPage }
                },
            },
        ]
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
        path: ROUTES.UNAUTHORIZE,
        element: <UnauthorizePage />,
    },
]);

export default router;



