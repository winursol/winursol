import React from 'react';
// Cüzdan durumunu kontrol etmek için hook'u import edin
import { useWallet } from '@solana/wallet-adapter-react'; 
// Çalışan cüzdan butonu bileşenini import edin
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// DÜZELTME: ReclaimWithFee dosyasını import ediyoruz.
import ReclaimBurnSection from './ReclaimWithFee'; 

function MainLayout() {
  // Cüzdanın bağlı olup olmadığını kontrol ediyoruz
  const { connected } = useWallet(); 

  return (
    // 'main-container' CSS'te ekranı ortalayacak şekilde ayarlanacak
    <div className="main-container">
      
      {/* 1. BAŞLIK VE LOGO ALANI */}
      <header className="site-header">
        <div className="logo-section">
          <span className="logo-text">WINURSOL</span>
        </div>
        
        {/* SAĞ ÜST İKONLAR */}
        <div className="header-icons">
          <span className="icon">D</span> 
          <span className="icon">X</span>
          <span className="icon">👤</span> 
        </div>
      </header>

      {/* 2. ANA İÇERİK BÖLÜMÜ */}
      <main className="content-area">
          <h1 className="main-title">WinurSOL — Reclaim SOL & Burn Unwanted Tokens</h1>
          
          {connected ? (
              // Cüzdan bağlıysa: Ana işlem içeriğini (Sekmeler ve İşlemler) göster
              <>
                  {/* Bu noktadan sonra cüzdan adresini ReclaimWithFee bileşeni gösterecek */}
                  <ReclaimBurnSection />
              </>
          ) : (
              // Cüzdan bağlı değilse: Merkezi cüzdan bağlama kartını göster
              <div className="wallet-connect-card">
                  <h2 className="content-title">CÜZDAN BAĞLANTISI GEREKLİ</h2>
                  <p className="content-text">Lütfen devam etmek için cüzdanınızı bağlayın.</p>
                  
                  {/* Merkezi Cüzdan Bağlama Butonu */}
                  <WalletMultiButton className="main-connect-button" />
                  
                  <p className="burn-warning">
                    Any tokens marked for burn on this page will be burned by executing the burn instruction. 
                    This process cannot be reversed. Make sure you have the correct NFTs selected!
                  </p>
              </div>
          )}
      </main>
    </div>
  );
}

export default MainLayout;