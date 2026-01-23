import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

// Tabler JS 本地导入
import '@tabler/core/dist/js/tabler.min';
import '@tabler/core/dist/js/tabler.esm.min';

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