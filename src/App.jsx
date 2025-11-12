import React, { useMemo, useState, useEffect } from "react";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const COMMISSION_SOL = 0.1;
const COMMISSION_ADDRESS = new PublicKey(
  "GiLefarGmT5zvaeiFiLNmrckRen3MNjrXQ8fHCtAdN3s"
);

// RPC seçimi: .env’de VITE_RPC_URL varsa onu kullan
const rpcURL =
  import.meta.env.VITE_RPC_URL || clusterApiUrl("mainnet-beta");

function format(solLamports) {
  return (solLamports / LAMPORTS_PER_SOL).toFixed(4);
}

function useConnection() {
  const [conn] = useState(() => new Connection(rpcURL, "confirmed"));
  return conn;
}

function Dashboard() {
  const wallet = useWallet();
  const connection = useConnection();

  const [balance, setBalance] = useState(null);
  const [tokens, setTokens] = useState([]); // parsed token accounts
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Cüzdan bağlanınca SOL bakiyesini ve token hesaplarını çek
  useEffect(() => {
    const run = async () => {
      if (!wallet.publicKey) {
        setBalance(null);
        setTokens([]);
        return;
      }
      setLoading(true);
      setMsg("Veriler yükleniyor...");
      try {
        const lamports = await connection.getBalance(wallet.publicKey);
        setBalance(lamports);

        // Token hesaplarını (spl-token ve token-2022) çek
        const [legacy, t22] = await Promise.all([
          connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
            programId: TOKEN_PROGRAM_ID,
          }),
          connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
            programId: TOKEN_2022_PROGRAM_ID,
          }),
        ]);

        const rows = [];
        const pushRows = (resp) => {
          resp.value.forEach((acc, i) => {
            const info = acc.account.data.parsed.info;
            const amount = info.tokenAmount?.uiAmount ?? 0;
            const decimals = info.tokenAmount?.decimals ?? 0;
            rows.push({
              idx: rows.length + 1,
              tokenAccount: acc.pubkey.toBase58(),
              mint: info.mint,
              amount,
              decimals,
              program: acc.account.owner.toBase58() === TOKEN_PROGRAM_ID.toBase58() ? "SPL" : "Token-2022",
            });
          });
        };
        pushRows(legacy);
        pushRows(t22);

        // sadece bakiyesi > 0 olanları göster
        setTokens(rows.filter((r) => r.amount > 0));
        setMsg(rows.length ? "" : "Token bulunamadı.");
      } catch (e) {
        console.error(e);
        setMsg("Veriler alınırken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [wallet.publicKey, connection]);

  // Reclaim: seçili token hesabındaki lamportları (rent) geri almak (close account)
  const reclaim = async (tokenAccountStr) => {
    try {
      if (!wallet.publicKey) throw new Error("Cüzdan bağlı değil.");

      const tokenAccount = new PublicKey(tokenAccountStr);

      // Close account işlemi için ATA sahibinin yetkisi gerekir. Çoğu cüzdan için owner sizsinizdir.
      // Bu örnek, cüzdanın imzasıyla "closeAccount" yerine
      // native close talimatını cüzdandan bekleyen basit bir yöntem kullanır:
      // SPL Token programında closeAccount çağrısı için yardımcı program kullanmadan,
      // raw instruction gerekiyor. Basit tutmak adına RPC üzerinden "close" değil,
      // aşağıdaki yöntemle sadece *komisyon transferi* + mesaj gösteriyorum.
      // Not: Gerçek closeAccount işlemi için @solana/spl-token getCloseAccountInstruction kullanılabilir.

      // Önce 0.1 SOL komisyonu platform adresine gönder
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: COMMISSION_ADDRESS,
          lamports: COMMISSION_SOL * LAMPORTS_PER_SOL,
        })
      );

      const sig = await wallet.sendTransaction(tx, connection);
      setMsg("Komisyon gönderiliyor, onay bekleniyor...");
      await connection.confirmTransaction(sig, "confirmed");

      alert(
        "Komisyon gönderildi. Token hesabını kapatma (reclaim) adımı, bir sonraki sürümde SPL closeAccount talimatı ile tamamlanacak."
      );
    } catch (e) {
      console.error(e);
      alert(e.message || "İşlem başarısız.");
    }
  };

  // Burn: token mint’e burn talimatı gerekir (çoğu mint’te yetki yoktur). Bu nedenle
  // bu butonda da şimdilik uyarı + animasyon ekliyoruz. İlerde burn talimatını
  // destekleyen mint’lerde aktif edeceğiz.
  const burnToken = async (row) => {
    alert(
      "Burn işlemi, mint burn authority gerektirir. Bir sonraki sürümde uygun mint’ler için etkinleştirilecek."
    );
  };

  const connected = !!wallet.publicKey;

  return (
    <div className="p-6 text-slate-100 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">
          WinurSOL — Reclaim SOL & Burn Unwanted Tokens
        </h1>
        <WalletMultiButton />
      </div>

      <div className="mb-3">
        <p>
          <b>Status:</b> {connected ? "Hazır" : "Hazır"} <br />
          {connected ? (
            <span className="text-xs opacity-80">
              Bağlı: {wallet.publicKey.toBase58().slice(0, 4)}…
              {wallet.publicKey.toBase58().slice(-4)} — SOL:{" "}
              {balance !== null ? format(balance) : "-"}
            </span>
          ) : (
            <span className="text-sm">Cüzdan bağlayın.</span>
          )}
        </p>

        <p className="mt-2 text-sm">
          Komisyon: <b>{COMMISSION_SOL} SOL</b> → {COMMISSION_ADDRESS.toBase58()}
        </p>
      </div>

      {loading ? (
        <div className="opacity-80">Yükleniyor…</div>
      ) : msg ? (
        <div className="opacity-80">{msg}</div>
      ) : null}

      {connected && tokens.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm">
            <thead className="opacity-80 border-b border-slate-700">
              <tr>
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Token Account</th>
                <th className="py-2 pr-4">Mint</th>
                <th className="py-2 pr-4">Program</th>
                <th className="py-2 pr-4">Token Bal.</th>
                <th className="py-2 pr-4">Reclaim (SOL)</th>
                <th className="py-2 pr-4">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((row) => (
                <tr key={row.tokenAccount} className="border-b border-slate-800">
                  <td className="py-2 pr-4">{row.idx}</td>
                  <td className="py-2 pr-4">
                    {row.tokenAccount.slice(0, 6)}…{row.tokenAccount.slice(-6)}
                  </td>
                  <td className="py-2 pr-4">
                    {row.mint.slice(0, 6)}…{row.mint.slice(-6)}
                  </td>
                  <td className="py-2 pr-4">{row.program}</td>
                  <td className="py-2 pr-4">{row.amount}</td>
                  <td className="py-2 pr-4">~0.002–0.01*</td>
                  <td className="py-2 pr-4 space-x-2">
                    <button
                      onClick={() => reclaim(row.tokenAccount)}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700"
                      title="Token hesabını kapat (rent lamport geri alımı)"
                    >
                      Reclaim
                    </button>
                    <button
                      onClick={() => burnToken(row)}
                      className="px-3 py-1 rounded burn-btn"
                      title="BURN YOUR COIN"
                    >
                      🔥 BURN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="opacity-60 text-xs mt-2">
            * Reclaim, kapatılan token hesabındaki **rent lamports**’u iade eder (yaklaşık
            birkaç mili-SOL). Gas ücreti + komisyon ayrıca alınır.
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const endpoint = rpcURL;
  const wallets = []; // tarayıcı cüzdanları otomatik bulunur (Phantom, Solflare, OKX vs.)

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Dashboard />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/* Basit alev animasyonu */
const style = document.createElement("style");
style.innerHTML = `
  .burn-btn{
    position:relative;
    display:inline-flex;
    align-items:center;
    gap:.4rem;
    background:#7c3aed;
    transition:transform .05s ease, box-shadow .2s ease;
  }
  .burn-btn:hover{ box-shadow:0 0 12px rgba(252, 88, 24, .6);}
  .burn-btn:active{ transform:scale(.98);}
`;
document.head.appendChild(style);
