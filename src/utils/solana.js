import { Connection, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { 
    TOKEN_PROGRAM_ID, 
    // İsim çakışmasını önlemek için 'createBurnInstruction' fonksiyonuna takma isim (alias) veriyoruz.
    createCloseAccountInstruction,
    createBurnInstruction as splCreateBurnInstruction, // BURADA DEĞİŞİKLİK YAPILDI!
    getAssociatedTokenAddressSync,
} from '@solana/spl-token';

/**
 * Mevcut cüzdana ait tüm Token Hesaplarını (Associated Token Accounts - ATA) ve içeriklerini çeker.
 * * @param {Connection} connection - Solana bağlantı nesnesi (RPC).
 * @param {PublicKey} walletAddress - Kullanıcının Public Key'i.
 * @returns {Promise<Array<Object>>} - İşlenmiş Token Hesaplarının listesi.
 */
export async function fetchUserTokenAccounts(connection, walletAddress) {
    if (!walletAddress) return [];

    console.log("Kullanıcının token hesapları çekiliyor...");

    try {
        // Cüzdan adresine ait tüm token hesaplarını bulma
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            walletAddress,
            { programId: TOKEN_PROGRAM_ID }
        );

        // Hesapları işleme ve sadece önemli verileri alma
        const processedAccounts = tokenAccounts.value
            .map(accountInfo => {
                const { data, pubkey } = accountInfo;
                
                // Parselenmiş veriyi kontrol et
                const parsedInfo = data.parsed?.info;
                if (!parsedInfo) {
                    return null; // Parselenemeyen hesapları atla
                }

                // Hesabın kira (rent) muafiyeti için ayrılmış SOL miktarını çekme
                // Bu miktar, hesap kapatıldığında geri alınacak SOL'dur.
                const rentExemptBalance = accountInfo.account.lamports / LAMPORTS_PER_SOL;
                
                // Token bakiyesi
                const tokenBalance = parsedInfo.tokenAmount.uiAmount;
                const tokenDecimals = parsedInfo.tokenAmount.decimals;
                const tokenAmountRaw = parsedInfo.tokenAmount.amount; // Ham bakiye (decimals hesaba katılmadan)

                // Hesapta token bakiyesi yoksa (tokenBalance === 0) ve Rent muafiyetine sahipse
                // bu hesap temizlenebilir demektir (Reclaim).
                const isCleanable = tokenBalance === 0 && rentExemptBalance > 0;

                // NFT kontrolü: Bakiye 1 ve decimal 0 olmalı
                const isNFT = tokenBalance === 1 && tokenDecimals === 0;

                return {
                    tokenAccountPubkey: pubkey, 
                    mint: new PublicKey(parsedInfo.mint), 
                    tokenBalance: tokenBalance,
                    tokenAmountRaw: tokenAmountRaw, // Yakma işlemi için bu gereklidir
                    tokenDecimals: tokenDecimals,
                    rentExemptSOL: rentExemptBalance.toFixed(6), 
                    isCleanable: isCleanable,
                    isNFT: isNFT,
                };
            })
            .filter(account => account !== null) 
            // Sadece temizlenebilir olanları veya pozitif bakiyeli olanları göster
            .filter(account => account.isCleanable || account.tokenBalance > 0); 

        console.log(`Toplam ${processedAccounts.length} token hesabı bulundu.`);
        return processedAccounts;

    } catch (error) {
        console.error("Token hesaplarını çekerken hata oluştu:", error);
        return [];
    }
}


/**
 * SPL Token Hesabını kapatma talimatını oluşturur (Rent SOL geri alma - Reclaim).
 * Sadece token bakiyesi sıfır olan hesaplar için kullanılmalıdır.
 * @param {PublicKey} tokenAccount - Kapatılacak Token Hesabının Public Key'i.
 * @param {PublicKey} walletAddress - SOL'un geri gönderileceği alıcı (cüzdan sahibi).
 * @returns {TransactionInstruction} - CloseAccount talimatı.
 */
export function createReclaimInstruction(tokenAccount, walletAddress) {
    return createCloseAccountInstruction(
        tokenAccount,       // Token hesabı
        walletAddress,      // SOL'un geri gönderileceği alıcı
        walletAddress,      // Hesabı kapatma yetkisi olan cüzdan
        [],                 // İmza verenler (yalnızca tek imza)
        TOKEN_PROGRAM_ID
    );
}

/**
 * SPL Token Yakma talimatını oluşturur (Burn).
 * Özellikle NFT'ler (bakiye 1) veya küçük bakiyeli tokenlar için kullanılır.
 * @param {PublicKey} tokenAccount - Yakılacak tokenların bulunduğu hesabın Public Key'i.
 * @param {PublicKey} mint - Tokenın Mint adresi.
 * @param {PublicKey} walletAddress - Yakma yetkisi olan cüzdan (cüzdan sahibi).
 * @param {number} amountRaw - Yakılacak token miktarı (decimal'siz ham miktar).
 * @returns {TransactionInstruction} - Burn talimatı.
 */
export function createBurnInstruction(tokenAccount, mint, walletAddress, amountRaw) {
    // Kendi export fonksiyonumuzun içinde, import ettiğimiz TAKMA İSİMLİ fonksiyonu çağırıyoruz.
    return splCreateBurnInstruction( // BURADA DEĞİŞİKLİK YAPILDI!
        tokenAccount,       // Token hesabı
        mint,               // Token Mint adresi
        walletAddress,      // Yetkili (Owner)
        amountRaw,          // Yakılacak ham miktar (biz burada tüm bakiyeyi yakacağız)
        [],                 // İmza verenler
        TOKEN_PROGRAM_ID
    );
}