# JahePasti: Sistem Verifikasi Keaslian & Mutu Jahe Merah (AI + Solana Blockchain)

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-purple?logo=solana)](https://solscan.io/account/2ahgAPJf9QrTpS3BvmAVKGwB8Q91tuZjYniWTodYZfCL?cluster=devnet)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Rust](https://img.shields.io/badge/Anchor-Rust_0.30-orange?logo=rust)](https://www.anchor-lang.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**JahePasti** adalah prototipe sistem keterlacakan (*supply chain traceability*) dan penjaminan mutu rimpang jahe merah per batch dari lahan pertanian hingga pabrik jamu. Sistem mengintegrasikan **Kecerdasan Buatan (AI Computer Vision)** untuk inspeksi fisik sortasi rimpang dan **Smart Contract Solana (Anchor Rust)** untuk menjamin integritas catatan secara permanen (*immutable*) dan tidak dapat dimanipulasi sepihak.

> **Konteks Studi Kasus:** Rantai pasok jahe merah untuk bahan baku jamu dengan referensi konteks PT Industri Jamu dan Farmasi Sido Muncul Tbk (Semarang) menggunakan data simulasi publik dan acuan standar **Farmakope Herbal Indonesia Edisi II (FHI II)**.

---

## Informasi Kontrak On-Chain (Solana Devnet)

Program Solana Anchor resmi telah dikompilasi dan di-deploy ke jaringan Solana Devnet:

| Parameter | Detail On-Chain |
| :--- | :--- |
| **Cluster** | `Solana Devnet` |
| **Program ID** | [`2ahgAPJf9QrTpS3BvmAVKGwB8Q91tuZjYniWTodYZfCL`](https://solscan.io/account/2ahgAPJf9QrTpS3BvmAVKGwB8Q91tuZjYniWTodYZfCL?cluster=devnet) |
| **Status Program** | `Executable (Active On-Chain)` |
| **Verified Live Transaction** | [`2uJZJyGczuuSnjoiNstmk1uRK8VzFznyFc5q2D4GnXFWvzAe7Q4rh3hZ3iq8LXwg9koHT7k2uYkCgfJjsk8voGZG`](https://solscan.io/tx/2uJZJyGczuuSnjoiNstmk1uRK8VzFznyFc5q2D4GnXFWvzAe7Q4rh3hZ3iq8LXwg9koHT7k2uYkCgfJjsk8voGZG?cluster=devnet) |

---

## Fitur Utama

1. **Otentikasi Berbasis Peran Sejati (Role-Based Auth):**  
   Pemisahan hak akses ketat antara **Petani**, **Verifikator Koperasi**, **QC Pabrik**, dan **Admin**. Tidak ada tombol pintas ganti peran; pergantian akun mengharuskan pengguna menekan tombol *Logout* dan login kembali.
2. **Koneksi Phantom Wallet:**  
   Integrasi tombol **Connect Phantom** di navbar untuk melihat status akun dan saldo Devnet secara *live*.
3. **Standar Mutu Farmakope Herbal Indonesia II (FHI II):**  
   - Kadar air rimpang jahe maksimal **10.0%** (susut pengeringan).
   - Kadar minyak atsiri minimal **1.10% v/b**.
   - Masa tanam minimal **9 bulan** sebelum dipanen.
4. **Aturan Etika AI (UnderReview Routing):**  
   AI hanya memberikan indikasi awal. Jika keyakinan model $< 90\%$ atau rimpang berindikasi penyakit, sistem tidak langsung menolak batch, melainkan mengalihkan ke status `UnderReview` untuk peninjauan manusia yang kompeten.
5. **Konsensus 2-dari-3 (Multi-Signature):**  
   Status final `Accepted` hanya dapat disahkan jika ditandatangani oleh **QC Pabrik (Wajib)** ditambah salah satu dari **Petani** atau **Koperasi**.
6. **Halaman Publik & Cek Integritas (QR Konsumen):**  
   Konsumen dapat memindai kode QR batch tanpa login dan menguji keaslian data dengan tombol **"Cek Integritas Blockchain"** yang membandingkan hash data saat ini dengan catatan permanen di blok Solana.
7. **Penyimpanan Fleksibel (Supabase & Local Fallback):**  
   Mendukung database cloud PostgreSQL Supabase, serta dilengkapi *automatic local JSON persistence* sehingga aplikasi dapat langsung dijalankan tanpa setup database eksternal.

---

## Struktur Repositori

```
├── README.md                      # Dokumentasi Utama Proyek (GitHub)
├── solana-program/                # Smart Contract Solana (Anchor Rust)
│   ├── programs/jahepasti/src/
│   │   └── lib.rs                 # Program On-Chain (PDAs, Instructions, Events)
│   ├── Cargo.toml
│   ├── Anchor.toml
│   └── DEPLOY_GUIDE.md            # Panduan Deploy Solana Anchor
├── web/                           # Aplikasi Web Fullstack (Next.js 14 App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/             # Halaman Login Multi-Peran
│   │   │   ├── dashboard/         # Dasbor Utama & Form Aksi Peran
│   │   │   │   ├── register/      # Form Pendaftaran Batch Lahan (Petani)
│   │   │   │   └── batch/[id]/    # Detail Batch & Workflow Interaktif
│   │   │   ├── batch/[id]/        # Halaman Publik / Scan QR (Konsumen)
│   │   │   └── api/               # REST API Handlers & AI Placeholder
│   │   ├── lib/
│   │   │   ├── auth.ts            # Manajemen Sesi & Akun Demo
│   │   │   ├── db.ts              # Abstraksi DB (Prisma / Local JSON)
│   │   │   ├── crypto.ts          # Kalkulasi SHA-256 Hash
│   │   │   └── solana.ts          # Client Notarisasi Solana Devnet
│   │   └── components/
│   │       ├── Navbar.tsx         # Navigasi & Logout
│   │       ├── WalletConnect.tsx  # Integrasi Phantom Wallet Devnet
│   │       └── StatusBadge.tsx    # Indikator Status Batch
│   ├── prisma/
│   │   └── schema.prisma          # Skema Model Database
│   ├── .env.example               # Contoh Konfigurasi Environment Lengkap
│   └── package.json
└── contracts/                     # Modul Smart Contract EVM (Hardhat / Solidity)
    ├── contracts/JahePastiTracker.sol
    └── test/JahePastiTracker.test.ts # 19 Automated Tests (T1 s/d T8)
```

---

## Panduan Menjalankan Proyek

### 1. Prasyarat
* [Node.js](https://nodejs.org/) v20+ atau v22+
* Ekstensi Browser [Phantom Wallet](https://phantom.app/) (Diatur ke mode Devnet)

### 2. Instalasi & Menjalankan Web Dashboard
```bash
# 1. Masuk ke direktori web
cd web

# 2. Salin file environment
cp .env.example .env

# 3. Instal dependensi
npm install

# 4. Jalankan server development
npm run dev
```
Buka browser di **`http://localhost:3000`**.

---

## Akun Demo untuk Pengujian Antarmuka

Gunakan kredensial berikut untuk menguji masing-masing peran pada halaman `/login`:

| Peran | Email | Kata Sandi | Wewenang Aksi |
| :--- | :--- | :--- | :--- |
| **Petani** | `petani@sambirata.id` | `petani123` | Mendaftarkan batch lahan baru & mencatat hasil panen serta foto. |
| **Koperasi** | `koperasi@sambirata.id` | `koperasi123` | Sortasi kadar air & menjalankan deteksi cacat AI rimpang. |
| **QC Pabrik** | `qc@sidomuncul.co.id` | `qc123` | Memasukkan hasil uji lab CoA, kadar minyak atsiri, dan approve 2-of-3. |
| **Admin** | `admin@jahepasti.id` | `admin123` | Melihat seluruh batch, log audit, dan kontrol sistem. |

*(Tersedia tombol bantuan satu-klik pada form login untuk mengisi kredensial secara otomatis).*

---

## Integrasi Database Supabase (Opsional)

Secara default, aplikasi langsung aktif dan persisten menggunakan *embedded storage* (`web/data/store.json`).  
Jika Anda ingin menghubungkannya ke **Supabase**:

1. Buat proyek baru di [Supabase](https://supabase.com/).
2. Masuk ke **Project Settings $\rightarrow$ Database $\rightarrow$ Connection String (Mode: Transaction)**.
3. Salin URI koneksi dan tempelkan ke file `web/.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
4. Jalankan sinkronisasi skema Prisma:
   ```bash
   cd web
   npx prisma db push
   ```

---

## Integrasi Wallet Payer Solana

Setiap transaksi yang dilakukan di web dapat dikonfigurasi untuk ditandatangani oleh wallet deployer Anda:
1. Buka ekstensi **Phantom** $\rightarrow$ **Settings** $\rightarrow$ Klik Akun Anda $\rightarrow$ **Export Private Key**.
2. Masukkan Base58 private key tersebut ke file `web/.env`:
   ```env
   SOLANA_PAYER_PRIVATE_KEY="base58_private_key_phantom_anda"
   ```
3. Transaksi akan langsung ditandatangani oleh akun wallet Phantom pengembang Anda di Solana Devnet.

---

## Lisensi
Proyek ini didistribusikan di bawah lisensi **MIT**.
