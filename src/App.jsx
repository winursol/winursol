import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './index.css';

export default function App() {
  return (
    <main className="winursol-page">
      {/* Üst başlık */}
      <header className="winursol-header">
        <h1 className="slug-title">
          <span className="slug-title-main">WinurSOL</span>
          <span className="slug-title-sub">— Reclaim SOL & Burn Unwanted Tokens</span>
        </h1>
      </header>

      {/* Hero: WON mührü + Connect */}
      <section className="hero">
        {/* WON mührü */}
        <div className="won-stamp" aria-hidden>
          <svg viewBox="0 0 800 260" className="won-svg">
            <defs>
              <linearGradient id="stampGrad" x1="0" x2="1">
                <stop offset="0" stopColor="#d31f2b" />
                <stop offset="1" stopColor="#ff2e3a" />
              </linearGradient>
            </defs>
            {/* Kırmızı çerçeve */}
            <rect
              x="10" y="10" width="780" height="240"
              fill="none"
              stroke="url(#stampGrad)"
              strokeWidth="28"
              rx="10" ry="10"
            />
            {/* İç kenar efekti */}
            <rect
              x="28" y="28" width="744" height="204"
              fill="none"
              stroke="#ff7981"
              strokeWidth="8"
              rx="6" ry="6"
              strokeDasharray="14 10"
            />
            {/* WON yazısı */}
            <text
              x="50%" y="58%"
              textAnchor="middle"
              className="won-text"
            >
              WON
            </text>
          </svg>
        </div>

        {/* Connect butonu (orta merkez) */}
        <div className="connect-wrap">
          <WalletMultiButton className="connect-btn" />
          <p className="status">Status: <strong>Hazır</strong></p>
          <p className="hint">Cüzdan bağlayın.</p>
        </div>
      </section>

      {/* İleride ek bölümler buraya gelebilir */}
    </main>
  );
}
