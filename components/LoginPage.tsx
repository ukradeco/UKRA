'use client';
import React, { useState } from 'react';
import { createClient } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import LocaleSwitcher from './LocaleSwitcher';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                setError(error.message);
            }
        } catch (err: any) {
            setError(err.message || t('LoginPage.unexpectedError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
             <div className="absolute top-4 end-4">
                <LocaleSwitcher />
            </div>
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-2xl border">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-primary">UKRA</h1>
                    <p className="mt-2 text-lg text-secondary">{t('LoginPage.title')}</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">{t('LoginPage.emailPlaceholder')}</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder={t('LoginPage.emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">{t('LoginPage.passwordPlaceholder')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder={t('LoginPage.passwordPlaceholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
                        >
                            {loading ? t('LoginPage.loggingInButton') : t('LoginPage.loginButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;