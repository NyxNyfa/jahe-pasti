"use client";

import React, { useState, useEffect } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Wallet, CheckCircle2, ChevronDown, ExternalLink, LogOut, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    solana?: any;
  }
}

export const WalletConnect: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchBalance = async (pubkeyString: string) => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const pubkey = new PublicKey(pubkeyString);
      const lamports = await connection.getBalance(pubkey);
      setBalance(lamports / 1e9); // convert to SOL
    } catch (err) {
      console.warn("Could not fetch Solana balance:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.solana?.isPhantom) {
      // Check if already connected eagerly
      if (window.solana.isConnected && window.solana.publicKey) {
        const addr = window.solana.publicKey.toString();
        setWalletAddress(addr);
        fetchBalance(addr);
      }

      window.solana.on("connect", (publicKey: any) => {
        const addr = publicKey.toString();
        setWalletAddress(addr);
        fetchBalance(addr);
      });

      window.solana.on("disconnect", () => {
        setWalletAddress(null);
        setBalance(null);
      });
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined") return;

    if (!window.solana || !window.solana.isPhantom) {
      alert(
        "Ekstensi Phantom Wallet tidak terdeteksi di browser Anda!\nSilakan pasang ekstensi Phantom dari https://phantom.app"
      );
      window.open("https://phantom.app", "_blank");
      return;
    }

    try {
      setConnecting(true);
      const resp = await window.solana.connect();
      const addr = resp.publicKey.toString();
      setWalletAddress(addr);
      await fetchBalance(addr);
    } catch (err: any) {
      console.error("User rejected wallet connection:", err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
      }
      setWalletAddress(null);
      setBalance(null);
      setShowDropdown(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (walletAddress) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all shadow-2xs"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-mono">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
          {balance !== null && (
            <span className="bg-purple-200/70 text-purple-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {balance.toFixed(2)} SOL
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-purple-700" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 text-xs">
            <div className="pb-2 border-b border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Solana Devnet Wallet</span>
              <span className="font-mono text-gray-900 font-semibold break-all block mt-0.5">{walletAddress}</span>
              <span className="text-emerald-600 font-bold block mt-1">
                Saldo: {balance !== null ? `${balance.toFixed(4)} SOL` : "Memuat..."}
              </span>
            </div>

            <div className="pt-2 space-y-1">
              <a
                href={`https://solscan.io/account/${walletAddress}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-indigo-600 font-medium"
              >
                <span>Lihat di Solscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => fetchBalance(walletAddress)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                <span>Refresh Saldo</span>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={disconnectWallet}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-red-50 text-red-600 font-medium"
              >
                <span>Putuskan Wallet</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={connectWallet}
      disabled={connecting}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all"
    >
      <Wallet className="w-3.5 h-3.5" />
      <span>{connecting ? "Menghubungkan..." : "Connect Phantom"}</span>
    </button>
  );
};
