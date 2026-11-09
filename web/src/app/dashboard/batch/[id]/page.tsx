import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { BatchActionForms } from "./BatchActionForms";
import {
  ArrowLeft,
  QrCode,
  ExternalLink,
  MapPin,
  Calendar,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export const revalidate = 0;

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const batch = await db.getBatchById(params.id);
  if (!batch) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar currentUser={user} />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-gray-800">Batch Tidak Ditemukan</h2>
          <p className="text-sm text-gray-500 mt-2">
            Batch dengan ID <code className="bg-gray-100 px-2 py-0.5 rounded">{params.id}</code> tidak terdaftar di sistem.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dasbor
          </Link>
        </main>
      </div>
    );
  }

  // Calculate cultivation age if harvested
  let ageMonths: number | null = null;
  if (batch.tanggalPanen) {
    const start = new Date(batch.tanggalTanam).getTime();
    const end = new Date(batch.tanggalPanen).getTime();
    ageMonths = Math.max(0, Math.round((end - start) / (30 * 86400000)));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentUser={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dasbor
          </Link>

          <Link
            href={`/batch/${batch.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            Buka Halaman Publik (QR Konsumen)
          </Link>
        </div>

        {/* Batch Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{batch.id}</h1>
                <StatusBadge status={batch.status} size="md" />
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{batch.namaLahan}</span>
                <span>•</span>
                <span>GPS: {batch.lat.toFixed(4)}, {batch.lng.toFixed(4)}</span>
              </p>
            </div>

            {batch.skor && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                    Skor Agregat Mutu
                  </span>
                  <span className="text-xl font-black text-emerald-700">{batch.skor.toFixed(1)} / 100</span>
                </div>
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Tanggal Tanam
              </span>
              <span className="text-sm font-bold text-gray-800 mt-0.5 block">
                {new Date(batch.tanggalTanam).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Hasil Panen
              </span>
              <span className="text-sm font-bold text-gray-800 mt-0.5 block">
                {batch.beratKg ? `${batch.beratKg} kg (${ageMonths || 9} bln)` : "Belum dicatat"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Kadar Air (Maks 10%)
              </span>
              <span className="text-sm font-bold text-gray-800 mt-0.5 block">
                {batch.moistureContent !== undefined ? `${batch.moistureContent}%` : "Belum diuji"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Minyak Atsiri (Min 1.10%)
              </span>
              <span className="text-sm font-bold text-gray-800 mt-0.5 block">
                {batch.essentialOilContent !== undefined ? `${batch.essentialOilContent}% v/b` : "Belum diuji"}
              </span>
            </div>
          </div>
        </div>

        {/* Client Interactive Action Workflow */}
        <BatchActionForms batch={batch} currentUser={user} />
      </main>
    </div>
  );
}
