import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
    Transaction, 
    SystemProgram, 
    PublicKey, 
    LAMPORTS_PER_SOL, 
} from '@solana/web3.js';
// Yardımcı fonksiyonları import ediyoruz (utils/solana.js dosyasından)
import { 
    fetchUserTokenAccounts, 
    createReclaimInstruction, 
    createBurnInstruction 
} from './utils/solana'; 


function ReclaimBurnSection() {
    // BURASI KRİTİK: Varsayılan olarak TOKENS sekmesi açılıyor
    const [activeTab, setActiveTab] = useState('TOKENS'); 
    const [isLoading, setIsLoading] = useState(false);
    const [tokenAccounts, setTokenAccounts] = useState([]);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const FEE_AMOUNT_SOL = 0.1;
    const FEE_RECIPIENT_ADDRESS = useMemo(() => new PublicKey('GiLefarGmT5zvaeiFiLNmrckRen3MNjrXQ8fHCtAdN3s'), []);
    const FEE_AMOUNT_LAMPORTS = FEE_AMOUNT_SOL * LAMPORTS_PER_SOL;

    const loadTokenAccounts = useCallback(async () => {
        if (!publicKey || !connection) return;
        
        setIsLoading(true);
        try {
            const accounts = await fetchUserTokenAccounts(connection, publicKey);
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

    const displayAccounts = useMemo(() => {
        return tokenAccounts.filter(acc => {
            if (activeTab === 'CLEANUP') {
                return acc.isCleanable; 
            }
            if (activeTab === 'NFTS') {
                return acc.isNFT && acc.tokenBalance > 0;
            }
            if (activeTab === 'TOKENS') {
                return !acc.isCleanable && !acc.isNFT && acc.tokenBalance > 0; 
            }
            return false;
        });
    }, [tokenAccounts, activeTab]);


    useEffect(() => {
        loadTokenAccounts();
        
        setSelectedAccounts([]);
        
        const intervalId = setInterval(loadTokenAccounts, 30000); 
        return () => clearInterval(intervalId); 

    }, [activeTab, loadTokenAccounts]);


    const toggleAccountSelection = (pubkey) => {
        setSelectedAccounts(prev => {
            const pubkeyStr = pubkey.toBase58();
            if (prev.includes(pubkeyStr)) {
                return prev.filter(p => p !== pubkeyStr);
            } else {
                return [...prev, pubkeyStr];
            }
        });
    };

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
                const instruction = createReclaimInstruction(
                    account.tokenAccountPubkey, 
                    publicKey 
                );
                transaction.add(instruction);

            } else if (account.tokenBalance > 0) {
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
                    <span className="selection-box">
                        <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleAccountSelection(account.tokenAccountPubkey)}
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </span>
                    
                    <span>{pubkeyStr.substring(0, 4)}...{pubkeyStr.slice(-4)}</span>
                    <span>{account.mint.toBase58().substring(0, 4)}...{account.mint.toBase58().slice(-4)}</span>
                    <span>{account.tokenBalance}</span>
                    <span style={{color: account.isCleanable ? 'var(--neon-green)' : 'gray'}}>
                        {account.isCleanable ? account.rentExemptSOL : '0.000000'}
                    </span>
                    
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

    const totalReclaimableSOL = useMemo(() => {
        return tokenAccounts.reduce((sum, account) => {
            const pubkeyStr = account.tokenAccountPubkey.toBase58();
            if (account.isCleanable && selectedAccounts.includes(pubkeyStr)) {
                return sum + parseFloat(account.rentExemptSOL);
            }
            return sum;
        }, 0).toFixed(6);
    }, [tokenAccounts, selectedAccounts]);


    const renderContent = () => {
        const addressBase58 = publicKey ? publicKey.toBase58() : '';
        
        return (
            <div className="content-card">
                 <div className="wallet-status-label wallet-address-info">
                    Status: <span className="status-ready">Hazır</span>
                    <br/>
                    Bağlı Cüzdan: <span className="address-hash">{addressBase58}</span>
                 </div>
                 
                 <div className="tab-content-display">
                    {isLoading && <p className="loading-message">Hesap verileri yükleniyor...</p>}
                    
                    {!isLoading && (
                        <div className="data-table-container">
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
            </nav>

            <main className="content-area">
                {renderContent()}
            </main>
        </div>
    );
}

export default ReclaimBurnSection;