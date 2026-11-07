import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Pretendard 를 번들에 포함 (CDN 차단·지연과 무관하게 항상 같은 글꼴)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import App from './App';
import './index.css';

// PWA Service Worker 등록 및 즉시 업데이트 활성화
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('PWA service worker registration failed:', err);
      });
  });
}

const container = document.getElementById('root');
if (!container) throw new Error('#root 엘리먼트를 찾을 수 없습니다.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
