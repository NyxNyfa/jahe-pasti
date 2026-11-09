import * as fs from "fs";
import * as path from "path";

export type BatchStatus =
  | "Registered"
  | "Harvested"
  | "FieldVerified"
  | "UnderReview"
  | "LabApproved"
  | "Accepted"
  | "Rejected";

export interface SolanaSignatureRecord {
  action: string;
  signature: string;
  solscanUrl: string;
  timestamp: string;
  hash: string;
}

export interface BatchItem {
  id: string;
  farmerId: string;
  farmerName: string;
  namaLahan: string;
  lat: number;
  lng: number;
  tanggalTanam: string;
  tanggalPanen?: string;
  beratKg?: number;
  status: BatchStatus;
  skor?: number;
  landDataHash: string;
  photosHash?: string;
  coaHash?: string;
  essentialOilContent?: number;
  moistureContent?: number;
  aiConfidence?: number;
  defectRatio?: number;
  approvedByFarmer: boolean;
  approvedByCoop: boolean;
  approvedByQc: boolean;
  solanaSignatures: SolanaSignatureRecord[];
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const SEED_BATCHES: BatchItem[] = [
  {
    id: "BATCH-SAMBIRATA-001",
    farmerId: "usr-farmer-01",
    farmerName: "Pak Sutrisno",
    namaLahan: "Blok A Lereng Gunung Slamet, Desa Sambirata",
    lat: -7.3412,
    lng: 109.1245,
    tanggalTanam: new Date(Date.now() - 270 * 86400000).toISOString(),
    tanggalPanen: new Date(Date.now() - 5 * 86400000).toISOString(),
    beratKg: 500,
    status: "Accepted",
    skor: 88.5,
    landDataHash: "0x4a7e93f8d1c0b2e5a6f4e8d2c1b9a7f3e5d8c2b1a9f7e5d3c1b8a6f4e2d0c8b6",
    photosHash: "0x8f2d5e1b4a7c0e9f3d6b2a8c5e1f4a7d0c3b6e9f2a5d8c1e4b7a0f3d6c9e2b5a",
    coaHash: "0x1c3e5a7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c",
    essentialOilContent: 1.25,
    moistureContent: 8.6,
    aiConfidence: 0.952,
    defectRatio: 0.015,
    approvedByFarmer: true,
    approvedByCoop: false,
    approvedByQc: true,
    solanaSignatures: [
      {
        action: "REGISTER",
        signature: "5Uf9Jz8...SolanaRegisterTx",
        solscanUrl: "https://solscan.io?cluster=devnet",
        timestamp: new Date(Date.now() - 270 * 86400000).toISOString(),
        hash: "0x4a7e93f8d1c0b2e5a6f4e8d2c1b9a7f3e5d8c2b1a9f7e5d3c1b8a6f4e2d0c8b6",
      },
      {
        action: "HARVEST",
        signature: "3Kp7Yv1...SolanaHarvestTx",
        solscanUrl: "https://solscan.io?cluster=devnet",
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        hash: "0x8f2d5e1b4a7c0e9f3d6b2a8c5e1f4a7d0c3b6e9f2a5d8c1e4b7a0f3d6c9e2b5a",
      },
      {
        action: "FIELD_INSPECT",
        signature: "7Nm4Px2...SolanaInspectTx",
        solscanUrl: "https://solscan.io?cluster=devnet",
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        hash: "0xFieldVerifiedInspectionHash860Moisture",
      },
      {
        action: "LAB_QC",
        signature: "9Rt2Qw5...SolanaLabQcTx",
        solscanUrl: "https://solscan.io?cluster=devnet",
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        hash: "0x1c3e5a7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c",
      },
      {
        action: "2OF3_ACCEPTANCE",
        signature: "2Vx8Lm9...SolanaAcceptedTx",
        solscanUrl: "https://solscan.io?cluster=devnet",
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        hash: "0xAcceptedConsensus2of3QCAndFarmer",
      },
    ],
    createdAt: new Date(Date.now() - 270 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "BATCH-SAMBIRATA-002",
    farmerId: "usr-farmer-01",
    farmerName: "Pak Sutrisno",
    namaLahan: "Blok B Sambirata Dataran Tinggi",
    lat: -7.345,
    lng: 109.129,
    tanggalTanam: new Date(Date.now() - 280 * 86400000).toISOString(),
    tanggalPanen: new Date(Date.now() - 2 * 86400000).toISOString(),
    beratKg: 350,
    status: "Harvested",
    landDataHash: "0x7b2a9e4d1f8c0b3e6a9f5e2d8c4b1a7f0e3d6c9b2a5f8e1d4c7b0a3f6e9d2c5b",
    photosHash: "0x3e6a9f2d5c8b1e4a7d0c3f6b9e2a5d8c1f4b7e0a3d6c9f2b5e8a1d4c7b0e3f6a",
    approvedByFarmer: false,
    approvedByCoop: false,
    approvedByQc: false,
    solanaSignatures: [],
    createdAt: new Date(Date.now() - 280 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function ensureStoreExists(): BatchItem[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(SEED_BATCHES, null, 2), "utf-8");
    return SEED_BATCHES;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw) as BatchItem[];
  } catch {
    fs.writeFileSync(STORE_PATH, JSON.stringify(SEED_BATCHES, null, 2), "utf-8");
    return SEED_BATCHES;
  }
}

function writeStore(batches: BatchItem[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(batches, null, 2), "utf-8");
}

export const db = {
  getBatches: async (): Promise<BatchItem[]> => {
    return ensureStoreExists();
  },

  getBatchById: async (id: string): Promise<BatchItem | null> => {
    const batches = ensureStoreExists();
    return batches.find((b) => b.id === id) || null;
  },

  createBatch: async (batch: BatchItem): Promise<BatchItem> => {
    const batches = ensureStoreExists();
    if (batches.some((b) => b.id === batch.id)) {
      throw new Error(`Batch ID ${batch.id} sudah ada.`);
    }
    batches.unshift(batch);
    writeStore(batches);
    return batch;
  },

  updateBatch: async (id: string, updates: Partial<BatchItem>): Promise<BatchItem> => {
    const batches = ensureStoreExists();
    const index = batches.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Batch ID ${id} tidak ditemukan.`);
    }
    const updated: BatchItem = {
      ...batches[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    batches[index] = updated;
    writeStore(batches);
    return updated;
  },
};
