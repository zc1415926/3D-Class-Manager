import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@tabler/core/dist/css/tabler.min.css';
import '@tabler/core/dist/css/tabler-flags.min.css';
import '@tabler/core/dist/css/tabler-payments.min.css';
import '@tabler/core/dist/css/tabler-vendors.min.css';
import '@tabler/icons-webfont/dist/tabler-icons.min.css';
import './index.css';
import App from './App';

// 抑制 WebGL 警告
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args[0];
  // 过滤 Babylon.js 和 WebGL 的常见警告
  if (typeof message === 'string' && (
    message.includes('generateMipmap') ||
    message.includes('lazy initialization') ||
    message.includes('TEXTURE_CUBE_MAP') ||
    message.includes('WEBGL_debug_renderer_info')
  )) {
    return;
  }
  originalWarn.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </Router>
  </React.StrictMode>
);