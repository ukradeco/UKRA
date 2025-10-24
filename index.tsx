import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './lib/i18n'; // Initializes i18next

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50">Loading...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);