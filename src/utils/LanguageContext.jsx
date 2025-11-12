import React, { createContext, useState, useContext } from 'react';

// --- 1. Çevirileri Tanımlama (Standart dil İngilizce) ---
const translations = {
    en: {
        TITLE: "RECLAIM SOL & BURN UNWANTED TOKENS",
        STATUS_READY: "Ready",
        CONNECTED_WALLET: "Connected Wallet",
        CLEANUP: "CLEANUP",
        TOKENS: "TOKENS",
        NFTS: "NFTS",
        CNFTS: "CNFTS",
        DOMAINS: "DOMAINS",
        SELECT: "SELECT",
        TOKEN_ACCOUNT: "# TOKEN ACCOUNT",
        MINT: "MINT",
        TOKEN_BAL: "TOKEN BAL.",
        RECLAIM_SOL: "RECLAIM (SOL)",
        ACTION_FEE: "ACTION (0.1 SOL)",
        BURN: "BURN",
        RECLAIM: "RECLAIM",
        NO_CLEANUP: "No cleanable empty accounts found.",
        NO_TOKENS: "No liquid tokens (available for burning) found in your wallet.",
        NO_ITEMS: "No items available for action in this tab.",
        LOADING: "Account data is loading...",
        TOTAL_RECLAIM: "Estimated SOL to be Reclaimed from selected accounts:",
    },
    tr: {
        TITLE: "SOL Geri Al ve İstenmeyen Tokenları Yak",
        STATUS_READY: "Hazır",
        CONNECTED_WALLET: "Bağlı Cüzdan",
        CLEANUP: "TEMİZLEME",
        TOKENS: "TOKENLAR",
        NFTS: "NFT'LER",
        CNFTS: "CNFT'LER",
        DOMAINS: "ALAN ADLARI",
        SELECT: "SEÇ",
        TOKEN_ACCOUNT: "# TOKEN HESABI",
        MINT: "MINT",
        TOKEN_BAL: "TOKEN BAK.",
        RECLAIM_SOL: "GERİ AL (SOL)",
        ACTION_FEE: "İŞLEM YAP (0.1 SOL)",
        BURN: "YAK",
        RECLAIM: "GERİ AL",
        NO_CLEANUP: "Temizlenebilir boş hesap bulunamadı.",
        NO_TOKENS: "Cüzdanınızda bakiyeli (yakılabilir) token bulunamadı.",
        NO_ITEMS: "Bu sekmede işlem yapılabilecek öğe bulunamadı.",
        LOADING: "Hesap verileri yükleniyor...",
        TOTAL_RECLAIM: "Seçili Hesaplardan Tahmini Geri Alınacak SOL:",
    }
};

// --- 2. Context Oluşturma ---
export const LanguageContext = createContext();

// --- 3. Sağlayıcı Bileşeni (Provider) ---
export const LanguageProvider = ({ children }) => {
    // Standart dil İngilizce (İSTEK)
    const [language, setLanguage] = useState('en'); 

    const t = (key) => {
        // Eğer çeviri yoksa veya dil yoksa, İngilizce karşılığı döner
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Hook ile kolay kullanım
export const useTranslation = () => {
    return useContext(LanguageContext);
};