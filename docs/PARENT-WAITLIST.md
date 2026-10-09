# Pendaftaran waitlist melalui orang tua

Implementasi ini mengizinkan learner `<13` mengikuti waitlist melalui orang tua. Formulir tidak mengumpulkan nama, telepon, atau email anak. Kelompok usia `13-18` saat ini memakai pendaftaran biasa. Batas alur orang tua mengikuti pembahasan sebelumnya, yaitu `<13`; kebutuhan izin remaja menurut wilayah perlu ditetapkan sebelum pengumpulan data produk untuk wilayah tersebut. Kelompok `19-20` dan `20+` (21 atau lebih) tidak tumpang tindih.

## Alur

1. Pengunjung memilih `<13`, lalu melihat form undangan orang tua, bukan pesan larangan.
2. `POST /api/parent-permission` dengan `action: request` menerima hanya email orang tua dan kelompok usia untuk tujuan undangan. Server menyimpan hash token acak 256-bit, bukan token mentah, dengan expiry tujuh hari. Pembatasan pengiriman: cooldown sepuluh menit per email; request baru ditahan jika ada 60 atau lebih undangan pending yang dibuat dalam satu jam terakhir. Pembatasan agregat ini perkiraan, bukan penghitung pengiriman dengan jaminan atomik. Ini pengurangan abuse, bukan janji pencegahan sempurna.
3. Resend mengirim pemberitahuan tujuan dan link `/arena/parent-waitlist#TOKEN`. Token di fragment tidak masuk request URL server atau referrer. Halaman menghapus fragment dari address bar dan memakai referrer policy `no-referrer`. Membuka tautan saja tidak menyetujui pendaftaran.
4. Orang tua membaca pemberitahuan, memasukkan **nama dan nomor kontak mereka sendiri**, dan memakai email undangan yang tidak bisa diubah. Checkbox izin waitlist terpisah dari checkbox kabar tambahan main. Izin meliputi pemberitahuan launch/early access; bukan profil atau akun anak, konten dewasa, atau pengumpulan learning data.
5. `POST /api/waitlist` memerlukan token valid, email dan kelompok usia yang cocok, serta `parent_permission: true`. Validasi ulang dilakukan di server dalam transaksi dengan row lock. Timestamp, versi notice, actor `parent`, dan permintaan launch disimpan. Token dikonsumsi hanya setelah INSERT berhasil. Token kedaluwarsa, dipalsukan, diulang setelah berhasil, atau dipakai dengan email lain ditolak. Tidak menyimpan IP mentah di record.
6. Cron harian menghapus undangan yang kedaluwarsa. Penyimpanan maksimum tujuh hari ditambah interval cron satu hari. Konfigurasi dan monitoring `CRON_SECRET` diperlukan. Kegagalan delivery menghapus reservasi token tersebut dan mengembalikan error, bukan sukses palsu.

## Apa yang diverifikasi

Alur membuktikan akses ke email undangan dan mencatat deklarasi bahwa pendaftar adalah parent/legal guardian. Tidak mengklaim mengecek umur melalui KTP, membuktikan hubungan keluarga, atau memberi verifiable parental consent universal untuk seluruh pemrosesan data anak. Desain menggunakan pendaftaran oleh orang tua dengan kontak orang tua, bukan child account. Dalam [FAQ FTC A.8](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), COPPA membedakan pengumpulan online dari anak dan dari orang tua/adult. Email orang tua yang dikumpulkan untuk mengundang mereka tetap memiliki tujuan terbatas dan expiry.

Jika saat launch produk mulai meminta data pribadi **dari anak**, lakukan pemberitahuan dan metode izin yang sesuai sebelum pengumpulan itu. Email-plus hanya salah satu opsi bersyarat untuk penggunaan internal; alur waitlist ini tidak diberi label email-plus karena tidak mengimplementasikan izin luas bagi child account. [Panduan FTC Mei 2026](https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business). Persyaratan negara lain dan remaja tetap bergantung pada hukum serta dasar pemrosesannya.

## Email dan hak orang tua

Undangan adalah pesan terbatas untuk memulai pendaftaran. Bila penerima tidak mengharapkannya, mereka bisa mengabaikan email; tidak tercipta waitlist entry atau subscription. Support menerima permintaan deletion pending invitation, review/correction/deletion waitlist, atau penarikan izin. Email promosi launch dan update harus memuat alamat pos serta unsubscribe; memilih unsubscribe menekan keduanya. Checkbox `receive_updates` hanya untuk kabar di luar launch dan default false, sama seperti main.

## Konfigurasi sebelum rilis

Isi variabel server `.env.example`: database, `PUBLIC_SITE_URL`, `RESEND_API_KEY`, `WAITLIST_EMAIL_FROM`, `CRON_SECRET`. Gunakan domain sender terverifikasi; atur tracking email undangan tidak aktif. Integrasi tidak mengirim email nyata sebelum konfigurasi tersedia. Nama/alamat operator dan unsubscribe secret diperlukan sebelum integrasi campaign promosi memakai `lib/marketing.ts`. Jalankan migrasi, deployment API/frontend, dan cron sebagai satu release. Lakukan uji inbox/domain nyata sesudah setup tersedia.
