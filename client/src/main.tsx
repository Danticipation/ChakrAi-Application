// Force React development mode to prevent production mode warnings
if (typeof process !== 'undefined') {
  process.env.NODE_ENV = 'development';
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
