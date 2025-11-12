import React from 'react';
// Cüzdan durumunu kontrol etmek için hook'u import edin
import { useWallet } from '@solana/wallet-adapter-react'; 
// Çalışan cüzdan butonu bileşenini import edin
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Ana işlem ve sekmeleri barındıran bileşeni import edin
// Bu dosyayı ReclaimBurnSection.jsx adıyla daha önce oluşturmuştuk. 
// Eğer sizde adı ReclaimWithFee.jsx ise, import adını ona göre ayarlayın.
import ReclaimBurnSection from './ReclaimWithFee';

function MainLayout() {
  // Cüzdanın bağlı olup olmadığını kontrol ediyoruz
  const { connected } = useWallet(); 

  // Not: Bu kısım, projenizin eski dosyalarından gelen statik uyarıdır.
  // Bu metni, .css dosyanızda düzenleyeceğimiz neon temasına uygun hale getirelim.

  return (
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

      {/* 2. CÜZDAN BAĞLANTI BUTONU VE BİLGİ ALANI */}
      <div className="wallet-info-bar">
          {/* STATİK BUTON YERİNE, ÇALIŞAN CÜZDAN BUTONUNU KOYUYORUZ */}
          {/* Bu buton (WalletMultiButton), bağlı değilse "Select Wallet", bağlıysa "Disconnect" yazar. */}
          <WalletMultiButton /> 
          
          <p className="burn-warning">
            Any tokens marked for burn on this page will be burned by executing the burn instruction. 
            This process cannot be reversed. Make sure you have the correct NFTs selected!
          </p>
      </div>

      {/* 3. ANA İÇERİK (SADECE CÜZDAN BAĞLIYSA SEKMELER VE İÇERİK GÖRÜNÜR) */}
      {connected ? (
          // Cüzdan bağlıysa sekmeleri ve içeriği gösteren bileşeni yüklüyoruz
          <ReclaimBurnSection />
      ) : (
          // Cüzdan bağlı değilse, bağlantı uyarısını gösteriyoruz
          <main className="content-area">
              <h2 className="content-title">CÜZDAN BAĞLANTISI GEREKLİ</h2>
              <p className="content-text">
                 LÜTFEN CÜZDANINIZI BAĞLAYIN.
              </p>
          </main>
      )}

    </div>
  );
}

export default MainLayout;