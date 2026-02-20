import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    email: string;
    uid: string;
    role: string;
    name?: string;
    company?: string;
    position?: string;
    avatar?: string;
    availability?: { id: string; day: string; time: string; bookedBy?: string }[];
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, pass: string, role: string) => Promise<any>;
    signup: (email: string, pass: string, role: string) => Promise<any>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
    USER_SESSION: 'placementpro_user_session',
    PROFILE_PREFIX: 'placementpro_profile_'
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    // Load session on startup
    useEffect(() => {
        const loadSession = async () => {
            try {
                const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    // Load the full profile for this email
                    const profileData = await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}${session.email}`);
                    if (profileData) {
                        setUser(JSON.parse(profileData));
                    } else {
                        setUser(session);
                    }
                }
            } catch (e) {
                console.error('Failed to load session', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(tpo)' || segments[0] === '(alumni)';

        // Auto-routing logic
        if (!user && inAuthGroup) {
            router.replace('/login');
        } else if (user && (!segments[0] || (segments[0] as string) === 'login' || (segments[0] as string) === 'signup' || (segments[0] as string) === 'index')) {
            // Redirect based on role
            if (user.role === 'Alumni') {
                router.replace('/(alumni)/dashboard' as any);
            } else {
                router.replace('/(tabs)/home' as any);
            }
        }
    }, [user, isLoading, segments]);

    const login = async (email: string, pass: string, role: string) => {
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check for existing saved profile
        const savedProfile = await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}${email}`);
        let userData: User;

        if (savedProfile) {
            userData = JSON.parse(savedProfile);
            // Ensure role matches login attempt
            userData.role = role;
        } else {
            userData = {
                email,
                uid: 'local-mock-id-' + Date.now(),
                role,
                name: email.split('@')[0],
                avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
            };
        }

        // Save session and profile
        await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify({ email, role, uid: userData.uid }));
        await AsyncStorage.setItem(`${STORAGE_KEYS.PROFILE_PREFIX}${email}`, JSON.stringify(userData));

        setUser(userData);
    };

    const signup = async (email: string, pass: string, role: string) => {
        await new Promise(resolve => setTimeout(resolve, 800));

        const userData: User = {
            email,
            uid: 'local-mock-id-' + Date.now(),
            role,
            name: email.split('@')[0],
            avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
        };

        await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify({ email, role, uid: userData.uid }));
        await AsyncStorage.setItem(`${STORAGE_KEYS.PROFILE_PREFIX}${email}`, JSON.stringify(userData));

        setUser(userData);
    };

    const logout = async () => {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
        setUser(null);
    };

    const resetPassword = async (email: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Password reset sent to ${email}`);
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;

        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedUser = { ...user, ...data };

        // Persist updated profile
        await AsyncStorage.setItem(`${STORAGE_KEYS.PROFILE_PREFIX}${user.email}`, JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const value = {
        user,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
        updateProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
