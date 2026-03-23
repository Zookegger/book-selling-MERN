import { Navigate, useLocation } from "react-router-dom";
import Loading from "./Loading";

import type { ReactNode } from "react";
import useAuth from "@hooks/useAuth";
import { ROUTER_PATHS } from "./Router";
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
        return <Navigate to={ROUTER_PATHS.LOGIN} state={{ from: location }} replace />
    }

    if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
        return <Navigate to={ROUTER_PATHS.UNAUTHORIZE} replace />
    }

    return children;
}