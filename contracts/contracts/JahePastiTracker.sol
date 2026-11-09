// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title JahePastiTracker
 * @notice Smart contract for Red Ginger (Jahe Merah) batch authenticity and quality tracking.
 * @dev Enforces multi-role authorization, immutability of SHA-256 hashes, on-chain quality threshold checks,
 *      and 2-of-3 consensus approval (mandatory QC + Farmer or Cooperative).
 */
contract JahePastiTracker is AccessControl {
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant COOPERATIVE_ROLE = keccak256("COOPERATIVE_ROLE");
    bytes32 public constant QC_ROLE = keccak256("QC_ROLE");

    enum BatchStatus {
        Registered,     // 0: Batch registered by Farmer
        Harvested,      // 1: Harvest data and photo hash recorded
        FieldVerified,  // 2: Passed cooperative inspection & physical metrics
        UnderReview,    // 3: Flagged for manual review (low AI confidence or defects)
        LabApproved,    // 4: Laboratory CoA and essential oil verified
        Accepted,       // 5: Final acceptance via 2-of-3 multi-signature
        Rejected        // 6: Rejected due to quality failure or violation
    }

    struct ThresholdConfig {
        uint256 minScore;             // Basis 100: 8000 = 80.00
        uint256 maxMoisture;          // Basis 100: 1000 = 10.00%
        uint256 minEssentialOil;      // Basis 100: 110 = 1.10%
        uint256 minCultivationMonths; // 9 months
        uint256 minAiConfidence;      // Basis 100: 9000 = 90.00%
        uint256 maxDefectRatio;       // Basis 100: 300 = 3.00%
    }

    struct BatchRecord {
        string batchId;
        address farmer;
        bytes32 landDataHash;
        uint256 plantingDate;
        
        // Harvest information
        uint256 harvestDate;
        uint256 harvestAgeMonths;
        uint256 weightKg;
        bytes32 photosHash;
        
        // Field inspection
        address verifier;
        uint256 aiScore;
        uint256 defectRatio;
        uint256 moistureContent;
        
        // Lab testing
        address qc;
        bytes32 coaHash;
        uint256 essentialOilContent;
        
        // Final score and decision
        uint256 finalScore;
        BatchStatus status;
        bytes32 rejectReasonHash;
        
        // Multi-party approval flags (2-of-3)
        bool approvedByFarmer;
        bool approvedByCooperative;
        bool approvedByQc;
        uint256 approvalCount;
    }

    ThresholdConfig public thresholds;
    mapping(string => BatchRecord) private _batches;
    string[] private _batchIds;

    // Custom Errors
    error BatchAlreadyExists(string batchId);
    error BatchNotFound(string batchId);
    error InvalidBatchStatus(string batchId, BatchStatus current, BatchStatus required);
    error NotBatchFarmer(string batchId, address caller);
    error InvalidHarvestDate(string batchId, uint256 harvestDate, uint256 plantingDate);
    error MoistureExceedsThreshold(uint256 moisture, uint256 maxAllowed);
    error EssentialOilBelowThreshold(uint256 oil, uint256 minRequired);
    error ScoreBelowThreshold(uint256 score, uint256 minRequired);
    error AlreadyApprovedByRole(string batchId, bytes32 role);
    error UnauthorizedApprover(string batchId, address caller);
    error BatchAlreadyFinalized(string batchId, BatchStatus status);
    error InvalidThresholds();

    // Events
    event BatchRegistered(string indexed batchId, address indexed farmer, bytes32 landDataHash, uint256 plantingDate);
    event HarvestRecorded(string indexed batchId, uint256 harvestDate, uint256 harvestAgeMonths, uint256 weightKg, bytes32 photosHash);
    event FieldVerified(string indexed batchId, address indexed verifier, uint256 aiScore, uint256 defectRatio, uint256 moistureContent, BatchStatus newStatus);
    event LabSubmitted(string indexed batchId, address indexed qc, bytes32 coaHash, uint256 essentialOilContent, uint256 calculatedScore, BatchStatus newStatus);
    event BatchApproved(string indexed batchId, address indexed approver, bytes32 role);
    event BatchAccepted(string indexed batchId, uint256 finalScore, uint256 blockTimestamp);
    event BatchRejected(string indexed batchId, address indexed rejector, bytes32 reasonHash);
    event ThresholdsUpdated(
        uint256 minScore,
        uint256 maxMoisture,
        uint256 minEssentialOil,
        uint256 minCultivationMonths,
        uint256 minAiConfidence,
        uint256 maxDefectRatio
    );

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);

        // Default thresholds per Indonesian Herbal Pharmacopoeia (FHI II) and PRD
        thresholds = ThresholdConfig({
            minScore: 8000,             // 80.00
            maxMoisture: 1000,          // 10.00%
            minEssentialOil: 110,       // 1.10%
            minCultivationMonths: 9,    // 9 months
            minAiConfidence: 9000,      // 90.00%
            maxDefectRatio: 300         // 3.00%
        });
    }

    /**
     * @notice Register a new red ginger batch with unique batch ID and land data hash.
     * @param batchId Unique identifier (e.g., 'BATCH-202611-001')
     * @param landDataHash SHA-256 hash of off-chain land and farmer details
     * @param plantingDate Timestamp of initial planting
     */
    function registerBatch(
        string calldata batchId,
        bytes32 landDataHash,
        uint256 plantingDate
    ) external onlyRole(FARMER_ROLE) {
        if (_batches[batchId].farmer != address(0)) {
            revert BatchAlreadyExists(batchId);
        }

        BatchRecord storage batch = _batches[batchId];
        batch.batchId = batchId;
        batch.farmer = msg.sender;
        batch.landDataHash = landDataHash;
        batch.plantingDate = plantingDate;
        batch.status = BatchStatus.Registered;

        _batchIds.push(batchId);

        emit BatchRegistered(batchId, msg.sender, landDataHash, plantingDate);
    }

    /**
     * @notice Record harvest details, age in months, weight, and initial photo hash.
     * @param batchId Target batch identifier
     * @param harvestDate Timestamp when harvest was conducted
     * @param harvestAgeMonths Age in months at harvest
     * @param weightKg Total harvested weight in kilograms
     * @param photosHash SHA-256 hash representing uploaded rhizome photos
     */
    function recordHarvest(
        string calldata batchId,
        uint256 harvestDate,
        uint256 harvestAgeMonths,
        uint256 weightKg,
        bytes32 photosHash
    ) external onlyRole(FARMER_ROLE) {
        BatchRecord storage batch = _getExistingBatch(batchId);

        if (batch.farmer != msg.sender) {
            revert NotBatchFarmer(batchId, msg.sender);
        }
        if (batch.status != BatchStatus.Registered) {
            revert InvalidBatchStatus(batchId, batch.status, BatchStatus.Registered);
        }
        if (harvestDate < batch.plantingDate) {
            revert InvalidHarvestDate(batchId, harvestDate, batch.plantingDate);
        }

        batch.harvestDate = harvestDate;
        batch.harvestAgeMonths = harvestAgeMonths;
        batch.weightKg = weightKg;
        batch.photosHash = photosHash;
        batch.status = BatchStatus.Harvested;

        emit HarvestRecorded(batchId, harvestDate, harvestAgeMonths, weightKg, photosHash);
    }

    /**
     * @notice Record cooperative field inspection, moisture measurement, and AI defect analysis.
     * @param batchId Target batch identifier
     * @param aiConfidence AI detection confidence score (basis 100, e.g. 9500 = 95.00%)
     * @param defectRatio AI defect ratio percentage (basis 100, e.g. 150 = 1.50%)
     * @param moistureContent Measured moisture percentage (basis 100, e.g. 860 = 8.60%)
     * @param calculatedAiScore Field score contribution
     */
    function submitFieldVerification(
        string calldata batchId,
        uint256 aiConfidence,
        uint256 defectRatio,
        uint256 moistureContent,
        uint256 calculatedAiScore
    ) external onlyRole(COOPERATIVE_ROLE) {
        BatchRecord storage batch = _getExistingBatch(batchId);

        if (batch.status != BatchStatus.Harvested && batch.status != BatchStatus.UnderReview) {
            revert InvalidBatchStatus(batchId, batch.status, BatchStatus.Harvested);
        }

        // Moisture check: strictly cannot exceed maximum allowable limit (susut pengeringan FHI II)
        if (moistureContent > thresholds.maxMoisture) {
            revert MoistureExceedsThreshold(moistureContent, thresholds.maxMoisture);
        }

        batch.verifier = msg.sender;
        batch.aiScore = calculatedAiScore;
        batch.defectRatio = defectRatio;
        batch.moistureContent = moistureContent;

        // Ethical AI rule: if AI confidence < 90% or defect ratio exceeds threshold, route to UnderReview
        if (aiConfidence < thresholds.minAiConfidence || defectRatio > thresholds.maxDefectRatio) {
            batch.status = BatchStatus.UnderReview;
        } else {
            batch.status = BatchStatus.FieldVerified;
        }

        emit FieldVerified(batchId, msg.sender, calculatedAiScore, defectRatio, moistureContent, batch.status);
    }

    /**
     * @notice Record certified laboratory analysis (CoA) and essential oil content by factory QC.
     * @param batchId Target batch identifier
     * @param coaHash SHA-256 hash of the Certificate of Analysis PDF document
     * @param essentialOilContent Measured essential oil percentage (basis 100, e.g. 125 = 1.25% v/b)
     * @param calculatedScore Overall aggregated batch quality score (basis 100, e.g. 8500 = 85.00)
     */
    function submitLab(
        string calldata batchId,
        bytes32 coaHash,
        uint256 essentialOilContent,
        uint256 calculatedScore
    ) external onlyRole(QC_ROLE) {
        BatchRecord storage batch = _getExistingBatch(batchId);

        if (batch.status != BatchStatus.FieldVerified && batch.status != BatchStatus.UnderReview) {
            revert InvalidBatchStatus(batchId, batch.status, BatchStatus.FieldVerified);
        }

        // Mandatory standard: essential oil must meet or exceed minimum FHI II standard (1.10% v/b)
        if (essentialOilContent < thresholds.minEssentialOil) {
            revert EssentialOilBelowThreshold(essentialOilContent, thresholds.minEssentialOil);
        }

        // Overall score must meet or exceed passing threshold
        if (calculatedScore < thresholds.minScore) {
            revert ScoreBelowThreshold(calculatedScore, thresholds.minScore);
        }

        batch.qc = msg.sender;
        batch.coaHash = coaHash;
        batch.essentialOilContent = essentialOilContent;
        batch.finalScore = calculatedScore;
        batch.status = BatchStatus.LabApproved;

        emit LabSubmitted(batchId, msg.sender, coaHash, essentialOilContent, calculatedScore, batch.status);
    }

    /**
     * @notice Sign and approve a verified batch under the 2-of-3 multi-signature consensus.
     * @dev Requirement: Status must be LabApproved. QC approval is mandatory, accompanied by either Farmer or Cooperative.
     * @param batchId Target batch identifier
     */
    function approve(string calldata batchId) external {
        BatchRecord storage batch = _getExistingBatch(batchId);

        if (batch.status != BatchStatus.LabApproved) {
            revert InvalidBatchStatus(batchId, batch.status, BatchStatus.LabApproved);
        }

        bytes32 assignedRole;
        if (msg.sender == batch.farmer && hasRole(FARMER_ROLE, msg.sender)) {
            if (batch.approvedByFarmer) {
                revert AlreadyApprovedByRole(batchId, FARMER_ROLE);
            }
            batch.approvedByFarmer = true;
            assignedRole = FARMER_ROLE;
        } else if (hasRole(COOPERATIVE_ROLE, msg.sender)) {
            if (batch.approvedByCooperative) {
                revert AlreadyApprovedByRole(batchId, COOPERATIVE_ROLE);
            }
            batch.approvedByCooperative = true;
            assignedRole = COOPERATIVE_ROLE;
        } else if (hasRole(QC_ROLE, msg.sender)) {
            if (batch.approvedByQc) {
                revert AlreadyApprovedByRole(batchId, QC_ROLE);
            }
            batch.approvedByQc = true;
            assignedRole = QC_ROLE;
        } else {
            revert UnauthorizedApprover(batchId, msg.sender);
        }

        batch.approvalCount++;
        emit BatchApproved(batchId, msg.sender, assignedRole);

        // Check 2-of-3 condition: QC signature is MANDATORY + at least one of Farmer or Cooperative
        if (batch.approvedByQc && (batch.approvedByFarmer || batch.approvedByCooperative)) {
            batch.status = BatchStatus.Accepted;
            emit BatchAccepted(batchId, batch.finalScore, block.timestamp);
        }
    }

    /**
     * @notice Reject a batch due to quality failure, fraud detection, or rule breach.
     * @param batchId Target batch identifier
     * @param reasonHash SHA-256 hash or keccak256 hash describing reason for rejection
     */
    function reject(string calldata batchId, bytes32 reasonHash) external {
        if (!hasRole(COOPERATIVE_ROLE, msg.sender) && !hasRole(QC_ROLE, msg.sender)) {
            revert UnauthorizedApprover(batchId, msg.sender);
        }

        BatchRecord storage batch = _getExistingBatch(batchId);

        if (batch.status == BatchStatus.Accepted || batch.status == BatchStatus.Rejected) {
            revert BatchAlreadyFinalized(batchId, batch.status);
        }

        batch.status = BatchStatus.Rejected;
        batch.rejectReasonHash = reasonHash;

        emit BatchRejected(batchId, msg.sender, reasonHash);
    }

    /**
     * @notice Update system verification thresholds. Only callable by admin.
     */
    function updateThresholds(
        uint256 minScore,
        uint256 maxMoisture,
        uint256 minEssentialOil,
        uint256 minCultivationMonths,
        uint256 minAiConfidence,
        uint256 maxDefectRatio
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (minScore == 0 || maxMoisture == 0 || minEssentialOil == 0) {
            revert InvalidThresholds();
        }

        thresholds = ThresholdConfig({
            minScore: minScore,
            maxMoisture: maxMoisture,
            minEssentialOil: minEssentialOil,
            minCultivationMonths: minCultivationMonths,
            minAiConfidence: minAiConfidence,
            maxDefectRatio: maxDefectRatio
        });

        emit ThresholdsUpdated(
            minScore,
            maxMoisture,
            minEssentialOil,
            minCultivationMonths,
            minAiConfidence,
            maxDefectRatio
        );
    }

    /**
     * @notice Retrieve the full record of a batch for verification or public QR view.
     * @param batchId Target batch identifier
     */
    function getBatch(string calldata batchId) external view returns (BatchRecord memory) {
        BatchRecord storage batch = _batches[batchId];
        if (batch.farmer == address(0)) {
            revert BatchNotFound(batchId);
        }
        return batch;
    }

    /**
     * @notice Total registered batches count.
     */
    function totalBatches() external view returns (uint256) {
        return _batchIds.length;
    }

    /**
     * @notice Retrieve batch identifier by array index.
     */
    function getBatchIdAtIndex(uint256 index) external view returns (string memory) {
        require(index < _batchIds.length, "Index out of bounds");
        return _batchIds[index];
    }

    /**
     * @dev Internal helper to ensure batch existence.
     */
    function _getExistingBatch(string memory batchId) private view returns (BatchRecord storage) {
        BatchRecord storage batch = _batches[batchId];
        if (batch.farmer == address(0)) {
            revert BatchNotFound(batchId);
        }
        return batch;
    }
}
