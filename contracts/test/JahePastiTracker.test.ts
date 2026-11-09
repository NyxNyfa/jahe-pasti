import { expect } from "chai";
import { ethers } from "hardhat";
import { JahePastiTracker } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("JahePastiTracker Smart Contract", function () {
  let tracker: JahePastiTracker;
  let admin: HardhatEthersSigner;
  let farmer: HardhatEthersSigner;
  let cooperative: HardhatEthersSigner;
  let qc: HardhatEthersSigner;
  let unauthorizedUser: HardhatEthersSigner;

  const FARMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE"));
  const COOPERATIVE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COOPERATIVE_ROLE"));
  const QC_ROLE = ethers.keccak256(ethers.toUtf8Bytes("QC_ROLE"));

  // Sample mock hashes (SHA-256 formatted as bytes32)
  const sampleLandHash = ethers.keccak256(ethers.toUtf8Bytes("Sambirata-Plot-A-GPS-lat-7.3-lng-109.1"));
  const samplePhotoHash = ethers.keccak256(ethers.toUtf8Bytes("rhizome_batch_001_photos_sha256"));
  const sampleCoaHash = ethers.keccak256(ethers.toUtf8Bytes("sidomuncul_lab_coa_report_batch_001_sha256"));
  const sampleReasonHash = ethers.keccak256(ethers.toUtf8Bytes("Contaminated with chemical residue"));

  beforeEach(async function () {
    [admin, farmer, cooperative, qc, unauthorizedUser] = await ethers.getSigners();

    const JahePastiTrackerFactory = await ethers.getContractFactory("JahePastiTracker");
    tracker = await JahePastiTrackerFactory.deploy(admin.address);
    await tracker.waitForDeployment();

    // Grant roles
    await tracker.connect(admin).grantRole(FARMER_ROLE, farmer.address);
    await tracker.connect(admin).grantRole(COOPERATIVE_ROLE, cooperative.address);
    await tracker.connect(admin).grantRole(QC_ROLE, qc.address);
  });

  describe("Initialization & Threshold Configuration", function () {
    it("should initialize default admin and quality thresholds accurately", async function () {
      const DEFAULT_ADMIN_ROLE = await tracker.DEFAULT_ADMIN_ROLE();
      expect(await tracker.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;

      const thresholds = await tracker.thresholds();
      expect(thresholds.minScore).to.equal(8000); // 80.00
      expect(thresholds.maxMoisture).to.equal(1000); // 10.00%
      expect(thresholds.minEssentialOil).to.equal(110); // 1.10%
      expect(thresholds.minCultivationMonths).to.equal(9);
      expect(thresholds.minAiConfidence).to.equal(9000); // 90.00%
      expect(thresholds.maxDefectRatio).to.equal(300); // 3.00%
    });

    it("should allow ADMIN to update thresholds and prevent unauthorized accounts", async function () {
      await expect(
        tracker.connect(admin).updateThresholds(8500, 950, 120, 10, 9200, 250)
      )
        .to.emit(tracker, "ThresholdsUpdated")
        .withArgs(8500, 950, 120, 10, 9200, 250);

      const updated = await tracker.thresholds();
      expect(updated.minScore).to.equal(8500);

      await expect(
        tracker.connect(unauthorizedUser).updateThresholds(8000, 1000, 110, 9, 9000, 300)
      ).to.be.revertedWithCustomError(tracker, "AccessControlUnauthorizedAccount");
    });
  });

  describe("T1: Happy Path End-to-End (Farmer -> Cooperative -> QC -> 2-of-3 Acceptance)", function () {
    const batchId = "BATCH-SAMBIRATA-001";
    const plantingDate = 1704067200; // Jan 1, 2024
    const harvestDate = 1727740800; // Oct 1, 2024 (9 months later)

    it("should successfully trace a batch through all stages to Accepted", async function () {
      // 1. Farmer registers batch
      await expect(
        tracker.connect(farmer).registerBatch(batchId, sampleLandHash, plantingDate)
      )
        .to.emit(tracker, "BatchRegistered")
        .withArgs(batchId, farmer.address, sampleLandHash, plantingDate);

      let batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(0); // BatchStatus.Registered

      // 2. Farmer records harvest
      await expect(
        tracker.connect(farmer).recordHarvest(batchId, harvestDate, 9, 500, samplePhotoHash)
      )
        .to.emit(tracker, "HarvestRecorded")
        .withArgs(batchId, harvestDate, 9, 500, samplePhotoHash);

      batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(1); // BatchStatus.Harvested
      expect(batch.weightKg).to.equal(500);

      // 3. Cooperative submits field verification (moisture: 8.60%, AI confidence: 95.00%, defect: 1.50%)
      await expect(
        tracker.connect(cooperative).submitFieldVerification(
          batchId,
          9500, // 95% AI confidence
          150,  // 1.50% defect ratio
          860,  // 8.60% moisture
          88    // field score contribution
        )
      )
        .to.emit(tracker, "FieldVerified")
        .withArgs(batchId, cooperative.address, 88, 150, 860, 2); // 2 = FieldVerified

      batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(2); // FieldVerified
      expect(batch.moistureContent).to.equal(860);

      // 4. QC submits laboratory test results (essential oil: 1.25%, final score: 86.50)
      await expect(
        tracker.connect(qc).submitLab(
          batchId,
          sampleCoaHash,
          125,  // 1.25% v/b
          8650  // 86.50 final score
        )
      )
        .to.emit(tracker, "LabSubmitted")
        .withArgs(batchId, qc.address, sampleCoaHash, 125, 8650, 4); // 4 = LabApproved

      batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(4); // LabApproved

      // 5. Multi-Sig Approval: QC approves (Signer 1)
      await expect(tracker.connect(qc).approve(batchId))
        .to.emit(tracker, "BatchApproved")
        .withArgs(batchId, qc.address, QC_ROLE);

      batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(4); // Still LabApproved because 2-of-3 requires QC + (Farmer OR Coop)
      expect(batch.approvedByQc).to.be.true;
      expect(batch.approvalCount).to.equal(1);

      // 6. Multi-Sig Approval: Farmer approves (Signer 2)
      await expect(tracker.connect(farmer).approve(batchId))
        .to.emit(tracker, "BatchApproved")
        .withArgs(batchId, farmer.address, FARMER_ROLE)
        .and.to.emit(tracker, "BatchAccepted");

      batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(5); // Accepted!
      expect(batch.approvedByFarmer).to.be.true;
      expect(batch.approvalCount).to.equal(2);
    });
  });

  describe("T2: AI Confidence Rendah & Tinjauan Etis (UnderReview)", function () {
    const batchId = "BATCH-LOW-CONFIDENCE-002";

    beforeEach(async function () {
      await tracker.connect(farmer).registerBatch(batchId, sampleLandHash, 1704067200);
      await tracker.connect(farmer).recordHarvest(batchId, 1727740800, 9, 300, samplePhotoHash);
    });

    it("should set status to UnderReview (not Rejected) when AI confidence is below 90%", async function () {
      await expect(
        tracker.connect(cooperative).submitFieldVerification(
          batchId,
          8500, // 85% AI confidence (< 90%)
          100,  // 1.00% defect ratio
          850,  // 8.50% moisture
          75
        )
      )
        .to.emit(tracker, "FieldVerified")
        .withArgs(batchId, cooperative.address, 75, 100, 850, 3); // 3 = UnderReview

      const batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(3); // UnderReview
    });

    it("should set status to UnderReview when defect ratio exceeds 3%", async function () {
      await expect(
        tracker.connect(cooperative).submitFieldVerification(
          batchId,
          9500, // 95% AI confidence
          450,  // 4.50% defect ratio (> 3.00%)
          850,  // 8.50% moisture
          70
        )
      )
        .to.emit(tracker, "FieldVerified")
        .withArgs(batchId, cooperative.address, 70, 450, 850, 3); // 3 = UnderReview
    });
  });

  describe("T3: Kadar Air Melebihi Batas (> 10.00%)", function () {
    const batchId = "BATCH-HIGH-MOISTURE-003";

    beforeEach(async function () {
      await tracker.connect(farmer).registerBatch(batchId, sampleLandHash, 1704067200);
      await tracker.connect(farmer).recordHarvest(batchId, 1727740800, 9, 250, samplePhotoHash);
    });

    it("should revert with MoistureExceedsThreshold when moisture is 12.00%", async function () {
      await expect(
        tracker.connect(cooperative).submitFieldVerification(
          batchId,
          9500,
          100,
          1200, // 12.00% moisture > 10.00% threshold
          80
        )
      ).to.be.revertedWithCustomError(tracker, "MoistureExceedsThreshold")
        .withArgs(1200, 1000);
    });
  });

  describe("T4: Minyak Atsiri Kurang (< 1.10% v/b) & Skor Rendah", function () {
    const batchId = "BATCH-LOW-OIL-004";

    beforeEach(async function () {
      await tracker.connect(farmer).registerBatch(batchId, sampleLandHash, 1704067200);
      await tracker.connect(farmer).recordHarvest(batchId, 1727740800, 9, 400, samplePhotoHash);
      await tracker.connect(cooperative).submitFieldVerification(batchId, 9500, 120, 850, 85);
    });

    it("should revert with EssentialOilBelowThreshold when essential oil is 0.90%", async function () {
      await expect(
        tracker.connect(qc).submitLab(
          batchId,
          sampleCoaHash,
          90,   // 0.90% < 1.10%
          8200  // score 82
        )
      ).to.be.revertedWithCustomError(tracker, "EssentialOilBelowThreshold")
        .withArgs(90, 110);
    });

    it("should revert with ScoreBelowThreshold when calculated score is below 80", async function () {
      await expect(
        tracker.connect(qc).submitLab(
          batchId,
          sampleCoaHash,
          120,  // 1.20%
          7500  // score 75.00 < 80.00
        )
      ).to.be.revertedWithCustomError(tracker, "ScoreBelowThreshold")
        .withArgs(7500, 8000);
    });
  });

  describe("T5: Integritas Data Hash & Deteksi Manipulasi", function () {
    const batchId = "BATCH-HASH-CHECK-005";

    it("should accurately store and verify SHA-256 hashes against simulated off-chain modification", async function () {
      await tracker.connect(farmer).registerBatch(batchId, sampleLandHash, 1704067200);
      await tracker.connect(farmer).recordHarvest(batchId, 1727740800, 9, 400, samplePhotoHash);
      await tracker.connect(cooperative).submitFieldVerification(batchId, 9500, 100, 800, 90);
      await tracker.connect(qc).submitLab(batchId, sampleCoaHash, 130, 8800);

      const batch = await tracker.getBatch(batchId);
      expect(batch.landDataHash).to.equal(sampleLandHash);
      expect(batch.photosHash).to.equal(samplePhotoHash);
      expect(batch.coaHash).to.equal(sampleCoaHash);

      // Simulating off-chain tampering (e.g. attacker modifies photo or CoA)
      const tamperedPhotoHash = ethers.keccak256(ethers.toUtf8Bytes("tampered_photo_content"));
      expect(batch.photosHash).to.not.equal(tamperedPhotoHash);
    });
  });

  describe("T6: Peran Tidak Berwenang (AccessControl Enforcement)", function () {
    const batchId = "BATCH-AUTH-CHECK-006";

    it("should reject batch registration from unauthorized callers", async function () {
      await expect(
        tracker.connect(unauthorizedUser).registerBatch(batchId, sampleLandHash, 1704067200)
      ).to.be.revertedWithCustomError(tracker, "AccessControlUnauthorizedAccount");
    });

    it("should prevent farmer from calling submitLab or submitFieldVerification", async function () {
      await tracker.connect(farmer).registerBatch(batchId, sampleLandHash, 1704067200);
      await tracker.connect(farmer).recordHarvest(batchId, 1727740800, 9, 300, samplePhotoHash);

      await expect(
        tracker.connect(farmer).submitFieldVerification(batchId, 9500, 100, 850, 80)
      ).to.be.revertedWithCustomError(tracker, "AccessControlUnauthorizedAccount");

      await expect(
        tracker.connect(farmer).submitLab(batchId, sampleCoaHash, 120, 8500)
      ).to.be.revertedWithCustomError(tracker, "AccessControlUnauthorizedAccount");
    });

    it("should prevent non-creator farmer from recording harvest on someone else's batch", async function () {
      const [, , , , , otherFarmer] = await ethers.getSigners();
      await tracker.connect(admin).grantRole(FARMER_ROLE, otherFarmer.address);

      await tracker.connect(farmer).registerBatch(batchId, sampleLandHash, 1704067200);

      await expect(
        tracker.connect(otherFarmer).recordHarvest(batchId, 1727740800, 9, 300, samplePhotoHash)
      ).to.be.revertedWithCustomError(tracker, "NotBatchFarmer")
        .withArgs(batchId, otherFarmer.address);
    });
  });

  describe("T7: Validasi Tanggal Panen & Tanggal Tanam", function () {
    const batchId = "BATCH-DATE-CHECK-007";

    it("should revert if harvest date is earlier than planting date", async function () {
      const plantingDate = 1720000000;
      const invalidHarvestDate = 1710000000; // earlier!

      await tracker.connect(farmer).registerBatch(batchId, sampleLandHash, plantingDate);

      await expect(
        tracker.connect(farmer).recordHarvest(batchId, invalidHarvestDate, 0, 100, samplePhotoHash)
      ).to.be.revertedWithCustomError(tracker, "InvalidHarvestDate")
        .withArgs(batchId, invalidHarvestDate, plantingDate);
    });
  });

  describe("T8: Batch Tidak Ditemukan & Duplikasi BatchId", function () {
    it("should revert with BatchNotFound when querying non-existent batchId", async function () {
      await expect(tracker.getBatch("BATCH-NON-EXISTENT"))
        .to.be.revertedWithCustomError(tracker, "BatchNotFound")
        .withArgs("BATCH-NON-EXISTENT");
    });

    it("should revert with BatchAlreadyExists when registering identical batchId", async function () {
      await tracker.connect(farmer).registerBatch("BATCH-DUP-001", sampleLandHash, 1704067200);

      await expect(
        tracker.connect(farmer).registerBatch("BATCH-DUP-001", sampleLandHash, 1704067200)
      ).to.be.revertedWithCustomError(tracker, "BatchAlreadyExists")
        .withArgs("BATCH-DUP-001");
    });
  });

  describe("2-of-3 Multi-Signature Matrix & Rejection Flow", function () {
    const setupReadyBatch = async (batchId: string) => {
      await tracker.connect(farmer).registerBatch(batchId, sampleLandHash, 1704067200);
      await tracker.connect(farmer).recordHarvest(batchId, 1727740800, 9, 500, samplePhotoHash);
      await tracker.connect(cooperative).submitFieldVerification(batchId, 9500, 150, 850, 88);
      await tracker.connect(qc).submitLab(batchId, sampleCoaHash, 130, 8700);
    };

    it("should reach Accepted when signed by QC + Cooperative (without farmer)", async function () {
      const batchId = "BATCH-QC-COOP-008";
      await setupReadyBatch(batchId);

      await tracker.connect(qc).approve(batchId);
      await tracker.connect(cooperative).approve(batchId);

      const batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(5); // Accepted
      expect(batch.approvedByQc).to.be.true;
      expect(batch.approvedByCooperative).to.be.true;
      expect(batch.approvedByFarmer).to.be.false;
    });

    it("should NOT reach Accepted if signed by Farmer + Cooperative without QC", async function () {
      const batchId = "BATCH-NO-QC-009";
      await setupReadyBatch(batchId);

      await tracker.connect(farmer).approve(batchId);
      await tracker.connect(cooperative).approve(batchId);

      const batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(4); // Remains LabApproved because QC is mandatory!
      expect(batch.approvedByFarmer).to.be.true;
      expect(batch.approvedByCooperative).to.be.true;
      expect(batch.approvedByQc).to.be.false;
    });

    it("should revert if an account tries to approve twice", async function () {
      const batchId = "BATCH-DOUBLE-SIGN-010";
      await setupReadyBatch(batchId);

      await tracker.connect(qc).approve(batchId);

      await expect(tracker.connect(qc).approve(batchId))
        .to.be.revertedWithCustomError(tracker, "AlreadyApprovedByRole")
        .withArgs(batchId, QC_ROLE);
    });

    it("should allow Cooperative or QC to reject a batch with reason hash", async function () {
      const batchId = "BATCH-REJECT-011";
      await setupReadyBatch(batchId);

      await expect(tracker.connect(qc).reject(batchId, sampleReasonHash))
        .to.emit(tracker, "BatchRejected")
        .withArgs(batchId, qc.address, sampleReasonHash);

      const batch = await tracker.getBatch(batchId);
      expect(batch.status).to.equal(6); // Rejected
      expect(batch.rejectReasonHash).to.equal(sampleReasonHash);

      // Once rejected, cannot approve
      await expect(tracker.connect(farmer).approve(batchId))
        .to.be.revertedWithCustomError(tracker, "InvalidBatchStatus");
    });
  });
});
