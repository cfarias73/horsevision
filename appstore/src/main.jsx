import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './product/index.css';
import { AppLanguageProvider } from './product/lib/language.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppLanguageProvider>
      <App />
    </AppLanguageProvider>
  </React.StrictMode>,
);
