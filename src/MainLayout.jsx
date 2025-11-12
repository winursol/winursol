// MainLayout.jsx
import React from 'react';

// Sitedeki tüm görsel öğeler, butonlar ve sekmeler bu bileşen içinde yer alacak.
function MainLayout() {
  return (
    <div className="main-container">
      
      {/* 1. BAŞLIK VE LOGO ALANI */}
      <header className="site-header">
        {/* LOGO GÖRSELİ VE BAŞLIK BURADA OLACAK */}
        <div className="logo-section">
          <span className="logo-text">WINURSOL</span>
        </div>
        
        {/* SAĞ ÜST İKONLAR (Discord, Twitter, Kullanıcı) */}
        <div className="header-icons">
          {/* İKONLARIN YERİ - Şimdilik Boş */}
          <span className="icon">D</span> 
          <span className="icon">X</span>
          <span className="icon">👤</span> 
        </div>
      </header>

      {/* 2. CÜZDAN BAĞLANTI BUTONU VE BİLGİ ALANI */}
      <div className="wallet-info-bar">
          {/* Burada cüzdan bağlantı bileşeniniz (Select Wallet) yer alacak. */}
          <button className="disconnect-btn">disconnect wallet</button>
          <p className="burn-warning">
            Any tokens marked for burn on this page will be burned by executing the burn instruction. 
            This process cannot be reversed. Make sure you have the correct NFTs selected!
          </p>
      </div>

      {/* 3. ANA NAVİGASYON SEKMELERİ */}
      <nav className="tabs-navigation">
          <button className="tab-button active">CLEANUP</button>
          <button className="tab-button">TOKENS</button>
          <button className="tab-button">NFTS</button>
          <button className="tab-button">CNFTS</button>
          <button className="tab-button">DOMAINS</button>
      </nav>
      
      {/* 4. İÇERİK BÖLÜMÜ */}
      <main className="content-area">
          {/* Şimdilik Cleanup sekmesinin temel içeriğini koyduk */}
          <h2 className="content-title">All clean!</h2>
          <p className="content-text">
            No empty accounts or serum accounts found. Ensure you have the correct wallet selected.
          </p>
          {/* Burada o yeşil yaratık görselinin yeri olacak */}
          <div className="placeholder-image">
             [WinurSOL Maskotu Görseli]
          </div>
      </main>

    </div>
  );
}

export default MainLayout;