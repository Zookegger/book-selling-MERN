import { Navigate, useLocation } from "react-router-dom";
import Loading from "./Loading";

import type { ReactNode } from "react";
import useAuth from "@hooks/useAuth";
import { ROUTES } from "@constants/index";
import type { UserRoleDto } from "@my-types/user.dto";

type ProtectedRouteProps = {
    children: ReactNode;
    allowedRoles?: UserRoleDto[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
    }

    if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
        return <Navigate to={ROUTES.UNAUTHORIZE} replace />
    }

    return children;
}