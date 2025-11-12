import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
    Transaction, 
    SystemProgram, 
    PublicKey, 
    LAMPORTS_PER_SOL, 
} from '@solana/web3.js';
// Yardımcı fonksiyonları import ediyoruz (utils/solana.js dosyası kurulu olmalı)
import { 
    fetchUserTokenAccounts, 
    createReclaimInstruction, 
    createBurnInstruction 
} from './utils/solana'; 


// Sitenizin ana sekme içeriği ve işlem butonlarını barındıran bileşen
function ReclaimBurnSection() {
    // BURASI GÜNCELLENDİ: Varsayılan olarak bakiyeli tokenların olduğu TOKENS sekmesi açılıyor
    const [activeTab, setActiveTab] = useState('TOKENS'); 
    const [isLoading, setIsLoading] = useState(false); // İşlem durumu
    const [tokenAccounts, setTokenAccounts] = useState([]); // Token hesapları verisi
    // Çoklu seçim artık kullanılmıyor, ancak state tutuluyor
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    
    // Cüzdan hook'ları
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection(); // Bağlantı (RPC) nesnesi

    // SABİT DEĞERLERİ useMemo ile tanımlıyoruz
    const FEE_AMOUNT_SOL = 0.1; // Komisyon miktarı
    // Komisyon alıcısının adresi
    const FEE_RECIPIENT_ADDRESS = useMemo(() => new PublicKey('GiLefarGmT5zvaeiFiLNmrckRen3MNjrXQ8fHCtAdN3s'), []);
    // 0.1 SOL'ü Lamport cinsinden hesaplama
    const FEE_AMOUNT_LAMPORTS = FEE_AMOUNT_SOL * LAMPORTS_PER_SOL;

    // --- TOKEN HESAPLARINI ÇEKME VE FİLTRELEME ---
    const loadTokenAccounts = useCallback(async () => {
        if (!publicKey || !connection) return;
        
        setIsLoading(true);
        try {
            const accounts = await fetchUserTokenAccounts(connection, publicKey);
            
            // İstek: Bakiyesi 1 bile olsa listeleme (isCleanable = 0 bakiye veya > 0 bakiye)
            const filteredAccounts = accounts.filter(acc => 
                 acc.tokenBalance > 0 || acc.isCleanable 
            );
            
            setTokenAccounts(filteredAccounts);
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
                return acc.isCleanable; // Sadece temizlenebilir (boş) hesaplar
            }
            if (activeTab === 'NFTS') {
                return acc.isNFT && acc.tokenBalance > 0; // Sadece NFT'ler (bakiyesi > 0)
            }
            if (activeTab === 'TOKENS') {
                // Bakiyesi > 0 olan ve ne Cleanable ne de NFT olan tokenlar
                return !acc.isCleanable && !acc.isNFT && acc.tokenBalance > 0; 
            }
            return false;
        });
    }, [tokenAccounts, activeTab]);


    // Cüzdan bağlandığında veya sekme değiştiğinde HESAPLARI OTOMATİK YÜKLE
    useEffect(() => {
        loadTokenAccounts();
        
        setSelectedAccounts([]);
        
        // Yeniden yükleme için interval
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

    // --- TEK HESAP İÇİN İŞLEM FONKSİYONU (BURN/RECLAIM) ---
    const handleSingleAction = useCallback(async (account) => {
        if (!publicKey || !connection || isLoading) return;

        setIsLoading(true);
        try {
            const transaction = new Transaction();
            
            // A) KOMİSYON TRANSFERİ TALİMATI (0.1 SOL) - ZORUNLU
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: FEE_RECIPIENT_ADDRESS,
                    lamports: FEE_AMOUNT_LAMPORTS, 
                })
            );
            
            let actionType = account.isCleanable ? 'Geri Alma' : 'Yakma';
            
            // B) ANA İŞLEM TALİMATI
            if (account.isCleanable) {
                // Temizlenebilir hesap: CloseAccount talimatı (Reclaim)
                const instruction = createReclaimInstruction(
                    account.tokenAccountPubkey, 
                    publicKey 
                );
                transaction.add(instruction);

            } else if (account.tokenBalance > 0) {
                // NFT veya Token: Burn talimatı 
                const instruction = createBurnInstruction(
                    account.tokenAccountPubkey, 
                    account.mint, 
                    publicKey, 
                    BigInt(account.tokenAmountRaw) 
                );
                transaction.add(instruction);
            } else {
                alert("Bu tokenin bakiyesi 0 olduğundan işlem yapılamaz.");
                return;
            }

            // İşlemi cüzdana gönderme
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');

            alert(`${account.mint.toBase58().substring(0, 8)}... ${actionType} işlemi Başarılı! 0.1 SOL komisyon kesildi.`);
            loadTokenAccounts(); 

        } catch (error) {
            console.error('Solana Tek İşlem Hatası:', error);
            const userMessage = error.message.includes("User rejected the request") 
                ? "İşlem cüzdan tarafından reddedildi." 
                : `İşlem Başarısız: ${error.message.substring(0, 100)}... Konsolu kontrol edin.`;
            alert(userMessage);
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, isLoading, FEE_RECIPIENT_ADDRESS, FEE_AMOUNT_LAMPORTS, loadTokenAccounts]);
    // -----------------------------------------------------------------


    // Tabloda gösterilecek hesaplar (seçim durumu dahil)
    const renderTableRows = useMemo(() => {
        if (displayAccounts.length === 0) {
            return <p className="no-data-message">
                {activeTab === 'CLEANUP' 
                    ? 'Temizlenebilir boş hesap bulunamadı.' 
                    : activeTab === 'TOKENS'
                        ? 'Cüzdanınızda bakiyeli (burn edilebilir) token bulunamadı.'
                        : `Bu sekmede (${activeTab}) işlem yapılabilecek öğe bulunamadı.`
                }
            </p>
        }
        
        return displayAccounts.map((account) => {
            const pubkeyStr = account.tokenAccountPubkey.toBase58();
            const isSelected = selectedAccounts.includes(pubkeyStr);
            
            const actionType = account.isCleanable ? 'RECLAIM' : 'BURN';

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
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </span>
                    
                    {/* Veri Sütunları */}
                    <span>{pubkeyStr.substring(0, 4)}...{pubkeyStr.slice(-4)}</span>
                    <span>{account.mint.toBase58().substring(0, 4)}...{account.mint.toBase58().slice(-4)}</span>
                    <span>{account.tokenBalance}</span>
                    <span style={{color: account.isCleanable ? 'var(--neon-green)' : 'gray'}}>
                        {account.isCleanable ? account.rentExemptSOL : '0.000000'}
                    </span>
                    
                    {/* TEK İŞLEM BUTONU */}
                    <span className="action-button-cell">
                        <button
                            className={`single-action-button ${actionType.toLowerCase()}`}
                            onClick={(e) => {
                                e.stopPropagation(); 
                                handleSingleAction(account); 
                            }}
                            disabled={isLoading}
                        >
                            {actionType}
                        </button>
                    </span>
                </div>
            );
        });
    }, [displayAccounts, selectedAccounts, isLoading, handleSingleAction]); 

    // Toplam geri alınacak SOL miktarını hesaplama (Arayüzde gösteriliyor)
    const totalReclaimableSOL = useMemo(() => {
        return tokenAccounts.reduce((sum, account) => {
            const pubkeyStr = account.tokenAccountPubkey.toBase58();
            if (account.isCleanable && selectedAccounts.includes(pubkeyStr)) {
                return sum + parseFloat(account.rentExemptSOL);
            }
            return sum;
        }, 0).toFixed(6);
    }, [tokenAccounts, selectedAccounts]);


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
                             {/* Toplam Geri Alınacak SOL Özeti (Sadece CLEANUP sekmesi için gösterilebilir) */}
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
                                    <span>İşlem Yap (0.1 SOL)</span>
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
                
                {/* Ana İşlem Butonu kaldırıldı */}
            </nav>

            {/* 3. İÇERİK BÖLÜMÜ */}
            <main className="content-area">
                {renderContent()}
            </main>
        </div>
    );
}

export default ReclaimBurnSection;