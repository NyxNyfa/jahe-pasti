"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BatchItem } from "@/lib/db";
import { UserSession } from "@/lib/auth";
import {
  Sprout,
  Building2,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  XCircle,
  FileText,
  Camera,
  Layers,
} from "lucide-react";

interface BatchActionFormsProps {
  batch: BatchItem;
  currentUser: UserSession;
}

export const BatchActionForms: React.FC<BatchActionFormsProps> = ({ batch, currentUser }) => {
  const router = useRouter();

  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Harvest state
  const [tanggalPanen, setTanggalPanen] = useState(new Date().toISOString().slice(0, 10));
  const [beratKg, setBeratKg] = useState(480);
  const [photoName, setPhotoName] = useState("rimpang_segar_jahe_merah_sambirata_01.jpg");

  // Inspection state
  const [moistureContent, setMoistureContent] = useState(8.5);
  const [aiConfidence, setAiConfidence] = useState(0.94);
  const [defectRatio, setDefectRatio] = useState(0.015);
  const [simulateDefect, setSimulateDefect] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiRunning, setAiRunning] = useState(false);

  // Lab state
  const [essentialOilContent, setEssentialOilContent] = useState(1.22);
  const [coaFileName, setCoaFileName] = useState("CoA_Laboratorium_Sidomuncul_Batch_001.pdf");

  // Reject state
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Connected Phantom Wallet Address
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.solana?.isPhantom) {
      if (window.solana.isConnected && window.solana.publicKey) {
        setPhantomAddress(window.solana.publicKey.toString());
      }
      window.solana.on("connect", (pubkey: any) => {
        setPhantomAddress(pubkey.toString());
      });
      window.solana.on("disconnect", () => {
        setPhantomAddress(null);
      });
    }
  }, []);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/batches/${batch.id}/harvest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggalPanen,
          beratKg,
          photoString: `photo_${photoName}_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencatat panen.");

      setSuccessMsg("Hasil panen dan hash foto berhasil dicatat ke Solana Devnet!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiSimulation = async () => {
    setAiRunning(true);
    try {
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulateDefect,
          imageName: simulateDefect ? "ginger_defect_sample.jpg" : photoName,
        }),
      });
      const data = await res.json();
      setAiResult(data);
      setAiConfidence(data.confidence);
      setDefectRatio(data.defectRatio);
    } catch (err) {
      console.error(err);
    } finally {
      setAiRunning(false);
    }
  };

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/batches/${batch.id}/inspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moistureContent,
          aiConfidence,
          defectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan inspeksi koperasi.");

      setSuccessMsg("Inspeksi lapangan & hasil analisis AI berhasil dicatat ke Solana Devnet!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/batches/${batch.id}/lab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essentialOilContent,
          coaString: `coa_${coaFileName}_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan hasil lab.");

      setSuccessMsg("Hasil CoA laboratorium berhasil dicatat dan diverifikasi di Solana Devnet!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/batches/${batch.id}/approve`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memberikan tanda tangan persetujuan.");

      setSuccessMsg(data.message || "Tanda tangan digital berhasil dicatat ke Solana Devnet!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/batches/${batch.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menolak batch.");

      setShowRejectModal(false);
      setSuccessMsg("Batch telah ditandai ditolak di Solana Devnet.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. Action Forms according to Role & Status */}
      {/* ------------------------------------------------------------- */}

      {/* Petani Action: Record Harvest */}
      {(currentUser.role === "FARMER" || currentUser.role === "ADMIN") && batch.status === "Registered" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 text-emerald-800 mb-5">
            <Sprout className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="font-bold text-base text-gray-900">Aksi Petani: Pencatatan Panen & Foto Rimpang</h3>
              <p className="text-xs text-gray-500">
                Masukkan tanggal panen, timbangan berat, dan unggah foto rimpang untuk dihitung hash SHA-256-nya.
              </p>
            </div>
          </div>

          <form onSubmit={handleHarvest} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Tanggal Panen
                </label>
                <input
                  type="date"
                  required
                  value={tanggalPanen}
                  onChange={(e) => setTanggalPanen(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Berat Panen (Kilogram)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={beratKg}
                  onChange={(e) => setBeratKg(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Foto Rimpang Jahe (Simulasi Unggah & SHA-256)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={photoName}
                  onChange={(e) => setPhotoName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono text-xs"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Pilih Foto
                </button>
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Hash SHA-256 foto akan dicatat permanen ke memo transaksi Solana Devnet.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Menotarisasi ke Solana..." : "Simpan Data Panen ke Blockchain"}
            </button>
          </form>
        </div>
      )}

      {/* Koperasi Action: Field Inspection & AI Analysis */}
      {(currentUser.role === "COOPERATIVE" || currentUser.role === "ADMIN") &&
        (batch.status === "Harvested" || batch.status === "UnderReview") && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5 text-amber-800">
                <Building2 className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    Aksi Koperasi: Sortasi Fisik & Deteksi AI
                  </h3>
                  <p className="text-xs text-gray-500">
                    Ukur kadar air (maks 10%) dan jalankan deteksi cacat rimpang berbasis AI.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Simulation Box */}
            <div className="mb-6 p-4 rounded-xl border border-orange-200 bg-orange-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  Inferensi AI Model CV Placeholder
                </span>

                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateDefect}
                    onChange={(e) => setSimulateDefect(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Simulasikan Rimpang Cacat / Low Conf (&lt;90%)</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-gray-600">
                  {aiResult ? (
                    <div>
                      <p className="font-semibold text-gray-900">
                        Hasil: Label <code className="bg-white px-1.5 py-0.5 rounded border">{aiResult.label}</code> |
                        Keyakinan: {(aiResult.confidence * 100).toFixed(1)}% | Cacat: {(aiResult.defectRatio * 100).toFixed(1)}%
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{aiResult.notes}</p>
                    </div>
                  ) : (
                    <span>Klik tombol di kanan untuk menjalankan inferensi foto panen jahe.</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRunAiSimulation}
                  disabled={aiRunning}
                  className="px-3.5 py-2 text-xs font-semibold text-orange-700 bg-white hover:bg-orange-100/80 border border-orange-300 rounded-lg shadow-sm shrink-0 transition-colors"
                >
                  {aiRunning ? "Menganalisis..." : "Jalankan Deteksi AI"}
                </button>
              </div>
            </div>

            <form onSubmit={handleInspect} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Kadar Air (% - Maks 10.0%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={moistureContent}
                    onChange={(e) => setMoistureContent(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Susut pengeringan FHI II</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Keyakinan AI (Desimal 0 - 1)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={aiConfidence}
                    onChange={(e) => setAiConfidence(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">&lt; 0.90 memicu UnderReview</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Rasio Cacat (Maks 0.03 / 3%)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={defectRatio}
                    onChange={(e) => setDefectRatio(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">&gt; 0.03 memicu UnderReview</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {loading ? "Menyimpan ke Solana..." : "Simpan Hasil Sortasi Lapangan"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
                >
                  Tolak Batch
                </button>
              </div>
            </form>
          </div>
        )}

      {/* QC Pabrik Action: Lab Testing & CoA */}
      {(currentUser.role === "QC" || currentUser.role === "ADMIN") &&
        (batch.status === "FieldVerified" || batch.status === "UnderReview") && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 text-indigo-800 mb-5">
              <FlaskConical className="w-6 h-6 text-indigo-600" />
              <div>
                <h3 className="font-bold text-base text-gray-900">Aksi QC Pabrik: Verifikasi Laboratorium & CoA</h3>
                <p className="text-xs text-gray-500">
                  Uji kadar minyak atsiri (min 1.10% v/b) dan unggah sertifikat CoA resmi dari pabrik jamu.
                </p>
              </div>
            </div>

            <form onSubmit={handleLab} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Kadar Minyak Atsiri (% v/b - Min 1.10%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={essentialOilContent}
                    onChange={(e) => setEssentialOilContent(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Standar acuan FHI II</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Dokumen CoA Laboratorium (PDF)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={coaFileName}
                      onChange={(e) => setCoaFileName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono text-xs"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1.5 shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Pilih PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {loading ? "Menotarisasi ke Solana..." : "Simpan & Loloskan Uji Lab CoA"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
                >
                  Tolak Batch
                </button>
              </div>
            </form>
          </div>
        )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Multi-Signature 2-of-3 Consensus Card */}
      {/* ------------------------------------------------------------- */}
      {(batch.status === "LabApproved" || batch.status === "Accepted") && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
            <div className="flex items-center gap-2.5 text-gray-900">
              <ShieldCheck className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="font-bold text-base">Konsensus Persetujuan Multi-Pihak (2-dari-3)</h3>
                <p className="text-xs text-gray-500">
                  Syarat Acceptance: Tanda tangan QC pabrik (Wajib) + salah satu dari Petani atau Koperasi.
                </p>
              </div>
            </div>

            {batch.status === "Accepted" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Resmi Accepted On-Chain
              </span>
            )}
          </div>

          {/* Signers Status Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
              className={`p-4 rounded-xl border ${
                batch.approvedByQc ? "bg-emerald-50/60 border-emerald-300" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                  QC Pabrik Jamu
                </span>
                <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  Wajib
                </span>
              </div>
              <div className="text-sm font-semibold mt-2">
                {batch.approvedByQc ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Sudah Ditandatangani
                  </span>
                ) : (
                  <span className="text-gray-400">Belum Ditandatangani</span>
                )}
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                batch.approvedByFarmer ? "bg-emerald-50/60 border-emerald-300" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  Petani Asal Lahan
                </span>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  Opsi Konsensus
                </span>
              </div>
              <div className="text-sm font-semibold mt-2">
                {batch.approvedByFarmer ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Sudah Ditandatangani
                  </span>
                ) : (
                  <span className="text-gray-400">Belum Ditandatangani</span>
                )}
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                batch.approvedByCoop ? "bg-emerald-50/60 border-emerald-300" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Verifikator Koperasi
                </span>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  Opsi Konsensus
                </span>
              </div>
              <div className="text-sm font-semibold mt-2">
                {batch.approvedByCoop ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Sudah Ditandatangani
                  </span>
                ) : (
                  <span className="text-gray-400">Belum Ditandatangani</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button for Current Role */}
          {batch.status !== "Accepted" && (
            <div className="pt-2">
              {phantomAddress && (
                <div className="mb-3 p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Phantom Terhubung: <code className="font-mono font-bold">{phantomAddress.slice(0, 6)}...{phantomAddress.slice(-6)}</code>
                  </span>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Devnet Active
                  </span>
                </div>
              )}

              {currentUser.role === "QC" && !batch.approvedByQc && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading
                    ? "Menotarisasi ke Solana..."
                    : phantomAddress
                    ? "Tandatangani sebagai QC via Phantom (Wajib)"
                    : "Tandatangani Batch sebagai QC Pabrik (Wajib)"}
                </button>
              )}

              {currentUser.role === "FARMER" && !batch.approvedByFarmer && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading
                    ? "Menotarisasi ke Solana..."
                    : phantomAddress
                    ? "Tandatangani sebagai Petani via Phantom"
                    : "Tandatangani Batch sebagai Petani"}
                </button>
              )}

              {currentUser.role === "COOPERATIVE" && !batch.approvedByCoop && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading
                    ? "Menotarisasi ke Solana..."
                    : phantomAddress
                    ? "Tandatangani sebagai Koperasi via Phantom"
                    : "Tandatangani Batch sebagai Koperasi"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. Solana Devnet Audit Trail Box */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-gray-900">Solana Devnet Audit Trail</h3>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-mono font-medium">
            Cluster: Devnet
          </span>
        </div>

        {batch.solanaSignatures.length === 0 ? (
          <p className="text-xs text-gray-500">Belum ada transaksi Solana yang tercatat untuk batch ini.</p>
        ) : (
          <div className="space-y-3">
            {batch.solanaSignatures.map((sig, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-gray-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      {sig.action}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(sig.timestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5 break-all">
                    Hash: {sig.hash}
                  </div>
                </div>

                <a
                  href={sig.solscanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs shrink-0 transition-colors"
                >
                  <span>{sig.signature.slice(0, 12)}...</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h4 className="text-base font-bold text-gray-900 mb-2">Konfirmasi Penolakan Batch</h4>
            <p className="text-xs text-gray-500 mb-4">
              Masukkan alasan resmi penolakan. Catatan alasan ini akan di-hash dan disimpan permanen di Solana Devnet.
            </p>

            <form onSubmit={handleReject}>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Kadar minyak atsiri di bawah batas standar FHI II (hanya 0.95%)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                >
                  {loading ? "Menolak..." : "Tolak Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
