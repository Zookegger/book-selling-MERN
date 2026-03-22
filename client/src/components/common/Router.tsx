import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@layout/MainLayout";
import { RootErrorBoundaryPage, HomePage, LoginPage, NotFoundPage, RegisterPage, UnauthorizePage, VerifyEmailPage, ResendVerificationPage } from "@pages";

export const ROUTER_PATHS = {
    HOME: "/",
    LOGIN: "/account/sign-in",
    REGISTER: "/account/sign-up",
    FORGOT_PASSWORD: "/account/forgot-password",
    UNAUTHORIZE: "/unauthorized",
    ERROR: "/error",
    VERIFY_EMAIL: "/verify-email",
    RESEND_VERIFICATION: "/resend-verification",
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
        ]
    }
]);

export default router;