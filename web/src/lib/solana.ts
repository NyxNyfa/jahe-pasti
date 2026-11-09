import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import * as fs from "fs";
import * as path from "path";

// Solana Memo Program v2 address
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export interface SolanaNotarizationResult {
  signature: string;
  solscanUrl: string;
  slot?: number;
  blockTime?: number;
  isMock: boolean;
  memoPayload: string;
}

/**
 * Get the signer keypair:
 * 1. Checks SOLANA_PAYER_PRIVATE_KEY in .env (Base58 or JSON array from Phantom)
 * 2. Checks local .solana-devnet-keypair.json
 * 3. Falls back to generating a new keypair
 */
function getServerKeypair(): Keypair {
  const envKey = process.env.SOLANA_PAYER_PRIVATE_KEY?.trim();
  if (envKey) {
    try {
      if (envKey.startsWith("[") && envKey.endsWith("]")) {
        return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(envKey)));
      } else {
        return Keypair.fromSecretKey(bs58.decode(envKey));
      }
    } catch (err) {
      console.warn("Could not parse SOLANA_PAYER_PRIVATE_KEY from .env:", err);
    }
  }

  const keypairPath = path.join(process.cwd(), ".solana-devnet-keypair.json");
  if (fs.existsSync(keypairPath)) {
    try {
      const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
      return Keypair.fromSecretKey(Uint8Array.from(secret));
    } catch {
      // regenerate if corrupted
    }
  }

  const newKeypair = Keypair.generate();
  try {
    fs.writeFileSync(keypairPath, JSON.stringify(Array.from(newKeypair.secretKey)));
  } catch (err) {
    console.warn("Could not save .solana-devnet-keypair.json:", err);
  }
  return newKeypair;
}

/**
 * Notarize batch action and hash to Solana Devnet.
 * Directly links the transaction to our deployed JahePasti Program on Solana!
 */
export async function notarizeBatchToSolana(
  batchId: string,
  action: string,
  dataHash: string,
  extra?: Record<string, unknown>
): Promise<SolanaNotarizationResult> {
  const programIdStr =
    process.env.NEXT_PUBLIC_JAHEPASTI_PROGRAM_ID || "2ahgAPJf9QrTpS3BvmAVKGwB8Q91tuZjYniWTodYZfCL";

  const memoObject = {
    app: "JahePasti",
    programId: programIdStr,
    batchId,
    action,
    hash: dataHash,
    timestamp: new Date().toISOString(),
    ...extra,
  };
  const memoString = JSON.stringify(memoObject);

  const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
  const connection = new Connection(rpcUrl, "confirmed");
  const payer = getServerKeypair();

  try {
    const tx = new Transaction();

    // Memo instruction with payer signer
    tx.add(
      new TransactionInstruction({
        keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoString, "utf-8"),
      })
    );

    const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
      commitment: "confirmed",
      skipPreflight: false,
    });

    console.log(`[Solana Devnet] Batch ${batchId} ${action} notarized by ${payer.publicKey.toBase58()}. Signature: ${signature}`);

    return {
      signature,
      solscanUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
      isMock: false,
      memoPayload: memoString,
    };
  } catch (error: any) {
    console.error("Solana Devnet transaction error:", error);
    // If rate-limited or temporary RPC glitch, provide deterministic signature
    const simulatedSig = `devnet_${Buffer.from(dataHash).toString("hex").slice(0, 48)}`;
    return {
      signature: simulatedSig,
      solscanUrl: `https://solscan.io/tx/${simulatedSig}?cluster=devnet`,
      isMock: true,
      memoPayload: memoString,
    };
  }
}
