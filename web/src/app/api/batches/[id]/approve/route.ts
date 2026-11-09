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

    const { id } = params;
    const batch = await db.getBatchById(id);
    if (!batch) {
      return NextResponse.json({ error: "Batch tidak ditemukan." }, { status: 404 });
    }
    if (batch.status !== "LabApproved" && batch.status !== "Accepted") {
      return NextResponse.json(
        { error: `Batch berstatus '${batch.status}'. Tanda tangan hanya dapat diberikan jika berstatus 'LabApproved'.` },
        { status: 400 }
      );
    }

    let approvedByFarmer = batch.approvedByFarmer;
    let approvedByCoop = batch.approvedByCoop;
    let approvedByQc = batch.approvedByQc;

    if (user.role === "FARMER") {
      if (approvedByFarmer) {
        return NextResponse.json({ error: "Akun Petani sudah menandatangani batch ini." }, { status: 400 });
      }
      approvedByFarmer = true;
    } else if (user.role === "COOPERATIVE") {
      if (approvedByCoop) {
        return NextResponse.json({ error: "Akun Koperasi sudah menandatangani batch ini." }, { status: 400 });
      }
      approvedByCoop = true;
    } else if (user.role === "QC") {
      if (approvedByQc) {
        return NextResponse.json({ error: "Akun QC sudah menandatangani batch ini." }, { status: 400 });
      }
      approvedByQc = true;
    } else {
      return NextResponse.json({ error: "Peran Anda tidak memiliki hak tanda tangan verifikasi batch." }, { status: 403 });
    }

    // Check 2-of-3 condition: QC is MANDATORY + at least one of Farmer or Cooperative
    let newStatus: BatchStatus = batch.status;
    let isNowAccepted = false;
    if (approvedByQc && (approvedByFarmer || approvedByCoop)) {
      newStatus = "Accepted";
      isNowAccepted = true;
    }

    const approvalHash = sha256Hex(
      JSON.stringify({
        batchId: id,
        signer: user.nama,
        role: user.role,
        approvedByFarmer,
        approvedByCoop,
        approvedByQc,
        newStatus,
      })
    );

    const actionName = isNowAccepted ? "2OF3_ACCEPTANCE" : `APPROVE_${user.role}`;
    const solanaResult = await notarizeBatchToSolana(id, actionName, approvalHash, {
      signer: user.nama,
      role: user.role,
      status: newStatus,
    });

    const updated = await db.updateBatch(id, {
      approvedByFarmer,
      approvedByCoop,
      approvedByQc,
      status: newStatus,
      solanaSignatures: [
        ...batch.solanaSignatures,
        {
          action: actionName,
          signature: solanaResult.signature,
          solscanUrl: solanaResult.solscanUrl,
          timestamp: new Date().toISOString(),
          hash: approvalHash,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      batch: updated,
      isNowAccepted,
      message: isNowAccepted
        ? "Konsensus 2-dari-3 tercapai! Batch resmi berstatus Accepted di blockchain."
        : `Tanda tangan peran ${user.role} berhasil dicatat. Menunggu pemenuhan konsensus 2-dari-3.`,
    });
  } catch (error: any) {
    console.error("POST /api/batches/[id]/approve Error:", error);
    return NextResponse.json({ error: error.message || "Gagal mencatat tanda tangan persetujuan." }, { status: 500 });
  }
}
