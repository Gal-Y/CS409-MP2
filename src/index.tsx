import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'normalize.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const routingBase = process.env.NODE_ENV === 'production' ? '/mp2' : '/';

root.render(
  <React.StrictMode>
    <BrowserRouter basename="/CS409-MP2">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
