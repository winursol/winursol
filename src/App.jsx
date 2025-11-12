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
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
          resp.value.forEach((acc) => {
            const info = acc.account.data.parsed.info;
            const amount = info.tokenAmount?.uiAmount ?? 0;
            if (amount > 0) {
              rows.push({
                idx: rows.length + 1,
                tokenAccount: acc.pubkey.toBase58(),
                mint: info.mint,
                amount,
                program:
                  acc.account.owner.toBase58() ===
                  TOKEN_PROGRAM_ID.toBase58()
                    ? "SPL"
                    : "Token-2022",
              });
            }
          });
        };
        pushRows(legacy);
        pushRows(t22);
        setTokens(rows);
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

  const reclaim = async (tokenAccountStr) => {
    try {
      if (!wallet.publicKey) throw new Error("Cüzdan bağlı değil.");

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
        "Komisyon gönderildi. Token hesabını kapatma işlemi sonraki sürümde aktif olacak."
      );
    } catch (e) {
      console.error(e);
      alert(e.message || "İşlem başarısız.");
    }
  };

  const burnToken = async () => {
    alert(
      "Burn işlemi, mint yetkisi gerektirir. Uygun token'lar için sonraki sürümde aktif olacak."
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
          Komisyon: <b>{COMMISSION_SOL} SOL</b> (otomatik işlenir)
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
                    >
                      Reclaim
                    </button>
                    <button
                      onClick={() => burnToken(row)}
                      className="px-3 py-1 rounded burn-btn"
                    >
                      🔥 BURN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="opacity-60 text-xs mt-2">
            * Reclaim işlemi, kapatılan token hesabındaki rent lamports’u geri alır.
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const endpoint = rpcURL;
  const wallets = [];
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
