"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sprout, MapPin, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export default function RegisterBatchPage() {
  const router = useRouter();

  const [namaLahan, setNamaLahan] = useState("Lahan Sambirata Blok C");
  const [lat, setLat] = useState(-7.3425);
  const [lng, setLng] = useState(109.126);
  const [tanggalTanam, setTanggalTanam] = useState(
    new Date(Date.now() - 270 * 86400000).toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaLahan,
          lat: Number(lat),
          lng: Number(lng),
          tanggalTanam,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftarkan batch.");
      }

      router.push(`/dashboard/batch/${data.batch.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setPresetSambirata = () => {
    setLat(-7.3412);
    setLng(109.1245);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dasbor
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="w-6 h-6" />
              <h1 className="text-xl font-bold">Pendaftaran Batch Jahe Merah Baru</h1>
            </div>
            <p className="text-xs text-orange-100">
              Mencatat data asal lahan dan tanggal tanam secara permanen dengan hash kriptografi ke Solana Devnet.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nama Lahan / Blok Kebun
              </label>
              <input
                type="text"
                required
                value={namaLahan}
                onChange={(e) => setNamaLahan(e.target.value)}
                placeholder="Contoh: Lahan Blok A Sambirata"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Nama lahan dan kelompok tani pengelola.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Koordinat GPS Lahan
                </label>
                <button
                  type="button"
                  onClick={setPresetSambirata}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  Gunakan Preset Sambirata (-7.3412, 109.1245)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    placeholder="Latitude"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Latitude</span>
                </div>
                <div>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    placeholder="Longitude"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Longitude</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Tanggal Mulai Tanam
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={tanggalTanam}
                  onChange={(e) => setTanggalTanam(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Standar FHI II merekomendasikan umur tanam minimal 9 bulan untuk kematangan rimpang optimal.
              </span>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading ? "Menotarisasi ke Solana..." : "Daftarkan Batch ke Blockchain"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
