# Panduan Step-by-Step Mendeploy Smart Contract Solana (JahePasti)

Dokumen ini memandu Anda mendeploy Smart Contract Solana (**Anchor Rust Program**) ke jaringan **Solana Devnet** menggunakan wallet Anda yang sudah memiliki saldo 2 SOL Devnet.

---

## Ringkasan Program Solana Kita
* **Kode Sumber Program:** [`solana-program/programs/jahepasti/src/lib.rs`](file:///d:/Blockchain/solana-program/programs/jahepasti/src/lib.rs)
* **Framework:** Anchor v0.30 (Rust)
* **Fungsi On-Chain:**
  1. `initialize_config`: Menetapkan ambang batas FHI II (kadar air maks 10%, minyak atsiri min 1.10% v/b, umur tanam 9 bln, keyakinan AI 90%).
  2. `register_batch`: Mendaftarkan batch lahan jahe (Petani).
  3. `record_harvest`: Mencatat tanggal panen, berat kilogram, dan hash foto rimpang (Petani).
  4. `submit_field_verification`: Sortasi kadar air & analisis deteksi cacat AI rimpang (Koperasi).
  5. `submit_lab`: Mengunggah hash CoA laboratorium & kadar minyak atsiri (QC Pabrik).
  6. `approve`: Konsensus multi-signature 2-dari-3 (QC wajib + Petani atau Koperasi) hingga status terkunci menjadi `Accepted`.
  7. `reject`: Penolakan batch dengan hash alasan (Koperasi atau QC).

---

## METODE 1: Deploy Lewat Solana Playground (Paling Cepat & Direkomendasikan untuk Windows)
Solana Playground adalah IDE resmi Solana berbasis web (*zero installation*). Anda tidak perlu menginstal Rust toolchain yang berat di Windows.

### Langkah-langkah (Hanya butuh 2 Menit):
1. **Buka Solana Playground:**
   Kunjungi: **[https://beta.solpg.io](https://beta.solpg.io)** di browser Anda (Chrome/Brave/Edge yang sudah terpasang ekstensi Phantom).

2. **Buat Proyek Baru:**
   * Di panel kiri, klik **+ New Project**.
   * Beri nama proyek: `jahepasti`.
   * Pilih framework: **Anchor (Rust)** $\rightarrow$ Klik **Create**.

3. **Salin Kode Program:**
   * Buka file `src/lib.rs` di Solana Playground.
   * Hapus isi defaultnya, lalu salin seluruh isi dari file lokal kita:
     [`solana-program/programs/jahepasti/src/lib.rs`](file:///d:/Blockchain/solana-program/programs/jahepasti/src/lib.rs)
   * Tempelkan (*paste*) ke editor Solana Playground.

4. **Hubungkan Wallet Phantom Anda (Saldo 2 SOL):**
   * Di pojok kiri bawah Solana Playground, klik tombol **Not Connected**.
   * Pilih **Phantom** (atau Wallet yang memiliki saldo 2 SOL Devnet Anda).
   * Setujui koneksi di popup Phantom. Pastikan jaringan di Playground adalah **Devnet** (ikon status hijau di pojok kiri bawah).

5. **Build Program:**
   * Klik tab **Build & Deploy** (ikon palu/roket di sidebar kiri).
   * Klik tombol **Build**.
   * Tunggu beberapa detik sampai muncul pesan `Build successful`.

6. **Deploy ke Solana Devnet:**
   * Masih di tab yang sama, klik tombol **Deploy**.
   * Ekstensi Phantom Anda akan memunculkan popup konfirmasi transaksi untuk membayar sewa akun (*rent-exempt* sekitar ~0.8 hingga ~1.5 SOL).
   * Klik **Confirm / Approve**.
   * Selesai! Playground akan menampilkan:
     ```
     Deployment successful. Program ID: <PROGRAM_ID_ANDA>
     ```

7. **Verifikasi di Solscan:**
   Buka URL: `https://solscan.io/account/<PROGRAM_ID_ANDA>?cluster=devnet` untuk melihat kontrak Solana Anda yang sudah aktif secara global di Devnet!

---

## METODE 2: Deploy Lewat Terminal / CLI (Solana CLI & Anchor)

Jika Anda sudah menginstal WSL / Ubuntu / Linux di Windows:

1. **Pastikan Solana CLI terhubung ke Devnet:**
   ```bash
   solana config set --url https://api.devnet.solana.com
   ```

2. **Import Wallet Anda ke CLI:**
   Ekspor Private Key dari Phantom, lalu simpan ke file `id.json`:
   ```bash
   solana-keygen recover 'prompt://' --outfile ~/.config/solana/id.json
   ```
   *(Ketikkan 12 kata Secret Recovery Phrase Phantom Anda saat diminta)*.

3. **Periksa Saldo:**
   ```bash
   solana balance
   ```
   *(Harus menampilkan 2 SOL atau lebih)*.

4. **Kompilasi & Deploy dengan Anchor:**
   ```bash
   cd d/Blockchain/solana-program
   anchor build
   anchor deploy
   ```
   Terminal akan mencetak `Program Id: <PROGRAM_ID_ANDA>`.

---

## Menghubungkan Program ID ke Web Dashboard Kita

Setelah program ter-deploy dan Anda mendapatkan `<PROGRAM_ID_ANDA>`:
1. Buka file [`web/.env`](file:///d:/Blockchain/web/.env)
2. Tambahkan baris:
   ```env
   NEXT_PUBLIC_JAHEPASTI_PROGRAM_ID="<PROGRAM_ID_ANDA>"
   ```
3. Restart server web Next.js (`npm run dev`).
