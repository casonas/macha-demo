import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ensureFirebaseAuthPersistence } from './services/firebaseConfig';
import './index.css'; // <--- ADD THIS LINE (Must be index.css, not App.css)

const USE_FIREBASE = (process.env.REACT_APP_DATA_PROVIDER || 'firebase') === 'firebase';

if (USE_FIREBASE) {
  // Initialize persistence before the app mounts so reloads keep the existing
  // Firebase session instead of briefly rendering as signed out.
  void ensureFirebaseAuthPersistence().catch((err) => {
    console.error('Failed to initialize Firebase auth persistence:', err);
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
