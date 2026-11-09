import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, BatchStatus } from "@/lib/db";
import { sha256Hex } from "@/lib/crypto";
import { notarizeBatchToSolana } from "@/lib/solana";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }
    if (user.role !== "COOPERATIVE" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Hanya petugas verifikator Koperasi yang dapat melakukan inspeksi lapangan." },
        { status: 403 }
      );
    }

    const { id } = params;
    const batch = await db.getBatchById(id);
    if (!batch) {
      return NextResponse.json({ error: "Batch tidak ditemukan." }, { status: 404 });
    }
    if (batch.status !== "Harvested" && batch.status !== "UnderReview") {
      return NextResponse.json(
        { error: `Batch berstatus '${batch.status}'. Inspeksi hanya untuk batch 'Harvested' atau 'UnderReview'.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { moistureContent, aiConfidence, defectRatio } = body;

    const moisture = Number(moistureContent);
    const confidence = Number(aiConfidence);
    const defect = Number(defectRatio);

    if (isNaN(moisture) || isNaN(confidence) || isNaN(defect)) {
      return NextResponse.json({ error: "Kadar air, keyakinan AI, dan rasio cacat harus berupa angka valid." }, { status: 400 });
    }

    // FHI II standard check: moisture content must not exceed 10.0%
    if (moisture > 10.0) {
      return NextResponse.json(
        { error: `Kadar air (${moisture}%) melebihi batas standar maksimal FHI II (10.0%). Batch tidak dapat diloloskan.` },
        { status: 400 }
      );
    }

    // Ethical AI routing rule: confidence < 90% or defect > 3% routes to UnderReview
    let newStatus: BatchStatus = "FieldVerified";
    if (confidence < 0.90 || defect > 0.03) {
      newStatus = "UnderReview";
    }

    const inspectHash = sha256Hex(
      JSON.stringify({
        batchId: id,
        moisture,
        confidence,
        defect,
        status: newStatus,
        inspector: user.nama,
      })
    );

    const solanaResult = await notarizeBatchToSolana(id, "FIELD_INSPECT", inspectHash, {
      moisture,
      confidence,
      defect,
      status: newStatus,
      inspector: user.nama,
    });

    const updated = await db.updateBatch(id, {
      moistureContent: moisture,
      aiConfidence: confidence,
      defectRatio: defect,
      status: newStatus,
      solanaSignatures: [
        ...batch.solanaSignatures,
        {
          action: "FIELD_INSPECT",
          signature: solanaResult.signature,
          solscanUrl: solanaResult.solscanUrl,
          timestamp: new Date().toISOString(),
          hash: inspectHash,
        },
      ],
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (error: any) {
    console.error("POST /api/batches/[id]/inspect Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan inspeksi koperasi." }, { status: 500 });
  }
}
