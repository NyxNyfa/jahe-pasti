import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, BatchItem } from "@/lib/db";
import { generateLandDataHash } from "@/lib/crypto";
import { notarizeBatchToSolana } from "@/lib/solana";

export async function GET() {
  try {
    const batches = await db.getBatches();
    return NextResponse.json(batches);
  } catch (error) {
    console.error("GET /api/batches Error:", error);
    return NextResponse.json({ error: "Gagal mengambil daftar batch." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }
    if (user.role !== "FARMER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya akun Petani yang dapat mendaftarkan batch baru." }, { status: 403 });
    }

    const body = await req.json();
    const { namaLahan, lat, lng, tanggalTanam } = body;

    if (!namaLahan || lat === undefined || lng === undefined || !tanggalTanam) {
      return NextResponse.json(
        { error: "Nama lahan, koordinat GPS (lat, lng), dan tanggal tanam wajib diisi." },
        { status: 400 }
      );
    }

    // Generate unique batch ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "");
    const batchId = `BATCH-${datePrefix}-${randomSuffix}`;

    const landDataHash = generateLandDataHash(namaLahan, Number(lat), Number(lng), tanggalTanam);

    // Notarize registration to Solana Devnet
    const solanaResult = await notarizeBatchToSolana(batchId, "REGISTER", landDataHash, {
      namaLahan,
      farmer: user.nama,
    });

    const newBatch: BatchItem = {
      id: batchId,
      farmerId: user.id,
      farmerName: user.nama,
      namaLahan,
      lat: Number(lat),
      lng: Number(lng),
      tanggalTanam: new Date(tanggalTanam).toISOString(),
      status: "Registered",
      landDataHash,
      approvedByFarmer: false,
      approvedByCoop: false,
      approvedByQc: false,
      solanaSignatures: [
        {
          action: "REGISTER",
          signature: solanaResult.signature,
          solscanUrl: solanaResult.solscanUrl,
          timestamp: new Date().toISOString(),
          hash: landDataHash,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.createBatch(newBatch);
    return NextResponse.json({ success: true, batch: saved }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/batches Error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat batch baru." }, { status: 500 });
  }
}
