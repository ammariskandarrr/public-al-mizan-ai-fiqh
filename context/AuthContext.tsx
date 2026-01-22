
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as RouterUser } from '../types';
import { supabaseAuth } from '../services/supabaseAuth';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
    user: RouterUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<RouterUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabaseAuth.auth.getSession();
                if (session?.user) {
                    setUser(mapSupabaseUserToRouterUser(session.user));
                }
            } catch (error) {
                console.error('Error checking auth session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkUser();

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(mapSupabaseUserToRouterUser(session.user));
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const mapSupabaseUserToRouterUser = (supabaseUser: SupabaseUser): RouterUser => {
        return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            avatar: supabaseUser.user_metadata?.avatar_url
        };
    };

    const signOut = async () => {
        await supabaseAuth.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
