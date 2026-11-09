use anchor_lang::prelude::*;
use anchor_lang::error_code;

declare_id!("JahePasti1111111111111111111111111111111111");

#[program]
pub mod jahepasti {
    use super::*;

    /// Inisialisasi konfigurasi ambang batas mutu standar FHI II
    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.min_score = 8000;             // 80.00
        config.max_moisture = 1000;          // 10.00%
        config.min_essential_oil = 110;      // 1.10% v/b
        config.min_cultivation_months = 9;   // 9 bulan
        config.min_ai_confidence = 9000;     // 90.00%
        config.max_defect_ratio = 300;       // 3.00%
        config.bump = ctx.bumps.config;

        emit!(ConfigInitialized {
            admin: config.admin,
            min_score: config.min_score,
            max_moisture: config.max_moisture,
            min_essential_oil: config.min_essential_oil,
        });

        Ok(())
    }

    /// Pendaftaran batch jahe merah baru oleh Petani
    pub fn register_batch(
        ctx: Context<RegisterBatch>,
        batch_id: String,
        land_data_hash: [u8; 32],
        planting_date: i64,
    ) -> Result<()> {
        require!(batch_id.len() <= 32, ErrorCode::BatchIdTooLong);

        let batch = &mut ctx.accounts.batch;
        batch.batch_id = batch_id.clone();
        batch.farmer = ctx.accounts.farmer.key();
        batch.land_data_hash = land_data_hash;
        batch.planting_date = planting_date;
        batch.status = BatchStatus::Registered;
        batch.bump = ctx.bumps.batch;

        emit!(BatchRegistered {
            batch_id,
            farmer: batch.farmer,
            land_data_hash,
            planting_date,
        });

        Ok(())
    }

    /// Pencatatan panen oleh Petani
    pub fn record_harvest(
        ctx: Context<RecordHarvest>,
        harvest_date: i64,
        harvest_age_months: u8,
        weight_kg: u64,
        photos_hash: [u8; 32],
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;

        require!(batch.status == BatchStatus::Registered, ErrorCode::InvalidStatus);
        require!(harvest_date >= batch.planting_date, ErrorCode::InvalidHarvestDate);

        batch.harvest_date = harvest_date;
        batch.harvest_age_months = harvest_age_months;
        batch.weight_kg = weight_kg;
        batch.photos_hash = photos_hash;
        batch.status = BatchStatus::Harvested;

        emit!(HarvestRecorded {
            batch_id: batch.batch_id.clone(),
            harvest_date,
            harvest_age_months,
            weight_kg,
            photos_hash,
        });

        Ok(())
    }

    /// Inspeksi fisik sortasi & inferensi deteksi AI rimpang oleh Koperasi
    pub fn submit_field_verification(
        ctx: Context<SubmitFieldVerification>,
        ai_confidence: u64,
        defect_ratio: u64,
        moisture_content: u64,
        calculated_ai_score: u64,
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        let config = &ctx.accounts.config;

        require!(
            batch.status == BatchStatus::Harvested || batch.status == BatchStatus::UnderReview,
            ErrorCode::InvalidStatus
        );

        // Syarat Mutu FHI II: Kadar air maksimal 10.0%
        require!(
            moisture_content <= config.max_moisture,
            ErrorCode::MoistureExceedsThreshold
        );

        batch.verifier = ctx.accounts.verifier.key();
        batch.ai_score = calculated_ai_score;
        batch.defect_ratio = defect_ratio;
        batch.moisture_content = moisture_content;

        // Rute Etis AI: Jika confidence < 90% atau cacat > 3%, arahkan ke UnderReview
        if ai_confidence < config.min_ai_confidence || defect_ratio > config.max_defect_ratio {
            batch.status = BatchStatus::UnderReview;
        } else {
            batch.status = BatchStatus::FieldVerified;
        }

        emit!(FieldVerified {
            batch_id: batch.batch_id.clone(),
            verifier: batch.verifier,
            moisture_content,
            defect_ratio,
            new_status: batch.status,
        });

        Ok(())
    }

    /// Uji laboratorium CoA dan kadar minyak atsiri oleh QC Pabrik
    pub fn submit_lab(
        ctx: Context<SubmitLab>,
        coa_hash: [u8; 32],
        essential_oil_content: u64,
        calculated_score: u64,
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        let config = &ctx.accounts.config;

        require!(
            batch.status == BatchStatus::FieldVerified || batch.status == BatchStatus::UnderReview,
            ErrorCode::InvalidStatus
        );

        // Standar FHI II: Minyak atsiri minimal 1.10% v/b
        require!(
            essential_oil_content >= config.min_essential_oil,
            ErrorCode::EssentialOilBelowThreshold
        );
        require!(
            calculated_score >= config.min_score,
            ErrorCode::ScoreBelowThreshold
        );

        batch.qc = ctx.accounts.qc.key();
        batch.coa_hash = coa_hash;
        batch.essential_oil_content = essential_oil_content;
        batch.final_score = calculated_score;
        batch.status = BatchStatus::LabApproved;

        emit!(LabSubmitted {
            batch_id: batch.batch_id.clone(),
            qc: batch.qc,
            coa_hash,
            essential_oil_content,
            final_score: calculated_score,
        });

        Ok(())
    }

    /// Tanda tangan konsensus multi-signature 2-dari-3
    /// Syarat: Status LabApproved. QC wajib + salah satu dari Petani atau Koperasi
    pub fn approve(ctx: Context<ApproveBatch>) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        let signer = ctx.accounts.signer.key();

        require!(
            batch.status == BatchStatus::LabApproved,
            ErrorCode::InvalidStatus
        );

        let mut signed = false;

        if signer == batch.farmer {
            require!(!batch.approved_by_farmer, ErrorCode::AlreadyApproved);
            batch.approved_by_farmer = true;
            signed = true;
        }

        if signer == batch.qc {
            require!(!batch.approved_by_qc, ErrorCode::AlreadyApproved);
            batch.approved_by_qc = true;
            signed = true;
        }

        if signer == batch.verifier {
            require!(!batch.approved_by_coop, ErrorCode::AlreadyApproved);
            batch.approved_by_coop = true;
            signed = true;
        }

        require!(signed, ErrorCode::UnauthorizedSigner);

        batch.approval_count += 1;

        emit!(BatchApproved {
            batch_id: batch.batch_id.clone(),
            signer,
        });

        // Logika 2-of-3: QC Wajib + (Petani atau Koperasi)
        if batch.approved_by_qc && (batch.approved_by_farmer || batch.approved_by_coop) {
            batch.status = BatchStatus::Accepted;
            emit!(BatchAccepted {
                batch_id: batch.batch_id.clone(),
                final_score: batch.final_score,
            });
        }

        Ok(())
    }

    /// Penolakan batch dengan hash alasan oleh Koperasi atau QC
    pub fn reject(ctx: Context<RejectBatch>, reason_hash: [u8; 32]) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        let signer = ctx.accounts.signer.key();

        require!(
            signer == batch.verifier || signer == batch.qc,
            ErrorCode::UnauthorizedSigner
        );
        require!(
            batch.status != BatchStatus::Accepted && batch.status != BatchStatus::Rejected,
            ErrorCode::BatchAlreadyFinalized
        );

        batch.status = BatchStatus::Rejected;
        batch.reject_reason_hash = reason_hash;

        emit!(BatchRejected {
            batch_id: batch.batch_id.clone(),
            signer,
            reason_hash,
        });

        Ok(())
    }
}

// -------------------------------------------------------------
// Accounts Structs (PDAs)
// -------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + ConfigAccount::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(batch_id: String)]
pub struct RegisterBatch<'info> {
    #[account(
        init,
        payer = farmer,
        space = 8 + BatchAccount::LEN,
        seeds = [b"batch", batch_id.as_bytes()],
        bump
    )]
    pub batch: Account<'info, BatchAccount>,
    #[account(mut)]
    pub farmer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordHarvest<'info> {
    #[account(
        mut,
        has_one = farmer @ ErrorCode::NotBatchFarmer,
        seeds = [b"batch", batch.batch_id.as_bytes()],
        bump = batch.bump
    )]
    pub batch: Account<'info, BatchAccount>,
    pub farmer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitFieldVerification<'info> {
    #[account(
        mut,
        seeds = [b"batch", batch.batch_id.as_bytes()],
        bump = batch.bump
    )]
    pub batch: Account<'info, BatchAccount>,
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ConfigAccount>,
    pub verifier: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitLab<'info> {
    #[account(
        mut,
        seeds = [b"batch", batch.batch_id.as_bytes()],
        bump = batch.bump
    )]
    pub batch: Account<'info, BatchAccount>,
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ConfigAccount>,
    pub qc: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveBatch<'info> {
    #[account(
        mut,
        seeds = [b"batch", batch.batch_id.as_bytes()],
        bump = batch.bump
    )]
    pub batch: Account<'info, BatchAccount>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct RejectBatch<'info> {
    #[account(
        mut,
        seeds = [b"batch", batch.batch_id.as_bytes()],
        bump = batch.bump
    )]
    pub batch: Account<'info, BatchAccount>,
    pub signer: Signer<'info>,
}

// -------------------------------------------------------------
// State Accounts & Enums
// -------------------------------------------------------------

#[account]
pub struct ConfigAccount {
    pub admin: Pubkey,
    pub min_score: u64,
    pub max_moisture: u64,
    pub min_essential_oil: u64,
    pub min_cultivation_months: u8,
    pub min_ai_confidence: u64,
    pub max_defect_ratio: u64,
    pub bump: u8,
}

impl ConfigAccount {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 1 + 8 + 8 + 1;
}

#[account]
pub struct BatchAccount {
    pub batch_id: String,          // 4 + 32
    pub farmer: Pubkey,            // 32
    pub land_data_hash: [u8; 32],  // 32
    pub planting_date: i64,        // 8
    pub harvest_date: i64,         // 8
    pub harvest_age_months: u8,    // 1
    pub weight_kg: u64,            // 8
    pub photos_hash: [u8; 32],     // 32
    pub verifier: Pubkey,          // 32
    pub ai_score: u64,             // 8
    pub defect_ratio: u64,         // 8
    pub moisture_content: u64,     // 8
    pub qc: Pubkey,                // 32
    pub coa_hash: [u8; 32],        // 32
    pub essential_oil_content: u64,// 8
    pub final_score: u64,          // 8
    pub status: BatchStatus,       // 1
    pub reject_reason_hash: [u8; 32], // 32
    pub approved_by_farmer: bool,  // 1
    pub approved_by_coop: bool,    // 1
    pub approved_by_qc: bool,      // 1
    pub approval_count: u8,        // 1
    pub bump: u8,                  // 1
}

impl BatchAccount {
    pub const LEN: usize = 36 + 32 + 32 + 8 + 8 + 1 + 8 + 32 + 32 + 8 + 8 + 8 + 32 + 32 + 8 + 8 + 1 + 32 + 1 + 1 + 1 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BatchStatus {
    Registered,
    Harvested,
    FieldVerified,
    UnderReview,
    LabApproved,
    Accepted,
    Rejected,
}

// -------------------------------------------------------------
// Events
// -------------------------------------------------------------

#[event]
pub struct ConfigInitialized {
    pub admin: Pubkey,
    pub min_score: u64,
    pub max_moisture: u64,
    pub min_essential_oil: u64,
}

#[event]
pub struct BatchRegistered {
    pub batch_id: String,
    pub farmer: Pubkey,
    pub land_data_hash: [u8; 32],
    pub planting_date: i64,
}

#[event]
pub struct HarvestRecorded {
    pub batch_id: String,
    pub harvest_date: i64,
    pub harvest_age_months: u8,
    pub weight_kg: u64,
    pub photos_hash: [u8; 32],
}

#[event]
pub struct FieldVerified {
    pub batch_id: String,
    pub verifier: Pubkey,
    pub moisture_content: u64,
    pub defect_ratio: u64,
    pub new_status: BatchStatus,
}

#[event]
pub struct LabSubmitted {
    pub batch_id: String,
    pub qc: Pubkey,
    pub coa_hash: [u8; 32],
    pub essential_oil_content: u64,
    pub final_score: u64,
}

#[event]
pub struct BatchApproved {
    pub batch_id: String,
    pub signer: Pubkey,
}

#[event]
pub struct BatchAccepted {
    pub batch_id: String,
    pub final_score: u64,
}

#[event]
pub struct BatchRejected {
    pub batch_id: String,
    pub signer: Pubkey,
    pub reason_hash: [u8; 32],
}

// -------------------------------------------------------------
// Error Codes
// -------------------------------------------------------------

#[error_code]
pub enum ErrorCode {
    #[msg("Batch ID melebihi batas 32 karakter.")]
    BatchIdTooLong,
    #[msg("Status batch saat ini tidak memenuhi syarat untuk aksi ini.")]
    InvalidStatus,
    #[msg("Tanggal panen tidak boleh mendahului tanggal mulai tanam.")]
    InvalidHarvestDate,
    #[msg("Kadar air melebihi batas standar maksimal FHI II (10.0%).")]
    MoistureExceedsThreshold,
    #[msg("Kadar minyak atsiri di bawah batas standar minimal FHI II (1.10% v/b).")]
    EssentialOilBelowThreshold,
    #[msg("Skor agregat mutu di bawah batas kelulusan (80.00).")]
    ScoreBelowThreshold,
    #[msg("Akun ini sudah menandatangani batch sebelumnya.")]
    AlreadyApproved,
    #[msg("Penandatangan tidak memiliki wewenang peran pada batch ini.")]
    UnauthorizedSigner,
    #[msg("Bukan petani pendaftar batch ini.")]
    NotBatchFarmer,
    #[msg("Batch sudah berstatus final (Accepted/Rejected).")]
    BatchAlreadyFinalized,
}
