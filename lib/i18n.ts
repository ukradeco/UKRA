import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // Allows i18next to fetch translation files from a server
  .use(HttpApi)
  // Detects user language
  .use(LanguageDetector)
  // Passes the i18n instance to react-i18next
  .use(initReactI18next)
  // Initializes i18next
  .init({
    // Languages supported by the app
    supportedLngs: ['en', 'ar'],
    // Default language
    lng: 'ar',
    // Fallback language if translation is missing
    fallbackLng: 'en',
    // Options for the http backend
    backend: {
      // Path to the translation files, relative to the public root
      loadPath: '/messages/{{lng}}.json',
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Integration with React Suspense is crucial for async loading
    react: {
      useSuspense: true,
    },
  });

export default i18n;