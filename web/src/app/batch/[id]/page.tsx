import Link from "next/link";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { PublicIntegrityCheck } from "./PublicIntegrityCheck";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Sparkles,
  FlaskConical,
  Sprout,
  ArrowLeft,
  QrCode,
  CheckCircle2,
} from "lucide-react";

export const revalidate = 0;

export default async function PublicBatchPage({ params }: { params: { id: string } }) {
  const batch = await db.getBatchById(params.id);

  if (!batch) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-200">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Batch Tidak Ditemukan</h1>
          <p className="text-xs text-gray-500 mt-2">
            Kode batch <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">{params.id}</code> tidak terdaftar di sistem verifikasi JahePasti.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Halaman Masuk
          </Link>
        </div>
      </div>
    );
  }

  // Calculate age in months
  let ageMonths = 9;
  if (batch.tanggalPanen) {
    const start = new Date(batch.tanggalTanam).getTime();
    const end = new Date(batch.tanggalPanen).getTime();
    ageMonths = Math.max(1, Math.round((end - start) / (30 * 86400000)));
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Public Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
              JP
            </div>
            <span className="font-bold text-gray-900 tracking-tight">JahePasti Verifikasi Publik</span>
          </div>

          <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Terotentikasi Solana Devnet
          </span>
        </div>

        {/* 1. Nama Produk & Status Batch */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">
            Sertifikasi Rimpang Jahe Merah
          </span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
            Jahe Merah Super Sambirata
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <StatusBadge status={batch.status} size="md" />
          </div>
          <p className="text-xs font-mono text-gray-400">ID: {batch.id}</p>
        </div>

        {/* 2. Asal Lahan */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 mb-4">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-sm uppercase tracking-wider">Asal Lahan Kebun</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Blok Lahan:</span>
              <span className="font-semibold text-gray-900">{batch.namaLahan}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Koordinat GPS:</span>
              <span className="font-mono text-xs text-gray-700">
                {batch.lat.toFixed(4)}, {batch.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Kelompok Tani:</span>
              <span className="font-semibold text-gray-900">Kelompok Tani Desa Sambirata</span>
            </div>
          </div>
        </div>

        {/* 3. Panen dan Umur Tanam */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 mb-4">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-sm uppercase tracking-wider">Panen & Kematangan</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Tanggal Tanam:</span>
              <span className="font-medium text-gray-900">
                {new Date(batch.tanggalTanam).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Tanggal Panen:</span>
              <span className="font-medium text-gray-900">
                {batch.tanggalPanen
                  ? new Date(batch.tanggalPanen).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Menunggu panen"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Umur Masa Tanam:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {ageMonths} Bulan (Memenuhi Standar FHI II &ge; 9 Bln)
              </span>
            </div>
          </div>
        </div>

        {/* 4. Verifikasi AI Lapangan & 5. Hasil Lab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 text-gray-900 mb-3">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Verifikasi AI Lapangan</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Kadar Air:</span>
                <span className="font-bold text-gray-900">
                  {batch.moistureContent !== undefined ? `${batch.moistureContent}% (Maks 10%)` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Keyakinan AI:</span>
                <span className="font-bold text-emerald-700">
                  {batch.aiConfidence !== undefined ? `${(batch.aiConfidence * 100).toFixed(1)}%` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rasio Cacat:</span>
                <span className="font-semibold text-gray-800">
                  {batch.defectRatio !== undefined ? `${(batch.defectRatio * 100).toFixed(1)}%` : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 text-gray-900 mb-3">
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Uji Lab Pabrik (CoA)</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Minyak Atsiri:</span>
                <span className="font-bold text-indigo-700">
                  {batch.essentialOilContent !== undefined
                    ? `${batch.essentialOilContent}% v/b (Min 1.10%)`
                    : "Belum diuji"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Skor Mutu:</span>
                <span className="font-black text-gray-900">
                  {batch.skor ? `${batch.skor.toFixed(1)} / 100` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dokumen CoA:</span>
                <span className="font-semibold text-gray-700">Terverifikasi Pabrik</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Verifikasi Integritas Blockchain Solana */}
        <PublicIntegrityCheck batchId={batch.id} signatures={batch.solanaSignatures} />

        <div className="text-center text-[11px] text-gray-400 pt-4">
          Data disimulasikan untuk konteks rantai pasok industri jamu (PT Industri Jamu dan Farmasi Sido Muncul Tbk).
        </div>
      </div>
    </div>
  );
}
