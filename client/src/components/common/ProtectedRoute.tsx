import { Navigate, useLocation } from "react-router-dom";
import Loading from "./Loading";

import type { ReactNode } from "react";
import useAuth from "hooks/useAuth";

type ProtectedRouteProps = {
    children: ReactNode;
    allowedRoles?: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (Loading());
    }

    if (!isAuthenticated) {
        return <Navigate to={"/sign-in"} state={{ from: location }} replace />
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />
    }

    return children;
}