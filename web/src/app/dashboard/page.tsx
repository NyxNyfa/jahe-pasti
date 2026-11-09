import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db, BatchItem } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import {
  PlusCircle,
  QrCode,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const batches = await db.getBatches();

  // Metrics summary
  const total = batches.length;
  const accepted = batches.filter((b) => b.status === "Accepted").length;
  const underReview = batches.filter((b) => b.status === "UnderReview").length;
  const pendingCoop = batches.filter((b) => b.status === "Harvested").length;
  const pendingQc = batches.filter((b) => b.status === "FieldVerified").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentUser={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Greeting & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dasbor Rantai Pasok JahePasti</h1>
            <p className="text-sm text-gray-600 mt-1">
              Selamat bertugas, <span className="font-semibold text-gray-800">{user.nama}</span>. Peran aktif:{" "}
              <span className="font-semibold text-orange-700">{user.role}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(user.role === "FARMER" || user.role === "ADMIN") && (
              <Link
                href="/dashboard/register"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Daftarkan Batch Baru
              </Link>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Batch</span>
              <Layers className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{total}</div>
            <div className="text-xs text-gray-400 mt-1">Tercatat di Solana Devnet</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Lolos 2-of-3</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">{accepted}</div>
            <div className="text-xs text-emerald-600/80 mt-1">Siap Produksi Jamu</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between text-purple-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Under Review</span>
              <ShieldAlert className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-purple-700">{underReview}</div>
            <div className="text-xs text-purple-600/80 mt-1">Keyakinan AI &lt; 90%</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Antrean Verifikasi</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-700">
              {user.role === "COOPERATIVE" ? pendingCoop : pendingQc}
            </div>
            <div className="text-xs text-amber-600/80 mt-1">
              {user.role === "COOPERATIVE" ? "Butuh Inspeksi Sortasi" : "Butuh Uji Lab QC"}
            </div>
          </div>
        </div>

        {/* Batch List Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Daftar Batch Rimpang Jahe Merah</h2>
              <p className="text-xs text-gray-500">
                Pilih batch untuk melihat garis waktu, verifikasi integritas, atau menjalankan aksi peran Anda.
              </p>
            </div>
          </div>

          {batches.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              Belum ada batch yang terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">ID Batch</th>
                    <th className="py-3.5 px-4">Lahan & Lokasi</th>
                    <th className="py-3.5 px-4">Status & Alur</th>
                    <th className="py-3.5 px-4">Skor Mutu</th>
                    <th className="py-3.5 px-4">Solana Devnet</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batches.map((batch: BatchItem) => {
                    const latestSig = batch.solanaSignatures[batch.solanaSignatures.length - 1];
                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <Link
                            href={`/dashboard/batch/${batch.id}`}
                            className="font-bold text-orange-700 hover:text-orange-800 flex items-center gap-1.5"
                          >
                            {batch.id}
                          </Link>
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            Petani: {batch.farmerName}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900 block">{batch.namaLahan}</span>
                          <span className="text-xs text-gray-500 block">
                            GPS: {batch.lat.toFixed(4)}, {batch.lng.toFixed(4)}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <StatusBadge status={batch.status} size="sm" />
                          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <span>Tanda Tangan:</span>
                            <span className={batch.approvedByQc ? "text-emerald-600 font-bold" : "text-gray-400"}>
                              QC{batch.approvedByQc ? "✓" : "-"}
                            </span>
                            •
                            <span className={batch.approvedByFarmer ? "text-emerald-600 font-bold" : "text-gray-400"}>
                              Petani{batch.approvedByFarmer ? "✓" : "-"}
                            </span>
                            •
                            <span className={batch.approvedByCoop ? "text-emerald-600 font-bold" : "text-gray-400"}>
                              Koperasi{batch.approvedByCoop ? "✓" : "-"}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {batch.skor ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {batch.skor.toFixed(1)} / 100
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Belum diuji</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {latestSig ? (
                            <a
                              href={latestSig.solscanUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-mono"
                              title={latestSig.signature}
                            >
                              <span>{latestSig.signature.slice(0, 8)}...</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/batch/${batch.id}`}
                              target="_blank"
                              title="Buka Halaman Publik (QR Konsumen)"
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <QrCode className="w-4 h-4" />
                            </Link>

                            <Link
                              href={`/dashboard/batch/${batch.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
                            >
                              <span>Detail & Aksi</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
