import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface AiPredictionResponse {
  label: "healthy" | "unhealthy";
  confidence: number;
  defectRatio: number;
  isFlaggedForReview: boolean;
  modelVersion: string;
  notes: string;
}

/**
 * AI CV Placeholder Service Endpoint
 * Designed as a drop-in adapter. Later this can be connected directly to:
 * `const response = await fetch("http://localhost:8000/ai/predict", { method: "POST", body: formData })`
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { simulateDefect, imageName } = body;

    // Simulation logic based on test flags
    let label: "healthy" | "unhealthy" = "healthy";
    let confidence = 0.945; // 94.5% default healthy
    let defectRatio = 0.018; // 1.8% default healthy defect ratio
    let isFlaggedForReview = false;

    if (simulateDefect || (imageName && imageName.toLowerCase().includes("defect"))) {
      label = "unhealthy";
      confidence = 0.842; // Low confidence < 90% triggers UnderReview
      defectRatio = 0.045; // 4.5% defect ratio > 3% triggers UnderReview
      isFlaggedForReview = true;
    } else if (imageName && imageName.toLowerCase().includes("blur")) {
      confidence = 0.785;
      isFlaggedForReview = true;
    }

    const result: AiPredictionResponse = {
      label,
      confidence,
      defectRatio,
      isFlaggedForReview,
      modelVersion: "placeholder-cv-v0.1 (Pluggable for MobileNet/Custom CNN FastAPI)",
      notes: isFlaggedForReview
        ? "Keyakinan AI di bawah ambang batas 90% atau rasio cacat tinggi. Direkomendasikan untuk tinjauan manual (UnderReview)."
        : "Rimpang terdeteksi sehat dan segar. Rasio cacat dalam batas toleransi.",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Predict Placeholder Error:", error);
    return NextResponse.json({ error: "Gagal memproses inferensi gambar AI." }, { status: 500 });
  }
}
