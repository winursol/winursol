import React from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import * as web3 from '@solana/web3.js';

import ReclaimBurnSection from './ReclaimWithFee.jsx';
import { LanguageProvider, useTranslation } from './LanguageContext.jsx'; // YENİ IMPORT

// --- Dil Seçici Bileşen ---
const LanguageSwitcher = () => {
    const { language, setLanguage } = useTranslation();

    return (
        <div className="language-switcher">
            <button 
                onClick={() => setLanguage('en')} 
                className={language === 'en' ? 'active-lang' : ''}
                style={{ marginRight: '5px', fontWeight: language === 'en' ? 'bold' : 'normal' }}
            >
                EN
            </button>
            |
            <button 
                onClick={() => setLanguage('tr')} 
                className={language === 'tr' ? 'active-lang' : ''}
                style={{ marginLeft: '5px', fontWeight: language === 'tr' ? 'bold' : 'normal' }}
            >
                TR
            </button>
        </div>
    );
};
// ----------------------------

function AppContent() {
    const { t } = useTranslation(); // Çeviri hook'u

    // Cüzdan adaptörleri
    const wallets = useMemo(
        () => [
            // Cüzdan adaptörlerinizi buraya ekleyin (Phantom, Sollet, vb.)
            new UnsafeBurnerWalletAdapter(),
        ],
        []
    );

    // Sağlayıcı adresi
    const network = web3.clusterApiUrl('mainnet-beta');

    return (
        <ConnectionProvider endpoint={network}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="App">
                        <header className="app-header">
                            <div className="title-bar">
                                <h1 className="site-title">WINURSOL</h1>
                                <div className="header-controls">
                                    <LanguageSwitcher /> {/* Dil Seçici */}
                                    {/* Cüzdan Bağlama Butonu */}
                                    <div className="wallet-button-container">
                                        <WalletMultiButton />
                                    </div>
                                </div>
                            </div>
                            <h2 className="section-title">WINURSOL – {t('TITLE')}</h2> 
                        </header>
                        
                        <ReclaimBurnSection />

                        <footer className="app-footer">
                            {/* Footer içeriği */}
                        </footer>
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

// Ana App bileşeni artık LanguageProvider ile sarmalanmış olmalı
function App() {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}

export default App;