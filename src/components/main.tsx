import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // استيراد واحد فقط يكفي

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);