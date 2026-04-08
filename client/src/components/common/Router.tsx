import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@layout/MainLayout";
import { RootErrorBoundaryPage, HomePage, LoginPage, NotFoundPage, RegisterPage, UnauthorizePage, VerifyEmailPage, ResendVerificationPage, ProfilePage, CategoriesPage, CartPage } from "@pages";
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
    CATEGORIES: "/categories",
    CART: "/cart",
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
                path: ROUTER_PATHS.CATEGORIES,
                element: <CategoriesPage />
            },
            {
                path: ROUTER_PATHS.CART,
                element: <CartPage />
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
        ]
    }
]);

export default router;