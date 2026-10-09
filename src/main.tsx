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

const root = document.getElementById('root')!;
const app = (
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>
);

if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
