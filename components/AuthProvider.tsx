'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';
import { createClient } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const supabase = createClient();
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSessionAndProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                setProfile(userProfile);
            }
            setLoading(false);
        };

        getSessionAndProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    setLoading(true);
                    const { data: userProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();
                    setProfile(userProfile ?? null);
                    setLoading(false);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
    };

    const value = {
        session,
        user,
        profile,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
