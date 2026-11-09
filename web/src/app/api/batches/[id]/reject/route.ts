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
    if (user.role !== "COOPERATIVE" && user.role !== "QC" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Koperasi atau QC yang dapat menolak batch." }, { status: 403 });
    }

    const { id } = params;
    const batch = await db.getBatchById(id);
    if (!batch) {
      return NextResponse.json({ error: "Batch tidak ditemukan." }, { status: 404 });
    }
    if (batch.status === "Accepted" || batch.status === "Rejected") {
      return NextResponse.json({ error: `Batch sudah berstatus final '${batch.status}' dan tidak dapat diubah.` }, { status: 400 });
    }

    const body = await req.json();
    const { reason } = body;
    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "Alasan penolakan wajib diisi." }, { status: 400 });
    }

    const reasonHash = sha256Hex(reason);
    const solanaResult = await notarizeBatchToSolana(id, "REJECT", reasonHash, {
      rejector: user.nama,
      role: user.role,
      reason,
    });

    const updated = await db.updateBatch(id, {
      status: "Rejected",
      rejectReason: reason,
      solanaSignatures: [
        ...batch.solanaSignatures,
        {
          action: "REJECT",
          signature: solanaResult.signature,
          solscanUrl: solanaResult.solscanUrl,
          timestamp: new Date().toISOString(),
          hash: reasonHash,
        },
      ],
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (error: any) {
    console.error("POST /api/batches/[id]/reject Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menolak batch." }, { status: 500 });
  }
}
