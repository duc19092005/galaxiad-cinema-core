import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import './i18n/config';
import App from './App.tsx';
import { DOMTranslator } from './i18n/DOMTranslator.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DOMTranslator>
      <App />
    </DOMTranslator>
  </StrictMode>,
)
