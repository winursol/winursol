import { Connection, PublicKey } from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
    AccountLayout,
    TOKEN_PROGRAM_ID,
    createCloseAccountInstruction,
    createBurnInstruction as splCreateBurnInstruction // İsim çakışmasını önlemek için alias kullanıldı
} from '@solana/spl-token';
import BN from 'bn.js'; // BN.js kütüphanesi gereklidir, eğer kurulu değilse 'npm install bn.js' yapın

/**
 * Kullanıcının token hesaplarını ve bakiyelerini çeker.
 * @param {Connection} connection - Solana RPC bağlantısı
 * @param {PublicKey} walletAddress - Kullanıcının cüzdan adresi
 * @returns {Promise<Array<Object>>} Token hesaplarının listesi
 */
export async function fetchUserTokenAccounts(connection, walletAddress) {
    const tokenAccounts = await connection.getTokenAccountsByOwner(
        walletAddress,
        { programId: TOKEN_PROGRAM_ID }
    );

    const accountsData = [];

    for (const { pubkey, account } of tokenAccounts.value) {
        const accountInfo = AccountLayout.decode(account.data);
        const mint = new PublicKey(accountInfo.mint);
        const tokenAmountRaw = new BN(accountInfo.amount, 16);
        
        // Token'ın ondalık basamaklarını (decimals) almak için mint bilgisini çekmeye çalışırız.
        // Bu kısım, performans için optimize edilebilir (önbelleğe alma), ancak şimdilik temel mantık yeterlidir.
        let decimals = 0;
        try {
            const mintInfo = await connection.getParsedAccountInfo(mint);
            if (mintInfo.value && mintInfo.value.data && mintInfo.value.data.parsed) {
                decimals = mintInfo.value.data.parsed.info.decimals || 0;
            }
        } catch (e) {
            console.error(`Mint ${mint.toBase58()} için ondalık bilgi çekilemedi.`);
            // Hata durumunda 0 veya varsayılan değer kullanılır
        }

        // Token bakiyesini insan tarafından okunabilir formata dönüştürme
        const tokenBalance = decimals > 0 
            ? tokenAmountRaw.toNumber() / Math.pow(10, decimals) 
            : tokenAmountRaw.toString(); // Decimals 0 ise tamsayı olarak bırak

        // Kilitli SOL miktarını hesaplama (rent-exempt)
        const rentExempt = await connection.getMinimumBalanceForRentExemption(account.data.length);
        const rentExemptSOL = (rentExempt / 10**9).toFixed(6);

        // Hesap temizlenebilir mi? (Sadece bakiyesi 0 olan ve token programının altındaki hesaplar temizlenebilir)
        const isCleanable = tokenAmountRaw.isZero() && account.owner.equals(TOKEN_PROGRAM_ID);
        
        // Basit NFT kontrolü (Bakiye 1 ve Decimals 0 ise genellikle NFT'dir)
        const isNFT = tokenAmountRaw.eq(new BN(1)) && decimals === 0;

        // İsteğiniz: Bakiyesi 1 bile olsa listelenmesi kuralı zaten buradaki 'tokenBalance' değeri ile sağlanır.

        accountsData.push({
            tokenAccountPubkey: pubkey,
            mint: mint,
            tokenAmountRaw: tokenAmountRaw, // İşlem için ham miktar
            tokenBalance: tokenBalance, // Kullanıcıya gösterilecek miktar
            rentExemptSOL: rentExemptSOL,
            isCleanable: isCleanable,
            isNFT: isNFT,
            decimals: decimals,
        });
    }

    return accountsData;
}

/**
 * Token hesabını kapatma (Reclaim) talimatını oluşturur.
 */
export function createReclaimInstruction(tokenAccount, walletAddress) {
    return createCloseAccountInstruction(
        tokenAccount, // Kapatılacak hesap
        walletAddress, // SOL'ün geri gönderileceği adres
        walletAddress, // Yetkili
        []
    );
}

/**
 * Token yakma (Burn) talimatını oluşturur.
 */
export function createBurnInstruction(tokenAccount, mint, walletAddress, amountRaw) {
    // İSTEK: Tokenler bir cüzdana gitmiyor, imha ediliyor. Bu doğru Solana mantığıdır.
    return splCreateBurnInstruction(
        tokenAccount, // Yakılacak token hesabı
        mint,         // Token'ın Mint adresi
        walletAddress, // Yetkili (owner)
        amountRaw,    // Yakılacak miktar (BigInt/BN)
        [],           // Multi-signer (kullanmıyoruz)
        TOKEN_PROGRAM_ID 
    );
}