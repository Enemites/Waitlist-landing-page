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
