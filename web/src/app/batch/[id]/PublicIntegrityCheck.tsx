"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Layers } from "lucide-react";
import { SolanaSignatureRecord } from "@/lib/db";

interface PublicIntegrityCheckProps {
  batchId: string;
  signatures: SolanaSignatureRecord[];
}

export const PublicIntegrityCheck: React.FC<PublicIntegrityCheckProps> = ({ batchId, signatures }) => {
  const [checking, setChecking] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const runVerification = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/solana/verify?batchId=${batchId}`);
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-gray-900 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-sm uppercase tracking-wider">Verifikasi Blockchain Solana</h2>
        </div>
        <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
          Devnet Cluster
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Setiap rincian batch dijamin tidak dapat diubah secara sepihak (*immutable*) karena hash SHA-256 data telah tercatat permanen di jaringan blockchain Solana.
      </p>

      {/* Verification Action Button */}
      <button
        type="button"
        onClick={runVerification}
        disabled={checking}
        className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-colors mb-5"
      >
        <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
        {checking ? "Membandingkan Hash On-Chain..." : "Cek Integritas Data Blockchain"}
      </button>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border mb-5 ${
            verificationResult.integrityVerified
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2 mb-2 font-bold text-sm">
            {verificationResult.integrityVerified ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Integritas Terverifikasi 100% Cocok!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Peringatan: Ketidakcocokan Hash Terdeteksi!</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-3">
            {verificationResult.integrityVerified
              ? "Seluruh data asal lahan, panen, dan sertifikat mutu laboratorium terbukti identik dengan catatan permanen di blok Solana Devnet."
              : "Terdapat perbedaan antara data yang ditampilkan dengan rekaman on-chain."}
          </p>

          <div className="space-y-1.5 pt-2 border-t border-emerald-200/60">
            {verificationResult.checks.map((check: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span>{check.field}:</span>
                <span
                  className={`font-semibold ${
                    check.isRecordedOnChain ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {check.isRecordedOnChain ? "Valid On-Chain ✓" : "Belum Dicatat / Beda"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures List with Direct Solscan links */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
          Jejak Transaksi On-Chain
        </span>
        {signatures.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada transaksi on-chain.</p>
        ) : (
          signatures.map((sig, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border border-gray-100 bg-slate-50 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-gray-800">{sig.action}</span>
                <span className="text-[10px] text-gray-400 block font-mono">
                  {new Date(sig.timestamp).toLocaleDateString("id-ID")}
                </span>
              </div>

              <a
                href={sig.solscanUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 hover:text-indigo-800"
              >
                <span>{sig.signature.slice(0, 10)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
