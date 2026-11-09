# PRD: Sistem Verifikasi Keaslian dan Mutu Jahe Merah (AI + Blockchain)

Nov 9, 2026 · @Daniyal Faridudin Nayf

## 1. Ringkasan produk

**JahePasti** (nama kerja) adalah aplikasi web yang memeriksa mutu rimpang jahe merah per batch, mencatat hasilnya di blockchain, dan menampilkan riwayat batch lewat kode QR.

- **Studi kasus:** rantai pasok jahe merah untuk industri jamu, dengan PT Industri Jamu dan Farmasi Sido Muncul Tbk (Semarang) sebagai konteks. Aplikasi tidak memakai data internal perusahaan.
- **Yang dibuat:** prototipe fungsional dengan data contoh, bukan sistem produksi.
- **Prinsip:** AI hanya memberi indikasi awal. Keputusan akhir lewat pengesahan manusia dan bukti laboratorium. Blockchain menjaga catatan agar tidak bisa diubah diam-diam, tetapi tidak menjamin kebenaran data awal.
- **Pengguna:** petani atau kelompok tani, verifikator koperasi, QC pabrik, dan konsumen yang memindai QR.

## 2. Masalah, tujuan, dan ukuran keberhasilan

Mutu dan keaslian jahe merah sulit dipastikan karena dibeli dari banyak petani dan pengepul. Jahe bisa tercampur jenis lain, kurang kering, rusak, atau asal lahannya tidak jelas, dan petani yang jujur tidak punya bukti.

| Tujuan | Ukuran keberhasilan prototipe (target awal, sesuaikan) |
| --- | --- |
| Satu batch dapat ditelusuri dari kebun sampai QR | Demo end-to-end berjalan dari pendaftaran batch sampai halaman QR tanpa kesalahan |
| Rimpang cacat terdeteksi sejak sortasi | Akurasi, recall kelas "unhealthy", dan confusion matrix dilaporkan pada data uji; ambang keyakinan 90% jadi batas otomatis |
| Catatan tidak bisa diubah diam-diam | Perubahan data off-chain terdeteksi lewat hash yang tidak cocok pada skenario uji |
| Aturan verifikasi jelas dan bisa dijelaskan | Setiap batch menampilkan alasan lolos atau tidak per indikator |
| Konsumen mudah memeriksa | Halaman QR terbuka di ponsel tanpa login |

## 3. Pengguna dan peran

Empat peran bertanda tangan dan satu peran publik. Hak akses dijaga di backend dan di smart contract.

| Peran | Siapa (simulasi) | Boleh | Tidak boleh |
| --- | --- | --- | --- |
| Petani / ketua kelompok tani | Anggota kelompok tani Desa Sambirata | Mendaftarkan batch, mengisi tanggal tanam dan panen, mengunggah foto, menandatangani batch | Mengubah hasil AI, hasil lab, atau status akhir |
| Verifikator koperasi | Petugas sortasi koperasi | Menjalankan inspeksi foto dengan AI, mencatat kadar air, menyetujui atau menandai perlu tinjau | Mengisi hasil lab |
| QC pabrik | Petugas QC pabrik | Mengunggah CoA, mengisi kadar minyak atsiri, menerima atau menolak batch | Mengubah data panen |
| Admin | Tim pengembang saat demo | Mengelola akun dan peran, mengatur ambang aturan, melihat log audit | Mengubah catatan yang sudah ada di blockchain |
| Konsumen | Publik, tanpa login | Memindai QR dan melihat riwayat batch | Mengubah data apa pun |

## 4. Ruang lingkup

MVP cukup membuktikan satu alur lengkap. Hal di luar daftar MVP boleh disebut sebagai pengembangan lanjutan di laporan.

**Masuk MVP (wajib dibuat)**

- Login dengan peran, dan hak akses per peran
- Pendaftaran batch dan form panen
- Unggah foto rimpang dan analisis AI (deteksi cacat)
- Input kadar air (manual atau sensor simulasi)
- Verifikasi koperasi dan input hasil lab (CoA)
- Persetujuan 2 dari 3 pihak, lalu pencatatan di smart contract
- Skor mutu dan alasan per indikator
- Kode QR dan halaman publik riwayat batch
- Log audit dan pengecekan integritas hash

**Pengembangan lanjutan (tidak wajib)**

- Sensor IoT sungguhan (ESP32 dan moisture analyzer)
- Klasifikasi varietas jahe merah dengan dataset sendiri
- Analisis tekstur (GLCM) untuk kematangan
- Skor reputasi kelompok tani dan insentif otomatis
- Aplikasi mobile native

**Sengaja tidak dibuat**

- Integrasi dengan sistem nyata atau data internal Sido Muncul
- Pembayaran
- Vonis "palsu" atau "asli" dari satu ciri atau satu model AI

## 5. Alur pengguna utama

&#91;embedded content: alur pengguna · 2 gerbang, 1 putaran ulang\]

Batch hanya diterima setelah lolos inspeksi koperasi dan penilaian akhir QC. Hasil AI yang meragukan tidak menolak batch, melainkan mengirimnya ke tinjauan manual lalu kembali ke inspeksi.

## 6. Kebutuhan fungsional

19 kebutuhan dalam 7 modul. "Wajib" harus jalan saat demo, "Sebaiknya" dikerjakan bila waktu cukup, "Opsional" boleh dilewati.

| ID | Modul | Kebutuhan | Peran | Prioritas | Kriteria penerimaan |
| --- | --- | --- | --- | --- | --- |
| F1 | Akun | Login dan hak akses per peran | Semua | Wajib | Menu hanya sesuai peran; akses ke fitur peran lain ditolak (403) |
| F2 | Batch | Daftarkan batch (ID unik, lahan, koordinat GPS, tanggal tanam) | Petani | Wajib | Batch tersimpan berstatus Registered dan ID tampil |
| F3 | Batch | Catat panen (tanggal panen, berat) | Petani | Wajib | Umur tanam dihitung otomatis dalam bulan; panen sebelum 9 bulan diberi peringatan |
| F4 | Batch | Unggah 1 sampai 5 foto rimpang | Petani, koperasi | Wajib | Hash SHA-256 tiap foto dihitung saat unggah dan disimpan |
| F5 | Inspeksi | Analisis foto dengan AI | Koperasi | Wajib | Keluaran: label, keyakinan, rasio cacat; keyakinan di bawah 90% menandai batch Perlu tinjau |
| F6 | Inspeksi | Input kadar air | Koperasi | Wajib | Nilai 0 sampai 100% tersimpan beserta sumbernya (manual atau sensor simulasi) |
| F7 | Inspeksi | Keputusan verifikator: setuju, perlu tinjau, atau tolak, dengan catatan | Koperasi | Wajib | Keputusan tercatat dengan waktu dan penandatangan |
| F8 | Lab | Unggah CoA (PDF) dan isi kadar minyak atsiri | QC | Wajib | Hash CoA tersimpan; nilai di bawah ambang menandai indikator gagal |
| F9 | Lab | Terima atau tolak batch | QC | Wajib | Penerimaan mengikuti syarat tanda tangan di bab 7 |
| F10 | Skor | Hitung skor dan alasan per indikator | Sistem | Wajib | Skor 0 sampai 100 dan status lolos atau gagal tiap indikator tampil di detail batch |
| F11 | Blockchain | Catat hash foto, hash CoA, skor, dan status ke smart contract | Sistem | Wajib | Transaksi sukses; nomor blok dan hash transaksi tampil |
| F12 | Blockchain | Cek integritas data | Semua, publik | Wajib | Tombol membandingkan hash data saat ini dengan data on-chain; ketidakcocokan tampil merah |
| F13 | QR | Buat kode QR per batch | Koperasi, QC | Wajib | QR membuka halaman publik batch |
| F14 | QR | Halaman publik riwayat batch | Konsumen | Wajib | Menampilkan asal lahan, tanggal, hasil AI, hasil lab, status blockchain; tanpa data pribadi |
| F15 | Admin | Kelola pengguna dan peran | Admin | Wajib | Admin dapat menambah akun dan memberi peran |
| F16 | Admin | Atur ambang aturan | Admin | Sebaiknya | Perubahan tercatat di log; batch lama tetap memakai ambang saat diverifikasi |
| F17 | Admin | Log audit | Admin | Wajib | Setiap aksi tercatat: siapa, kapan, apa |
| F18 | Admin | Ekspor laporan batch (PDF atau CSV) | Admin | Opsional | File berisi data batch dan hasil verifikasi |
| F19 | Umum | Bahasa Indonesia dan tampilan mobile | Semua | Wajib | Semua halaman terbaca dan bisa dipakai di layar ponsel |

## 7. Aturan verifikasi dan skor

Batch diterima bila skornya minimal 80 dan dua indikator wajib (kadar air dan minyak atsiri) lulus. Bobot dan ambang di bawah adalah usulan awal: angka FHI II perlu dicocokkan dengan dokumen aslinya, dan bobot sebaiknya disepakati dengan narasumber.

| No | Indikator | Data masukan | Aturan lolos (default) | Metode | Bobot | Wajib |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Ciri jahe merah | Checklist verifikator (warna kulit, ruas, aroma) dan foto | Semua ciri terkonfirmasi; bila ada model varietas, keyakinan 90% atau lebih | Observasi, AI | 15 | Tidak |
| 2 | Kematangan | Tanggal tanam dan panen | Umur tanam 9 bulan atau lebih | Logbook | 15 | Tidak |
| 3 | Integritas rimpang | Foto, hasil AI | Rasio cacat di bawah 3% dan keyakinan AI 90% atau lebih | Observasi, AI | 20 | Tidak |
| 4 | Kadar air | Alat ukur atau input manual | 10,0% atau kurang (susut pengeringan FHI II) | Alat ukur | 20 | Ya |
| 5 | Minyak atsiri | CoA laboratorium | 1,10% v/b atau lebih (FHI II) | Uji lab | 30 | Ya |

### Status batch

| Status | Arti | Dipindahkan oleh | Syarat |
| --- | --- | --- | --- |
| Registered | Batch didaftarkan | Petani | Data lahan lengkap |
| Harvested | Panen dicatat | Petani | Tanggal panen, berat, dan minimal 1 foto |
| FieldVerified | Lolos inspeksi lapangan | Koperasi | Indikator 2 dan 3 lulus, kadar air tercatat |
| UnderReview | Perlu tinjau manual | Koperasi, QC | Keyakinan AI di bawah 90% atau ada perbedaan pendapat |
| LabApproved | Hasil lab lolos | QC | CoA diunggah, indikator 4 dan 5 lulus |
| Accepted | Diterima pabrik | QC | Skor 80 atau lebih dan 2 dari 3 tanda tangan |
| Rejected | Ditolak | Koperasi, QC | Indikator wajib gagal; alasan wajib diisi |

**Tanda tangan 2 dari 3:** ketua kelompok tani, verifikator koperasi (membawa hasil AI), dan QC pabrik. Tanda tangan QC wajib, ditambah salah satu dari dua lainnya.

**Aturan etika:** gagal di indikator AI saja tidak pernah langsung menolak batch, tetapi memindahkannya ke UnderReview. Tinjauan ulang dilakukan pihak lain yang kompeten, dan prosedurnya dirumuskan bersama narasumber.

## 8. Modul AI

Untuk MVP, AI cukup satu model: deteksi rimpang sehat atau bermasalah dari foto. Dataset yang sudah ada mendukung itu, tetapi belum mendukung klasifikasi varietas.

| Model | Tujuan | Data | Keluaran | Status |
| --- | --- | --- | --- | --- |
| Deteksi cacat dan penyakit | Menilai kesehatan rimpang dari foto | Roboflow Universe ginger-diseases-detection (501 gambar, kelas healthy dan unhealthy) dan repositori Mesay-Gemeda (MobileNet pre-trained dan Custom CNN sebagai pembanding) | Label, keyakinan, rasio cacat | MVP |
| Validasi sensor | Menandai nilai kadar air yang tidak masuk akal | Aturan batas fisik dan perubahan antar pembacaan | Normal atau anomali | MVP (berbasis aturan) |
| Klasifikasi varietas | Membedakan jahe merah dari jenis lain | Perlu dataset sendiri: sekitar 100 foto per kelas (merah, gajah, emprit), difoto bersama narasumber | Varietas dan keyakinan | Lanjutan |
| Kematangan (tekstur GLCM) | Menilai kerutan kulit rimpang | Perlu dataset berlabel umur panen | Muda atau matang | Lanjutan |
| Kemometrika FTIR | Mendeteksi adulterasi lewat spektrum | Data spektrum dari lab dan jurnal | Dibahas konseptual di laporan | Di luar MVP |

**Layanan inferensi.** Layanan terpisah (FastAPI) menerima foto, mengembalikan JSON berisi `label`, `confidence`, dan `defect_ratio`. Hash SHA-256 foto dihitung sebelum inferensi dan disimpan bersama hasilnya.

**Evaluasi.** Bagi data 70% latih, 15% validasi, 15% uji. Laporkan akurasi, presisi, recall kelas "unhealthy", dan confusion matrix. Bandingkan Custom CNN dan MobileNet, lalu pilih yang lebih baik di data uji.

**Batasan yang harus ditulis di laporan.**

- 501 gambar tergolong kecil, dan hasilnya belum tentu berlaku pada foto lapangan Anda sendiri. Tambahkan foto sendiri bila bisa.
- Dataset ini tentang penyakit, bukan keaslian atau varietas, jadi AI tidak boleh dipresentasikan sebagai pendeteksi "jahe palsu".
- Keyakinan di bawah 90% selalu berujung peninjauan manusia.

## 9. Blockchain dan smart contract

Satu smart contract (Solidity dengan OpenZeppelin AccessControl) menyimpan status dan hash tiap batch. Untuk demo, jalankan di jaringan lokal Hardhat; testnet publik (misalnya Polygon Amoy) bersifat opsional. Karena Solidity tidak punya bilangan desimal, angka disimpan dikali 100 (kadar air 8,60% disimpan sebagai 860).

| Fungsi | Dipanggil oleh | Isi |
| --- | --- | --- |
| registerBatch | FARMER | Mendaftarkan batchId dan hash data lahan |
| recordHarvest | FARMER | Tanggal panen, umur tanam, hash foto |
| submitFieldVerification | COOPERATIVE | Skor AI, rasio cacat, kadar air, keputusan |
| submitLab | QC | Hash CoA dan kadar minyak atsiri |
| approve | FARMER, COOPERATIVE, QC | Satu tanda tangan per peran; status Accepted saat syarat 2 dari 3 terpenuhi |
| reject | COOPERATIVE, QC | Menolak dengan hash alasan |
| getBatch | Publik (view) | Membaca seluruh catatan batch |

Event yang dipancarkan: `BatchRegistered`, `HarvestRecorded`, `FieldVerified`, `LabSubmitted`, `BatchApproved`, `BatchAccepted`, `BatchRejected`. Status hanya boleh maju sesuai tabel bab 7, tidak boleh mundur.

| Disimpan on-chain | Disimpan off-chain (database dan penyimpanan file) |
| --- | --- |
| batchId, status, waktu | Foto asli dan PDF CoA |
| Hash foto dan hash CoA | Nama, kontak, dan profil pengguna |
| Skor, rasio cacat, kadar air, kadar minyak | Detail GPS lahan dan catatan bebas |
| Alamat penandatangan | Log aktivitas aplikasi |

Data pribadi tidak boleh masuk ke blockchain karena catatannya permanen.

## 10. Arsitektur dan tech stack

&#91;embedded content: arsitektur sistem · 6 komponen\]

Aplikasi web hanya berbicara dengan backend. Backend memanggil layanan AI, menyimpan data dan file, lalu menulis hash dan status ke smart contract.

| Lapisan | Pilihan yang disarankan | Alasan |
| --- | --- | --- |
| Web | Next.js (React) dengan TypeScript | Satu bahasa untuk tampilan dan backend; mudah dibuat responsif |
| Backend | Route handler Next.js, atau Node.js dengan Express | Satu repositori dan satu bahasa; cukup untuk MVP |
| AI | Python, FastAPI, TensorFlow/Keras (CNN dan MobileNet) | Sesuai repositori acuan; latih di Google Colab |
| Database | PostgreSQL (bisa lewat Supabase) | Relasi antar tabel jelas dan mudah dibuat |
| File | Folder lokal atau Supabase Storage | Foto dan PDF tidak perlu masuk blockchain |
| Blockchain | Solidity, Hardhat, OpenZeppelin, ethers.js | Tes otomatis dan jaringan lokal gratis |
| QR | Pustaka qrcode | Cukup membuat QR dari URL batch |

## 11. Model data dan API

Sembilan tabel cukup untuk seluruh alur.

| Tabel | Kolom utama |
| --- | --- |
| users | id, nama, email, password\_hash, role, wallet\_address, created\_at |
| batches | id (batchId), farmer\_id, nama\_lahan, lat, lng, tanggal\_tanam, tanggal\_panen, berat\_kg, status, skor, created\_at |
| photos | id, batch\_id, file\_path, sha256, uploaded\_by, created\_at |
| ai\_results | id, photo\_id, label, confidence, defect\_ratio, model\_version, created\_at |
| inspections | id, batch\_id, kadar\_air, sumber\_kadar\_air, checklist\_json, keputusan, catatan, inspector\_id, created\_at |
| lab\_results | id, batch\_id, minyak\_atsiri, coa\_path, coa\_sha256, qc\_id, created\_at |
| approvals | id, batch\_id, role, signer\_address, tx\_hash, created\_at |
| rule\_config | id, kunci, nilai, updated\_by, updated\_at |
| audit\_logs | id, user\_id, aksi, batch\_id, detail\_json, created\_at |

| Metode | Path | Peran | Fungsi |
| --- | --- | --- | --- |
| POST | /api/auth/login | Semua | Masuk dan menerima token |
| POST | /api/batches | Petani | Daftarkan batch |
| GET | /api/batches, /api/batches/:id | Sesuai peran | Daftar dan detail batch |
| POST | /api/batches/:id/harvest | Petani | Catat panen |
| POST | /api/batches/:id/photos | Petani, koperasi | Unggah foto dan hitung hash |
| POST | /api/batches/:id/inspect | Koperasi | Panggil layanan AI, simpan kadar air dan keputusan |
| POST | /api/batches/:id/lab | QC | Simpan CoA dan kadar minyak atsiri |
| POST | /api/batches/:id/approve | Petani, koperasi, QC | Tanda tangan persetujuan |
| POST | /api/batches/:id/reject | Koperasi, QC | Tolak dengan alasan |
| GET | /api/batches/:id/verify | Publik | Bandingkan hash saat ini dengan data on-chain |
| GET | /api/public/batches/:id | Publik | Data halaman QR tanpa data pribadi |
| POST | /ai/predict | Internal (backend) | Layanan AI mengembalikan label, keyakinan, rasio cacat |
| GET, PATCH | /api/admin/rules, /api/admin/users | Admin | Kelola ambang aturan dan pengguna |
| GET | /api/admin/audit | Admin | Baca log audit |

## 12. Daftar layar

Sepuluh layar. Rancang tampilan mobile terlebih dahulu karena petani dan petugas koperasi bekerja di lapangan.

| Kode | Layar | Pengguna | Isi utama |
| --- | --- | --- | --- |
| L1 | Login | Semua | Email, kata sandi, pesan kesalahan |
| L2 | Dasbor batch | Petani, koperasi, QC | Daftar batch, filter status, tombol batch baru |
| L3 | Batch baru | Petani | Nama lahan, GPS (tombol lokasi saat ini), tanggal tanam |
| L4 | Panen dan foto | Petani | Tanggal panen, berat, unggah 1 sampai 5 foto dengan pratinjau |
| L5 | Inspeksi koperasi | Koperasi | Foto, hasil AI (label, keyakinan, rasio cacat), kadar air, checklist ciri, keputusan dan catatan |
| L6 | Input lab | QC | Unggah CoA, kadar minyak atsiri, tombol terima atau tolak |
| L7 | Detail batch | Semua peran | Garis waktu status, skor, hasil per indikator, hash transaksi, tombol Cek integritas |
| L8 | Cetak QR | Koperasi, QC | QR batch siap unduh atau cetak |
| L9 | Halaman publik | Konsumen | Asal lahan, tanggal panen dan umur tanam, hasil AI, hasil lab, status dan nomor blok; tanpa login |
| L10 | Admin | Admin | Pengguna dan peran, ambang aturan, log audit |

Urutan isi L9 (dari atas): nama produk dan status batch, asal lahan, panen dan umur tanam, verifikasi AI lapangan, hasil laboratorium, verifikasi blockchain beserta tombol Cek integritas. Angka contoh untuk demo harus diberi label "data simulasi".

## 13. Kebutuhan non-fungsional, keamanan, dan etika

| Kategori | Kebutuhan |
| --- | --- |
| Keamanan akses | Kata sandi disimpan sebagai hash; token sesi berumur pendek; hak akses diperiksa di backend dan di smart contract |
| Kunci blockchain | Kunci privat hanya di file .env yang tidak masuk repositori; akun demo dibedakan dari akun uji |
| Integritas | Semua unggahan diberi hash SHA-256; hash tercatat sebelum data dianggap final |
| Privasi | Hanya hash dan angka hasil yang masuk on-chain; halaman publik tidak menampilkan nama atau kontak petani |
| Keterlacakan | Setiap aksi tercatat di log audit dan tidak bisa dihapus lewat antarmuka |
| Kegunaan | Bahasa Indonesia, tampilan mobile, tombol besar, dan unggah foto yang tetap jalan di sinyal lemah |
| Kinerja | Halaman publik terbuka cepat di ponsel; inferensi AI per foto selesai dalam hitungan detik pada laptop biasa (ukur dan laporkan waktu aktual) |
| Keterulangan | Satu perintah untuk menjalankan seluruh sistem lokal; data contoh (seed) tersedia agar demo bisa diulang |
| Etika | Narasumber memberi persetujuan tertulis sebelum wawancara dan kontribusinya diakui; informasi rahasia komunitas atau perusahaan tidak dipublikasikan tanpa izin |
| Kejujuran klaim | Semua angka simulasi diberi label; AI disebut indikasi awal; sistem tidak menyatakan produk palsu dari satu ciri atau satu pendapat |

## 14. Rencana pengujian dan skenario demo

Delapan skenario uji. T1 sekaligus menjadi alur demo utama, dan T5 adalah yang paling meyakinkan untuk menjawab "mengapa blockchain".

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan |
| --- | --- | --- | --- |
| T1 | Jalur normal | Petani daftar dan panen, koperasi inspeksi, QC input lab, persetujuan, buka QR | Status Accepted; halaman QR terbuka; Cek integritas hijau |
| T2 | Keyakinan AI rendah | Unggah foto buram atau bukan jahe | Status UnderReview, bukan Rejected otomatis |
| T3 | Kadar air melebihi batas | Input 12% | Indikator 4 gagal dan alasan tampil; batch tidak bisa Accepted |
| T4 | Minyak atsiri kurang | CoA dengan nilai 0,9% | Indikator 5 gagal |
| T5 | Manipulasi data | Ubah skor langsung di database | Cek integritas merah karena hash tidak cocok dengan on-chain |
| T6 | Peran tidak berwenang | Akun petani memanggil input lab | Ditolak API (403) dan transaksi kontrak revert |
| T7 | Panen terlalu muda | Tanggal panen kurang dari 9 bulan | Peringatan muncul dan indikator 2 gagal |
| T8 | QR tidak dikenal | Buka batchId yang tidak ada | Halaman "batch tidak ditemukan", tanpa galat server |

**Uji model AI.** Laporkan akurasi, presisi, recall kelas "unhealthy", confusion matrix, dan 5 contoh salah klasifikasi beserta dugaan penyebabnya.

**Uji smart contract.** Tulis tes Hardhat untuk tiap peran, tiap transisi status yang sah, transisi mundur yang harus ditolak, dan aturan 2 dari 3.

## 15. Rencana pengerjaan dan checklist

Urutan ini mengerjakan bagian yang paling berisiko lebih dulu (kontrak dan AI), lalu antarmuka. Centang sendiri seiring kemajuan.

**Fase 0: persiapan**

- [ ] Putuskan nama aplikasi, anggota tim, dan pembagian tugas
- [ ] Selesaikan wawancara minimal 1 narasumber, dengan persetujuan tertulis
- [ ] Cocokkan angka FHI II dan data referensi dengan dokumen aslinya
- [ ] Kumpulkan foto jahe sendiri (disarankan, untuk menambah dataset)

**Fase 1: smart contract dan backend dasar**

- [ ] Siapkan repositori dengan folder web, ai, dan contracts
- [ ] Tulis smart contract dan tes Hardhat (peran, transisi status, 2 dari 3)
- [ ] Buat database sesuai bab 11
- [ ] Buat login dan hak akses per peran
- [ ] Buat API batch, foto, inspeksi, lab, dan persetujuan

**Fase 2: AI**

- [ ] Latih Custom CNN dan MobileNet di Colab dengan dataset Roboflow
- [ ] Evaluasi, bandingkan, dan pilih model
- [ ] Bungkus model terpilih menjadi layanan FastAPI /ai/predict

**Fase 3: antarmuka**

- [ ] Layar L1 sampai L7 (alur utama)
- [ ] Pembuat QR (L8) dan halaman publik (L9)
- [ ] Layar admin (L10)

**Fase 4: integrasi**

- [ ] Hubungkan backend ke smart contract (ethers.js)
- [ ] Buat fitur Cek integritas
- [ ] Siapkan data contoh (seed) untuk demo, berlabel simulasi

**Fase 5: uji dan dokumen**

- [ ] Jalankan skenario T1 sampai T8 dan catat hasilnya
- [ ] Rekam video demo
- [ ] Perbarui laporan LaTeX dengan hasil uji, metrik AI, dan batasan sistem
- [ ] Siapkan jawaban pertanyaan presentasi, terutama "mengapa blockchain" dan "bagaimana mencegah data palsu"

## 16. Risiko, asumsi, dan pertanyaan terbuka

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Dataset kecil dan tidak mewakili foto lapangan | AI sering keliru | Tambah foto sendiri; ambang 90%; tinjauan manusia; tulis batasannya di laporan |
| Data awal salah atau dipalsukan (garbage in) | Catatan permanen berisi data salah | Tanda tangan 2 dari 3, hash foto, dan sensor terikat perangkat sebagai pengembangan lanjutan |
| Izin atau data dari Sido Muncul tidak diperoleh | Tidak ada data perusahaan | Pakai data simulasi dan sumber publik; Sido Muncul hanya konteks |
| Waktu terbatas | Fitur tidak selesai | Kerjakan yang "Wajib" dulu; lewati "Opsional" |
| Blockchain terlalu rumit | Pengerjaan tersendat | Pakai Hardhat lokal; testnet publik hanya bila sempat |
| Angka standar keliru | Aturan verifikasi salah | Cocokkan dengan FHI II asli sebelum dikunci |

**Asumsi:** semua data demo adalah simulasi; pengguna memakai browser modern di ponsel atau laptop; satu jaringan blockchain lokal cukup untuk demo.

**Pertanyaan terbuka untuk Anda:**

- Apa nama aplikasi finalnya (JahePasti hanya nama kerja)?
- Cukup jaringan lokal, atau perlu testnet publik untuk presentasi?
- Dataset Roboflow saja cukup, atau Anda akan menambah foto sendiri?
- Kapan tenggatnya, dan siapa mengerjakan bagian apa?
- Apakah wawancara narasumber sudah terjadwal?
