import React, { useMemo } from 'react';
// Yeni oluşturduğumuz ana iskeleti import ediyoruz
import MainLayout from './MainLayout'; 

// Cüzdan adaptörlerinden gerekli paketleri import edin
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Kullanmak istediğiniz cüzdanları buraya ekleyin (Phantom, Solflare, vs.)
import { 
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    // Diğer popüler cüzdanları buraya ekleyebilirsiniz
} from '@solana/wallet-adapter-wallets';


// Cüzdan UI'ı için CSS import'u (Bu, cüzdan butonunun stilini sağlar)
import '@solana/wallet-adapter-react-ui/styles.css'; 


function App() {
    // Solana ağını seçin: Ana ağ (Mainnet)
    const network = WalletAdapterNetwork.Mainnet; 

    // Solana RPC (Node) adresi
    // Hızlı ve güvenilir bir public RPC kullanıyoruz
    const endpoint = useMemo(() => 'https://api.mainnet-beta.solana.com', [network]); 

    // Uygulamada desteklemek istediğiniz cüzdanlar
    const wallets = useMemo(
        () => [
            // Cüzdanları başlatıyoruz
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
        ],
        [network]
    );

    // Bütün uygulamayı Cüzdan Sağlayıcıları ile sarmalıyoruz
    return (
        <ConnectionProvider endpoint={endpoint}>
            {/* autoConnect: Daha önce bağlanan cüzdanı otomatik bağlamaya çalışır */}
            <WalletProvider wallets={wallets} autoConnect>
                {/* WalletModalProvider: "Select Wallet" butonuna tıklanınca açılan pencereyi sağlar */}
                <WalletModalProvider>
                    {/* Artık MainLayout, cüzdan verilerine erişebilir */}
                    <div className="App">
                        <MainLayout />
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;