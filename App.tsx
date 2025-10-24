import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import LoginPage from './components/LoginPage';
import QuoteBuilder from './components/QuoteBuilder';
import { useTranslation } from 'react-i18next';

const AppContainer: React.FC = () => {
    const { session, loading } = useAuth();
    const { i18n } = useTranslation();

    useEffect(() => {
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = i18n.dir(i18n.language);
    }, [i18n, i18n.language]);
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-primary text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    return (
        <div>
            {session ? <QuoteBuilder /> : <LoginPage />}
        </div>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContainer />
    </AuthProvider>
  );
};

export default App;