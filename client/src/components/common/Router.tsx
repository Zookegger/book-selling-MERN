import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@layout/MainLayout";
import { HomePage, LoginPage } from "@pages";

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
                path: "login",
                element: <LoginPage />
            },
        ]
    }
]);

export default router;