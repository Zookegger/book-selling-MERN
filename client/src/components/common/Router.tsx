import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@layout/MainLayout";
import { RootErrorBoundaryPage, HomePage, LoginPage, NotFoundPage, RegisterPage, UnauthorizePage, VerifyEmailPage, ResendVerificationPage, ProfilePage } from "@pages";
import AdminPublishersPage from "@pages/AdminPublishers";
import ProtectedRoute from "./ProtectedRoute";
import BookDetail from "@pages/BookDetail";
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
    ADMIN_PUBLISHERS: "/admin/publishers",
}

const router = createBrowserRouter([
    {
        path: ROUTER_PATHS.HOME,
        element: <MainLayout />,
        errorElement: <RootErrorBoundaryPage />,
        children: [
            {
                index: true,
                element: <HomePage />
            },
            {
                path: "/books/:bookId",
                element: <BookDetail />
            },

            {
                path: "*",
                element: <NotFoundPage />
            },
            {
                path: ROUTER_PATHS.LOGIN,
                element: <LoginPage />
            },
            {
                path: ROUTER_PATHS.REGISTER,
                element: <RegisterPage />
            },
            {
                path: ROUTER_PATHS.UNAUTHORIZE,
                element: <UnauthorizePage />
            },
            {
                path: ROUTER_PATHS.VERIFY_EMAIL,
                element: <VerifyEmailPage />
            },
            {
                path: ROUTER_PATHS.RESEND_VERIFICATION,
                element: <ResendVerificationPage />
            },
            {
                path: ROUTER_PATHS.PROFILE,
                element: <ProtectedRoute><ProfilePage /></ProtectedRoute>
            },
            {
                path: ROUTER_PATHS.ADMIN_PUBLISHERS,
                element: (
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminPublishersPage />
                    </ProtectedRoute>
                ),
            },
        ]
    }
]);

export default router;