import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';

interface User {
    email: string;
    uid: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, pass: string, role: string) => Promise<any>;
    signup: (email: string, pass: string, role: string) => Promise<any>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(tpo)' || segments[0] === '(alumni)';

        // Auto-routing logic
        if (!user && inAuthGroup) {
            router.replace('/login');
        } else if (user && (!segments[0] || (segments[0] as string) === 'login' || (segments[0] as string) === 'signup' || (segments[0] as string) === 'index')) {
            // Redirect based on role
            if (user.role === 'TPO') {
                router.replace('/(tpo)/dashboard' as any);
            } else if (user.role === 'Alumni') {
                router.replace('/(alumni)/dashboard' as any);
            } else {
                router.replace('/(tabs)/home' as any);
            }
        }
    }, [user, isLoading, segments]);

    const login = async (email: string, pass: string, role: string) => {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setUser({ email, uid: 'local-mock-id', role });
    };

    const signup = async (email: string, pass: string, role: string) => {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setUser({ email, uid: 'local-mock-id', role });
    };

    const logout = async () => {
        setUser(null);
    };

    const resetPassword = async (email: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Password reset sent to ${email}`);
    };

    const value = {
        user,
        isLoading,
        login,
        signup,
        logout,
        resetPassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
