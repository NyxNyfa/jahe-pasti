import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sha256Hex } from "@/lib/crypto";
import { notarizeBatchToSolana } from "@/lib/solana";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }
    if (user.role !== "FARMER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya akun Petani yang dapat mencatat panen." }, { status: 403 });
    }

    const { id } = params;
    const batch = await db.getBatchById(id);
    if (!batch) {
      return NextResponse.json({ error: "Batch tidak ditemukan." }, { status: 404 });
    }
    if (batch.status !== "Registered") {
      return NextResponse.json(
        { error: `Status batch saat ini adalah '${batch.status}'. Panen hanya dapat dicatat jika berstatus 'Registered'.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { tanggalPanen, beratKg, photoString } = body;

    if (!tanggalPanen || !beratKg) {
      return NextResponse.json({ error: "Tanggal panen dan berat (kg) wajib diisi." }, { status: 400 });
    }

    // Compute photo hash
    const rawPhoto = photoString || `rhizome_bundle_photos_${id}_${Date.now()}`;
    const photosHash = sha256Hex(rawPhoto);

    // Notarize to Solana Devnet
    const solanaResult = await notarizeBatchToSolana(id, "HARVEST", photosHash, {
      beratKg: Number(beratKg),
      tanggalPanen,
      recordedBy: user.nama,
    });

    const updated = await db.updateBatch(id, {
      tanggalPanen: new Date(tanggalPanen).toISOString(),
      beratKg: Number(beratKg),
      photosHash,
      status: "Harvested",
      solanaSignatures: [
        ...batch.solanaSignatures,
        {
          action: "HARVEST",
          signature: solanaResult.signature,
          solscanUrl: solanaResult.solscanUrl,
          timestamp: new Date().toISOString(),
          hash: photosHash,
        },
      ],
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (error: any) {
    console.error("POST /api/batches/[id]/harvest Error:", error);
    return NextResponse.json({ error: error.message || "Gagal mencatat panen." }, { status: 500 });
  }
}
