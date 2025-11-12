import React from 'react';
import { createRoot } from 'react-dom/client';
// src/index.css dosyasını import ediyoruz (Çünkü stil kodlarının büyük kısmı bu dosyada birleştirildi)
import './index.css'; 
import App from './App';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  
  // React uygulamasını ana bileşenimiz olan App ile render ediyoruz
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
    console.error("ID'si 'root' olan DOM elementi bulunamadı. Uygulama başlatılamıyor.");
}