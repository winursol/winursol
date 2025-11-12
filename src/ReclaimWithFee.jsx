import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
    Transaction, 
    SystemProgram, 
    PublicKey, 
    LAMPORTS_PER_SOL, 
} from '@solana/web3.js';
// Yeni oluşturduğumuz yardımcı fonksiyonları import ediyoruz
import { 
    fetchUserTokenAccounts, 
    createReclaimInstruction, 
    createBurnInstruction 
} from './utils/solana'; 


// Sitenizin ana sekme içeriği ve işlem butonunu barındıran bileşen
function ReclaimBurnSection() {
    // Sekmeleri yönetmek için state
    const [activeTab, setActiveTab] = useState('CLEANUP');
    const [isLoading, setIsLoading] = useState(false); // İşlem durumu
    const [tokenAccounts, setTokenAccounts] = useState([]); // Token hesapları verisi
    // Kullanıcının seçtiği hesapları tutmak için state (Çoklu seçim için array)
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    
    // Cüzdan hook'ları
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection(); // Bağlantı (RPC) nesnesi

    // SABİT DEĞERLERİ useMemo ile tanımlıyoruz
    const FEE_AMOUNT_SOL = 0.1;
    // Komisyon alıcısının adresi
    const FEE_RECIPIENT_ADDRESS = useMemo(() => new PublicKey('GiLefarGmT5zvaeiFiLNmrckRen3MNjrXQ8fHCtAdN3s'), []);
    // 0.1 SOL'ü Lamport (en küçük Solana birimi) cinsinden hesaplama
    const FEE_AMOUNT_LAMPORTS = FEE_AMOUNT_SOL * LAMPORTS_PER_SOL;

    // --- TOKEN HESAPLARINI ÇEKME VE FİLTRELEME ---
    const loadTokenAccounts = useCallback(async () => {
        if (!publicKey || !connection) return;
        
        setIsLoading(true);
        try {
            const accounts = await fetchUserTokenAccounts(connection, publicKey);
            setTokenAccounts(accounts);
            // Hesaplar yeniden yüklendiğinde seçimi sıfırla
            setSelectedAccounts([]);

        } catch (error) {
            console.error('Veri yüklenirken hata:', error);
            setTokenAccounts([]);
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection]);

    // Aktif sekmeye göre gösterilecek hesaplar
    const displayAccounts = useMemo(() => {
        return tokenAccounts.filter(acc => {
            if (activeTab === 'CLEANUP') {
                return acc.isCleanable; // Sadece temizlenebilir hesaplar
            }
            if (activeTab === 'NFTS') {
                return acc.isNFT; // Sadece NFT'ler
            }
            if (activeTab === 'TOKENS') {
                return !acc.isCleanable && !acc.isNFT; // Temizlenebilir olmayan ve NFT olmayan tokenlar
            }
            return false; // Diğer sekmeler (CNFTS, DOMAINS) şimdilik boş
        });
    }, [tokenAccounts, activeTab]);


    // Cüzdan bağlandığında veya sekme değiştiğinde hesapları yükle
    useEffect(() => {
        loadTokenAccounts();
        
        // Sekme değiştiğinde seçimi sıfırla
        setSelectedAccounts([]);
        
        // Yeniden yükleme için kısa bir interval belirleyebiliriz (örneğin 30 saniyede bir)
        const intervalId = setInterval(loadTokenAccounts, 30000); 
        return () => clearInterval(intervalId); 

    }, [activeTab, loadTokenAccounts]);


    // Seçili hesapları yönetme
    const toggleAccountSelection = (pubkey) => {
        setSelectedAccounts(prev => {
            const pubkeyStr = pubkey.toBase58();
            if (prev.includes(pubkeyStr)) {
                return prev.filter(p => p !== pubkeyStr); // Kaldır
            } else {
                return [...prev, pubkeyStr]; // Ekle
            }
        });
    };

    // --- ANA İŞLEM FONKSİYONU (RECLAIM / BURN) ---
    const handleBurnOrReclaim = async () => {
        // Kontrol: Sadece işlem yapılması planlanan hesaplar üzerinde işlem yap
        const accountsToProcess = tokenAccounts.filter(acc => 
            selectedAccounts.includes(acc.tokenAccountPubkey.toBase58())
        );

        if (!publicKey || !connection || isLoading || accountsToProcess.length === 0) {
            alert('Lütfen en az bir hesap seçin veya cüzdanın bağlı olduğundan emin olun.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. İşlem nesnesini başlatma
            const transaction = new Transaction();
            
            // A) KOMİSYON TRANSFERİ TALİMATI (0.1 SOL)
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: FEE_RECIPIENT_ADDRESS,
                    lamports: FEE_AMOUNT_LAMPORTS, 
                })
            );

            // B) ANA İŞLEM TALİMATLARI (Reclaim veya Burn)
            let totalReclaimedSOL = 0;
            
            accountsToProcess.forEach(account => {
                if (account.isCleanable) {
                    // Temizlenebilir hesap: CloseAccount talimatı (Reclaim)
                    const instruction = createReclaimInstruction(
                        account.tokenAccountPubkey, 
                        publicKey // Geri alıcı ve yetkili
                    );
                    transaction.add(instruction);
                    totalReclaimedSOL += parseFloat(account.rentExemptSOL);

                } else if (activeTab === 'NFTS' || activeTab === 'TOKENS') {
                    // NFT veya Token: Burn talimatı
                    const instruction = createBurnInstruction(
                        account.tokenAccountPubkey, 
                        account.mint, 
                        publicKey, // Yetkili
                        BigInt(account.tokenAmountRaw) // Yakılacak ham miktar (BigInt ile)
                    );
                    transaction.add(instruction);
                }
            });

            console.log(`Toplam ${accountsToProcess.length} hesap işlenecek. Tahmini geri alınacak SOL: ${totalReclaimedSOL.toFixed(6)}`);

            // 2. İşlemi cüzdana gönderme
            const signature = await sendTransaction(transaction, connection);
            
            // 3. İşlemin onaylanmasını bekleme
            await connection.confirmTransaction(signature, 'confirmed');

            alert(`İşlem Başarılı! İmza: ${signature}. Geri alınan tahmini SOL: ${totalReclaimedSOL.toFixed(6)}`);
            // Başarılı işlem sonrası verileri yeniden yükle
            loadTokenAccounts(); 

        } catch (error) {
            console.error('Solana İşlem Hatası:', error);
            // Kullanıcıya daha anlamlı bir hata mesajı göster
            const userMessage = error.message.includes("User rejected the request") 
                ? "İşlem cüzdan tarafından reddedildi." 
                : `İşlem Başarısız: ${error.message.substring(0, 100)}... Konsolu kontrol edin.`;
            alert(userMessage);
        } finally {
            setIsLoading(false);
        }
    };
    // -----------------------------------------------------

    // Tabloda gösterilecek hesaplar (seçim durumu dahil)
    const renderTableRows = useMemo(() => {
        if (displayAccounts.length === 0) {
            return <p className="no-data-message">
                {activeTab === 'CLEANUP' 
                    ? 'Temizlenebilir boş hesap bulunamadı.' 
                    : `Bu sekmede (${activeTab}) işlem yapılabilecek token/NFT bulunamadı.`
                }
            </p>
        }
        
        return displayAccounts.map((account) => {
            const pubkeyStr = account.tokenAccountPubkey.toBase58();
            const isSelected = selectedAccounts.includes(pubkeyStr);
            
            // İşlem türünü belirleme
            const actionType = account.isCleanable ? 'Reclaim' : 'Burn';

            return (
                <div 
                    key={pubkeyStr} 
                    className={`table-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleAccountSelection(account.tokenAccountPubkey)}
                >
                    {/* Checkbox / Seçim Durumu */}
                    <span className="selection-box">
                        <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleAccountSelection(account.tokenAccountPubkey)}
                            onClick={(e) => e.stopPropagation()} // Checkbox'a tıklayınca row click'i engelle
                        />
                    </span>
                    
                    {/* Veri Sütunları */}
                    <span>{pubkeyStr.substring(0, 4)}...{pubkeyStr.slice(-4)}</span>
                    <span>{account.mint.toBase58().substring(0, 4)}...{account.mint.toBase58().slice(-4)}</span>
                    <span>{account.tokenBalance}</span>
                    <span style={{color: account.isCleanable ? 'var(--neon-green)' : 'gray'}}>
                        {account.isCleanable ? account.rentExemptSOL : '0.000000'}
                    </span>
                    <span className={`action-tag ${actionType.toLowerCase()}`}>
                        {actionType}
                    </span>
                </div>
            );
        });
    }, [displayAccounts, selectedAccounts]); // Bağımlılıkları ekledik

    // Toplam geri alınacak SOL miktarını hesaplama (sadece seçili CLEANUP hesapları için)
    const totalReclaimableSOL = useMemo(() => {
        return tokenAccounts.reduce((sum, account) => {
            const pubkeyStr = account.tokenAccountPubkey.toBase58();
            if (account.isCleanable && selectedAccounts.includes(pubkeyStr)) {
                return sum + parseFloat(account.rentExemptSOL);
            }
            return sum;
        }, 0).toFixed(6);
    }, [tokenAccounts, selectedAccounts]);

    // İşlem yapılması planlanan hesap sayısını hesapla
    const accountsToProcess = tokenAccounts.filter(acc => 
        selectedAccounts.includes(acc.tokenAccountPubkey.toBase58())
    );


    // Aktif sekmeye göre içeriği döndürür
    const renderContent = () => {
        const addressBase58 = publicKey ? publicKey.toBase58() : '';
        
        return (
            <div className="content-card">
                 {/* Cüzdanın bağlı olduğunu gösteren adres etiketi */}
                 <div className="wallet-status-label wallet-address-info">
                     Status: <span className="status-ready">Hazır</span>
                     <br/>
                     Bağlı Cüzdan: <span className="address-hash">{addressBase58}</span>
                 </div>
                 
                 {/* Sekme içeriği */}
                 <div className="tab-content-display">
                    {/* Yükleniyor durumu */}
                    {isLoading && <p className="loading-message">Hesap verileri yükleniyor...</p>}
                    
                    {/* Tablo */}
                    {!isLoading && (
                        <div className="data-table-container">
                             {/* Toplam Geri Alınacak SOL Özeti */}
                            {activeTab === 'CLEANUP' && (
                                <div className="reclaim-summary">
                                    Seçili Hesaplardan Tahmini Geri Alınacak SOL: 
                                    <span className="total-sol">{totalReclaimableSOL} SOL</span>
                                </div>
                            )}

                            <div className="data-table">
                                <div className="table-header">
                                    <span className="selection-box-header">Seç</span>
                                    <span># Token Account</span>
                                    <span>Mint</span>
                                    <span>Token Bal.</span>
                                    <span>Reclaim (SOL)</span>
                                    <span>İşlem</span>
                                </div>
                                <div className="table-body">
                                    {renderTableRows}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="reclaim-section">
            {/* 1. ANA NAVİGASYON SEKMELERİ */}
            <nav className="tabs-navigation">
                {['CLEANUP', 'TOKENS', 'NFTS', 'CNFTS', 'DOMAINS'].map(tab => (
                    <button 
                        key={tab}
                        className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        disabled={isLoading}
                    >
                        {tab}
                    </button>
                ))}
                
                {/* 2. ANA İŞLEM BUTONU */}
                <button 
                    className="main-action-button" 
                    onClick={handleBurnOrReclaim}
                    disabled={isLoading || selectedAccounts.length === 0} 
                >
                    {isLoading ? 'İşlem Devam Ediyor...' : 
                     `${accountsToProcess.length} Hesap İşle (${FEE_AMOUNT_SOL} SOL Komisyon)`}
                </button>
            </nav>

            {/* 3. İÇERİK BÖLÜMÜ */}
            <main className="content-area">
                {renderContent()}
            </main>
        </div>
    );
}

export default ReclaimBurnSection;