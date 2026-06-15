import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// 👤 src/pages/user 폴더 안의 파일들을 정확히 바라보도록 수정했습니다.
import App from './pages/user/kioskMain'; 
import reportWebVitals from './pages/user/reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();