'use client';
import { useAuth } from '../../components/AuthProvider';
import LoginPage from '../../components/LoginPage';
import { useRouter } from 'next-intl/client';
import { useEffect } from 'react';

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/build');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-primary text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return null; // or a loading spinner while redirecting
}