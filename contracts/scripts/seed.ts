import { ethers, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== Seeding Demo Batches for JahePasti ===");

  const deployedPath = path.join(__dirname, "..", "deployed-address.json");
  const [admin, farmer, cooperative, qc] = await ethers.getSigners();

  const FARMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE"));
  const COOPERATIVE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COOPERATIVE_ROLE"));
  const QC_ROLE = ethers.keccak256(ethers.toUtf8Bytes("QC_ROLE"));

  let trackerAddress: string;

  if (fs.existsSync(deployedPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));
    const code = await ethers.provider.getCode(deploymentInfo.contractAddress);
    if (code !== "0x") {
      trackerAddress = deploymentInfo.contractAddress;
      console.log("Connected to existing deployed contract at:", trackerAddress);
    } else {
      console.log("Existing deployment address has no bytecode on this network instance.");
      console.log("Deploying fresh tracker contract for this session...");
      const JahePastiTrackerFactory = await ethers.getContractFactory("JahePastiTracker");
      const tracker = await JahePastiTrackerFactory.deploy(admin.address);
      await tracker.waitForDeployment();
      trackerAddress = await tracker.getAddress();

      await tracker.connect(admin).grantRole(FARMER_ROLE, farmer.address);
      await tracker.connect(admin).grantRole(COOPERATIVE_ROLE, cooperative.address);
      await tracker.connect(admin).grantRole(QC_ROLE, qc.address);
    }
  } else {
    console.log("No deployed-address.json found. Deploying fresh contract...");
    const JahePastiTrackerFactory = await ethers.getContractFactory("JahePastiTracker");
    const tracker = await JahePastiTrackerFactory.deploy(admin.address);
    await tracker.waitForDeployment();
    trackerAddress = await tracker.getAddress();

    await tracker.connect(admin).grantRole(FARMER_ROLE, farmer.address);
    await tracker.connect(admin).grantRole(COOPERATIVE_ROLE, cooperative.address);
    await tracker.connect(admin).grantRole(QC_ROLE, qc.address);
  }

  const tracker = await ethers.getContractAt("JahePastiTracker", trackerAddress);
  console.log("Using JahePastiTracker at:", trackerAddress);

  // -------------------------------------------------------------
  // Seed Batch 1: BATCH-SAMBIRATA-001 (Accepted via Happy Path)
  // -------------------------------------------------------------
  const batchId1 = "BATCH-SAMBIRATA-001";
  console.log(`\n--- Seeding ${batchId1} (Full Lifecycle -> Accepted) ---`);

  const landDataHash1 = ethers.keccak256(
    ethers.toUtf8Bytes("Lahan Kelompok Tani Sambirata Blok A | GPS: -7.3412, 109.1245 | Petani: Pak Sutrisno")
  );
  const photosHash1 = ethers.keccak256(
    ethers.toUtf8Bytes("sha256_rhizome_bundle_photos_batch_sambirata_001_5_images")
  );
  const coaHash1 = ethers.keccak256(
    ethers.toUtf8Bytes("sha256_laboratorium_analisis_sidomuncul_coa_2024_001.pdf")
  );

  const plantingDate1 = Math.floor(Date.now() / 1000) - 270 * 24 * 3600; // 9 months ago
  const harvestDate1 = Math.floor(Date.now() / 1000) - 5 * 24 * 3600;     // 5 days ago

  console.log(`[1/5] Registering batch ${batchId1}...`);
  let tx = await tracker.connect(farmer).registerBatch(batchId1, landDataHash1, plantingDate1);
  await tx.wait();

  console.log(`[2/5] Recording harvest (500 kg, 9 months)...`);
  tx = await tracker.connect(farmer).recordHarvest(batchId1, harvestDate1, 9, 500, photosHash1);
  await tx.wait();

  console.log(`[3/5] Submitting cooperative field inspection (Moisture: 8.60%, AI Conf: 95.00%, Defect: 1.50%)...`);
  tx = await tracker.connect(cooperative).submitFieldVerification(
    batchId1,
    9500, // 95% AI confidence
    150,  // 1.50% defect ratio
    860,  // 8.60% moisture
    88
  );
  await tx.wait();

  console.log(`[4/5] Submitting QC lab analysis (Essential Oil: 1.25%, Final Score: 86.50)...`);
  tx = await tracker.connect(qc).submitLab(
    batchId1,
    coaHash1,
    125,  // 1.25% v/b
    8650  // 86.50
  );
  await tx.wait();

  console.log(`[5/5] Executing 2-of-3 Multi-Signature (QC + Farmer)...`);
  tx = await tracker.connect(qc).approve(batchId1);
  await tx.wait();
  console.log("   -> QC signed.");

  tx = await tracker.connect(farmer).approve(batchId1);
  const receipt = await tx.wait();
  console.log("   -> Farmer signed. Transaction Hash:", receipt?.hash);

  const finalBatch1 = await tracker.getBatch(batchId1);
  const statusLabels = ["Registered", "Harvested", "FieldVerified", "UnderReview", "LabApproved", "Accepted", "Rejected"];
  console.log(`Batch 1 Final Status: ${statusLabels[Number(finalBatch1.status)]} (Code: ${finalBatch1.status})`);
  console.log(`Approval Count: ${finalBatch1.approvalCount} (QC: ${finalBatch1.approvedByQc}, Farmer: ${finalBatch1.approvedByFarmer})`);

  // -------------------------------------------------------------
  // Seed Batch 2: BATCH-SAMBIRATA-002 (UnderReview for Demo)
  // -------------------------------------------------------------
  const batchId2 = "BATCH-SAMBIRATA-002";
  console.log(`\n--- Seeding ${batchId2} (Low AI Confidence -> UnderReview) ---`);

  const landDataHash2 = ethers.keccak256(
    ethers.toUtf8Bytes("Lahan Kelompok Tani Sambirata Blok B | GPS: -7.3450, 109.1290 | Petani: Bu Maryam")
  );
  const photosHash2 = ethers.keccak256(
    ethers.toUtf8Bytes("sha256_rhizome_bundle_photos_batch_sambirata_002")
  );

  console.log(`[1/3] Registering batch ${batchId2}...`);
  tx = await tracker.connect(farmer).registerBatch(batchId2, landDataHash2, plantingDate1);
  await tx.wait();

  console.log(`[2/3] Recording harvest (320 kg)...`);
  tx = await tracker.connect(farmer).recordHarvest(batchId2, harvestDate1, 9, 320, photosHash2);
  await tx.wait();

  console.log(`[3/3] Submitting cooperative field inspection (AI Confidence 82.50% < 90%)...`);
  tx = await tracker.connect(cooperative).submitFieldVerification(
    batchId2,
    8250, // 82.50% AI confidence -> triggers UnderReview
    200,  // 2.00% defect ratio
    890,  // 8.90% moisture
    75
  );
  await tx.wait();

  const finalBatch2 = await tracker.getBatch(batchId2);
  console.log(`Batch 2 Final Status: ${statusLabels[Number(finalBatch2.status)]} (Code: ${finalBatch2.status})`);

  console.log("\n=== Demo Batches Successfully Seeded! ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
