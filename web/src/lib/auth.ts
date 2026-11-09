import { cookies } from "next/headers";

export type Role = "FARMER" | "COOPERATIVE" | "QC" | "ADMIN";

export interface UserSession {
  id: string;
  nama: string;
  email: string;
  role: Role;
  walletAddress?: string;
}

export const DEMO_USERS: Record<string, { user: UserSession; passwordHash: string }> = {
  "petani@sambirata.id": {
    user: {
      id: "usr-farmer-01",
      nama: "Pak Sutrisno (Ketua Kelompok Tani Sambirata)",
      email: "petani@sambirata.id",
      role: "FARMER",
      walletAddress: "8xM2...FarmerSambirata",
    },
    passwordHash: "petani123",
  },
  "koperasi@sambirata.id": {
    user: {
      id: "usr-coop-01",
      nama: "Budi Santoso (Petugas Sortasi Koperasi)",
      email: "koperasi@sambirata.id",
      role: "COOPERATIVE",
      walletAddress: "4kR9...KoperasiSambirata",
    },
    passwordHash: "koperasi123",
  },
  "qc@sidomuncul.co.id": {
    user: {
      id: "usr-qc-01",
      nama: "Dr. Rina Wulandari (Petugas QC Pabrik Jamu)",
      email: "qc@sidomuncul.co.id",
      role: "QC",
      walletAddress: "9pL3...QcSidoMuncul",
    },
    passwordHash: "qc123",
  },
  "admin@jahepasti.id": {
    user: {
      id: "usr-admin-01",
      nama: "Admin Pengembang JahePasti",
      email: "admin@jahepasti.id",
      role: "ADMIN",
      walletAddress: "7tN1...AdminJahePasti",
    },
    passwordHash: "admin123",
  },
};

const SESSION_COOKIE_NAME = "jahepasti_session";

/**
 * Serialize user session object into a base64 cookie value.
 */
export function serializeSession(user: UserSession): string {
  const json = JSON.stringify(user);
  return Buffer.from(json, "utf-8").toString("base64");
}

/**
 * Deserialize base64 cookie into a UserSession object.
 */
export function deserializeSession(cookieValue: string): UserSession | null {
  try {
    const json = Buffer.from(cookieValue, "base64").toString("utf-8");
    return JSON.parse(json) as UserSession;
  } catch {
    return null;
  }
}

/**
 * Retrieve current user from Next.js server cookie store.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }
  return deserializeSession(sessionCookie.value);
}

export { SESSION_COOKIE_NAME };
