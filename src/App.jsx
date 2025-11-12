// Gerekli kütüphaneleri buraya import edin.
// Eğer App.jsx'te başka import'lar varsa (örneğin useState, useEffect, logos) onları en üste ekleyin.
// Örneğin: import './index.css' veya import './style.css';
import './style.css'; // Eğer sizin projenizde CSS dosyası style.css ise.

function App() {
  // Cüzdan bağlantısı gibi state ve fonksiyonlar buraya gelir.
  // Örneğin: const [isConnected, setIsConnected] = useState(false);
  // Şu an sadece görsel yapıyı verdiğim için bu kısmı boş bıraktım.
    
  return (
    // HTML'deki <body> yerine <div className="app-container"> kullanıyoruz.
    <div className="app-container"> 
        <header className="header">
            <div className="logo">
                {/* LOGO İSMİNİZ BURAYA GELİR */}
                <h1>WINURSOL</h1>
            </div>
            {/* Bu buton, cüzdan bağlantı mantığınızı tetiklemelidir */}
            <button className="btn btn-connect">Cüzdan Bağla</button>
        </header>

        <main className="container">
            <section className="incinerator-box">
                <h2 className="title">NFT ve Token Yakma Aracı</h2>
                <p className="description">İstenmeyen NFT'lerinizi veya token'larınızı yakmak ve ilişkili kiralama ücretini (rent) geri almak için cüzdanınızı bağlayın.</p>

                <div className="connection-status">
                    <p>Devam etmek için cüzdanınızı bağlayın.</p>
                    {/* Bu buton da cüzdan bağlantı mantığınızı tetiklemelidir */}
                    <button className="btn btn-primary btn-large">
                        Cüzdanı Bağla
                    </button>
                    <div className="options">
                        <button className="btn btn-secondary">Lite Görünüm</button>
                        <button className="btn btn-secondary">Pro Görünüm</button>
                    </div>
                </div>

                <p className="mobile-notice">Mobil cihazda mısınız? Lütfen cüzdanınızın web tarayıcısını kullanarak bu siteye gidin.</p>

            </section>
            
            <section className="disclaimer">
                <h3>Uyarı</h3>
                <p>Bu araç, token'larınızın geri döndürülemez şekilde yakılmasını kolaylaştırmak için kullanılır. Bu siteyi kullanarak, bunu tamamen **kendi riskiniz altında** yapmaktasınız. WINURSOL Platformu, kullanım sonucu yakılan token'lardan sorumlu değildir. Platformu kullanarak, tüm yakma işlemlerinin **tüm sorumluluğunu açıkça kabul etmiş** olursunuz.</p>
            </section>
        </main>
    </div>
  );
}

export default App;