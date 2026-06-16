import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRouter from './Router'; // 🌟 App 대신 Router를 가져옵니다.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppRouter /> {/* 🌟 여기를 <AppRouter />로 교체합니다. */}
  </React.StrictMode>
);