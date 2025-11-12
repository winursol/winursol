import { Connection, PublicKey } from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
    AccountLayout,
    TOKEN_PROGRAM_ID,
    createCloseAccountInstruction,
    createBurnInstruction as splCreateBurnInstruction // İsim çakışmasını önlemek için
} from '@solana/spl-token';
import BN from 'bn.js'; 

/**
 * Kullanıcının token hesaplarını ve bakiyelerini çeker.
 * @param {Connection} connection - Solana RPC bağlantısı
 * @param {PublicKey} walletAddress - Kullanıcının cüzdan adresi
 * @returns {Promise<Array<Object>>} Token hesaplarının listesi
 */
export async function fetchUserTokenAccounts(connection, walletAddress) {
    if (!walletAddress) return [];
    
    // Yükleniyor durumunu daha iyi yönetmek için token hesaplarını çekiyoruz
    const tokenAccounts = await connection.getTokenAccountsByOwner(
        walletAddress,
        { programId: TOKEN_PROGRAM_ID }
    );

    const accountsData = [];

    for (const { pubkey, account } of tokenAccounts.value) {
        try {
            const accountInfo = AccountLayout.decode(account.data);
            const mint = new PublicKey(accountInfo.mint);
            const tokenAmountRaw = new BN(accountInfo.amount, 16);
            
            // Mint ondalık (decimals) bilgisini çekme
            let decimals = 0;
            const mintInfo = await connection.getParsedAccountInfo(mint);
            if (mintInfo.value && mintInfo.value.data && mintInfo.value.data.parsed) {
                decimals = mintInfo.value.data.parsed.info.decimals || 0;
            }

            // Token bakiyesini insan tarafından okunabilir formata dönüştürme
            const tokenBalance = decimals > 0 
                ? tokenAmountRaw.toNumber() / Math.pow(10, decimals) 
                : tokenAmountRaw.toString(); 

            // Kilitli SOL miktarını hesaplama (rent-exempt)
            const rentExempt = await connection.getMinimumBalanceForRentExemption(account.data.length);
            const rentExemptSOL = (rentExempt / 10**9).toFixed(6);

            // Hesap temizlenebilir mi? (Sadece bakiyesi 0 olan ve SPL programının altındaki hesaplar)
            const isCleanable = tokenAmountRaw.isZero() && account.owner.equals(TOKEN_PROGRAM_ID);
            
            // Basit NFT kontrolü (Bakiye 1 ve Decimals 0 ise genellikle NFT'dir)
            const isNFT = tokenAmountRaw.eq(new BN(1)) && decimals === 0;

            accountsData.push({
                tokenAccountPubkey: pubkey,
                mint: mint,
                tokenAmountRaw: tokenAmountRaw, 
                tokenBalance: parseFloat(tokenBalance), // Sayı olarak sakla
                rentExemptSOL: rentExemptSOL,
                isCleanable: isCleanable,
                isNFT: isNFT,
                decimals: decimals,
            });
        } catch (e) {
            console.error(`Hesap verisi işlenirken hata: ${pubkey.toBase58()}`, e);
            // Hatalı hesabı atla ve devam et
        }
    }

    return accountsData;
}

/**
 * Token hesabını kapatma (Reclaim) talimatını oluşturur.
 */
export function createReclaimInstruction(tokenAccount, walletAddress) {
    return createCloseAccountInstruction(
        tokenAccount, 
        walletAddress, 
        walletAddress, 
        []
    );
}

/**
 * Token yakma (Burn) talimatını oluşturur.
 */
export function createBurnInstruction(tokenAccount, mint, walletAddress, amountRaw) {
    return splCreateBurnInstruction(
        tokenAccount, 
        mint,         
        walletAddress, 
        amountRaw,    
        [],           
        TOKEN_PROGRAM_ID 
    );
}