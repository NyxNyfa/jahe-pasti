import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json({ error: "Parameter batchId diperlukan." }, { status: 400 });
    }

    const batch = await db.getBatchById(batchId);
    if (!batch) {
      return NextResponse.json({ error: "Batch tidak ditemukan." }, { status: 404 });
    }

    // Verify hash integrity against recorded Solana signatures
    const checks = [
      {
        field: "Data Asal Lahan (GPS & Petani)",
        hash: batch.landDataHash,
        isRecordedOnChain: batch.solanaSignatures.some((sig) => sig.hash === batch.landDataHash),
      },
      {
        field: "Foto Rimpang Panen",
        hash: batch.photosHash || null,
        isRecordedOnChain: Boolean(
          batch.photosHash && batch.solanaSignatures.some((sig) => sig.hash === batch.photosHash)
        ),
      },
      {
        field: "Sertifikat Analisis Lab (CoA)",
        hash: batch.coaHash || null,
        isRecordedOnChain: Boolean(
          batch.coaHash && batch.solanaSignatures.some((sig) => sig.hash === batch.coaHash)
        ),
      },
    ];

    const allCheckedRecorded = checks
      .filter((c) => c.hash !== null)
      .every((c) => c.isRecordedOnChain);

    return NextResponse.json({
      batchId,
      status: batch.status,
      integrityVerified: allCheckedRecorded && batch.solanaSignatures.length > 0,
      checks,
      solanaSignaturesCount: batch.solanaSignatures.length,
      latestSignature: batch.solanaSignatures[batch.solanaSignatures.length - 1] || null,
    });
  } catch (error) {
    console.error("GET /api/solana/verify Error:", error);
    return NextResponse.json({ error: "Gagal memverifikasi integritas on-chain." }, { status: 500 });
  }
}
