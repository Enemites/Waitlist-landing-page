import "@fontsource-variable/manrope";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource-variable/jetbrains-mono";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './brand.css';
import './product.css';
import './value-transformations.css';
import { MotionConfig } from 'motion/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>
);
