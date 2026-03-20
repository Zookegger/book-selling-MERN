import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@layout/MainLayout";
import { HomePage, LoginPage, RegisterPage } from "@pages";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <HomePage />
            },
            {
                path: "sign-in",
                element: <LoginPage />
            },
            {
                path: "sign-up",
                element: <RegisterPage />
            },
        ]
    }
]);

export default router;