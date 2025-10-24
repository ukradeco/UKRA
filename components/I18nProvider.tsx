import React, { createContext, useState, useEffect, ReactNode } from 'react';
import arMessages from '../messages/ar.json';
import enMessages from '../messages/en.json';

type Messages = typeof arMessages;
type Locale = 'ar' | 'en';

export interface I18nContextType {
    locale: Locale;
    messages: Messages;
    t: (key: string) => string;
    setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messagesMap = {
    ar: arMessages,
    en: enMessages,
};

// Helper function to get nested values from message object
const getNestedValue = (obj: any, key: string): string => {
    return key.split('.').reduce((acc, part) => acc && acc[part], obj) || key;
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [locale, setLocale] = useState<Locale>('ar');
    const [messages, setMessages] = useState<Messages>(arMessages);

    useEffect(() => {
        setMessages(messagesMap[locale]);
    }, [locale]);

    const t = (key: string): string => {
        return getNestedValue(messages, key);
    };

    const value = {
        locale,
        messages,
        t,
        setLocale,
    };

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
