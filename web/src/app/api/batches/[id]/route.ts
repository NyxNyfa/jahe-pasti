import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const batch = await db.getBatchById(id);
    if (!batch) {
      return NextResponse.json({ error: `Batch dengan ID ${id} tidak ditemukan.` }, { status: 404 });
    }
    return NextResponse.json(batch);
  } catch (error) {
    console.error("GET /api/batches/[id] Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data batch." }, { status: 500 });
  }
}
