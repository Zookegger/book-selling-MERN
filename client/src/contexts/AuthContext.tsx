import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import userService, { authService } from "@services/auth.services";
import type { GetMeResponseDto, LoginRequestDto, LoginResponseDto, RegisterRequestDto, RegisterResponseDto } from "@my-types/auth.dto";

type AuthContextType = {
    user: GetMeResponseDto | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequestDto) => Promise<LoginResponseDto | undefined>;
    register: (data: RegisterRequestDto) => Promise<RegisterResponseDto | undefined>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const userData = await userService.getCurrentUser();
            if (userData) {
                setUser(userData as any);
                setIsAuthenticated(true);
            }
        } catch (err) {
            localStorage.removeItem('accessToken');
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser()
    }, [loadUser]);

    async function login(data: LoginRequestDto) {
        setIsLoading(true);

        try {

            const response = await authService.login(data);
            localStorage.setItem("accessToken", response.token);

            await loadUser();
            return response;
        } catch (err: any) {
            console.error(err.statusCode ?? err.code, " - ", err.message);
            throw { status: err.status, message: err.message }
        } finally {
            setIsLoading(false);
        }
    }

    async function register(data: RegisterRequestDto) {
        setIsLoading(true);
        try {
            const response = await authService.register(data);
            return response;
        } catch (err: any) {
            console.error(err.statusCode ?? err.code, " - ", err.message);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
        }
    }
    async function logout() {
        setIsLoading(true);
        try {
            await authService.logout();
        } catch (err: any) {
            console.error(err.statusCode ?? err.code, " - ", err.message);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
        }
    }

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
} 