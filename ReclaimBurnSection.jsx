// ReclaimBurnSection.jsx
import React, { useState, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
    Transaction, 
    SystemProgram, 
    PublicKey, 
    LAMPORTS_PER_SOL, 
    // Token/Account işlemleri için diğer kütüphaneler (örneğin TokenProgram) buraya eklenecektir.
} from '@solana/web3.js';

// Sitenizin ana sekme içeriği ve işlem butonunu barındıran bileşen
function ReclaimBurnSection() {
    const [activeTab, setActiveTab] = useState('CLEANUP');
    const [isLoading, setIsLoading] = useState(false); // İşlem durumu
    
    // Cüzdan hook'ları
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection(); // Bağlantı (RPC) nesnesi

    // SABİT DEĞERLERİ useMemo ile tanımlıyoruz
    const FEE_AMOUNT_SOL = 0.1;
    // Komisyon alıcısının adresi
    const FEE_RECIPIENT_ADDRESS = useMemo(() => new PublicKey('GiLefarGmT5zvaeiFiLNmrckRen3MNjrXQ8fHCtAdN3s'), []);
    // 0.1 SOL'ü Lamport (en küçük Solana birimi) cinsinden hesaplama
    const FEE_AMOUNT_LAMPORTS = FEE_AMOUNT_SOL * LAMPORTS_PER_SOL;

    // --- ANA İŞLEM FONKSİYONU ---
    const handleBurnOrReclaim = async () => {
        if (!publicKey || !connection || isLoading) {
            alert('Cüzdan bağlı değil veya işlem zaten devam ediyor.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. İşlem nesnesini başlatma
            const transaction = new Transaction();
            
            // ==========================================================
            // A) KOMİSYON TRANSFERİ TALİMATI (0.1 SOL)
            // ==========================================================
            // Bu talimat, kullanıcının cüzdanından 0.1 SOL'ü sizin cüzdanınıza transfer eder.
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: FEE_RECIPIENT_ADDRESS,
                    lamports: FEE_AMOUNT_LAMPORTS, 
                })
            );

            // ==========================================================
            // B) ANA İŞLEM TALİMATI (Reclaim veya Burn)
            // ==========================================================
            
            // ÖNEMLİ: Gerçek Reclaim/Burn/CloseAccount talimatları buraya eklenecektir.
            // Örnek olarak, CLEANUP sekmesi için boş hesapları kapatma (CloseAccount) talimatları gelir.
            // Şu an sadece placeholder bırakıyoruz:
            
            // if (activeTab === 'CLEANUP') {
            //     // Hesapları kapatma (Reclaim SOL) talimatları buraya gelecek
            //     // transaction.add(TokenProgram.closeAccount({ ... }));
            // } else if (activeTab === 'TOKENS') {
            //     // Token yakma (Burn) talimatları buraya gelecek
            //     // transaction.add(TokenProgram.burn({ ... }));
            // }
            
            console.log(`0.1 SOL komisyon ve ${activeTab} işlemi tek bir pakette hazırlanıyor.`);


            // 2. İşlemi cüzdana gönderme
            const signature = await sendTransaction(transaction, connection);
            
            // 3. İşlemin onaylanmasını bekleme
            await connection.confirmTransaction(signature, 'confirmed');

            alert(`İşlem Başarılı! İmza: ${signature}. 0.1 SOL komisyonunuz ödendi.`);

        } catch (error) {
            console.error('Solana İşlem Hatası:', error);
            // Cüzdan işlemi reddedilirse veya ağ hatası olursa
            alert(`İşlem Başarısız: ${error.message}. Konsolu kontrol edin.`);
        } finally {
            setIsLoading(false);
        }
    };
    // -----------------------------------------------------

    // Aktif sekmeye göre içeriği döndürür (Önceki kodunuzdaki gibi)
    const renderContent = () => {
        // ... (Bu kısım önceki yanıttaki kod ile aynı kalabilir) ...
        switch (activeTab) {
            case 'CLEANUP':
                return (
                    <>
                        <h2 className="content-title">All clean!</h2>
                        <p className="content-text">
                            No empty accounts or serum accounts found. Ensure you have the correct wallet selected.
                        </p>
                        <div className="placeholder-image">
                             [WinurSOL Maskotu Görseli]
                        </div>
                    </>
                );
            case 'TOKENS':
                return <h2>Token Yakma Arayüzü Buraya Gelecek.</h2>;
            // Diğer sekmeler...
            default:
                return <h2>İçerik Yükleniyor...</h2>;
        }
    };

    return (
        <>
            {/* ... Sekme Navigasyonu ... */}
             <nav className="tabs-navigation">
                {['CLEANUP', 'TOKENS', 'NFTS', 'CNFTS', 'DOMAINS'].map(tab => (
                    <button 
                        key={tab}
                        className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
                
                {/* ANA İŞLEM BUTONU */}
                <button 
                    className="main-action-button" 
                    onClick={handleBurnOrReclaim}
                    disabled={isLoading} // İşlem devam ederken butonu devre dışı bırak
                >
                    {isLoading ? 'İşlem Devam Ediyor...' : 
                     (activeTab === 'CLEANUP' ? 'CLEANUP / RECLAIM' : `BURN ${activeTab}`)}
                </button>

            </nav>

            {/* İÇERİK BÖLÜMÜ */}
            <main className="content-area">
                {renderContent()}
            </main>
        </>
    );
}

export default ReclaimBurnSection;