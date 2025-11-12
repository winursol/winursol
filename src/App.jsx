// App.jsx
import React from 'react';
// Yeni oluşturduğumuz ana iskeleti import ediyoruz
import MainLayout from './MainLayout'; 

function App() {
  // Sadece MainLayout bileşenini render ediyoruz.
  return (
    <div className="App">
      <MainLayout />
    </div>
  );
}

export default App;