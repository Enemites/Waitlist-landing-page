# Pendaftaran waitlist melalui orang tua

Implementasi ini mengizinkan learner `<13` mengikuti waitlist melalui orang tua. Formulir tidak mengumpulkan nama, telepon, atau email anak. Kelompok usia `13-18` saat ini memakai pendaftaran biasa. Batas alur orang tua mengikuti pembahasan sebelumnya, yaitu `<13`; kebutuhan izin remaja menurut wilayah perlu ditetapkan sebelum pengumpulan data produk untuk wilayah tersebut. Kelompok `19-20` dan `20+` (21 atau lebih) tidak tumpang tindih.

## Alur

1. Pengunjung memilih `<13`, lalu melihat form undangan orang tua, bukan pesan larangan.
2. `POST /api/parent-permission` dengan `action: request` menerima hanya email orang tua dan kelompok usia untuk tujuan undangan. Server menyimpan hash token acak 256-bit, bukan token mentah, dengan expiry tujuh hari. Pembatasan pengiriman: cooldown sepuluh menit per email; request baru ditahan jika ada 60 atau lebih undangan pending yang dibuat dalam satu jam terakhir. Pembatasan agregat ini perkiraan, bukan penghitung pengiriman dengan jaminan atomik. Ini pengurangan abuse, bukan janji pencegahan sempurna.
3. Resend mengirim pemberitahuan tujuan dan link `/realms/parent-waitlist#TOKEN`. Token di fragment tidak masuk request URL server atau referrer. Halaman menghapus fragment dari address bar dan memakai referrer policy `no-referrer`. Membuka tautan saja tidak menyetujui pendaftaran.
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

### Nilai Vercel untuk Enemites Realms

- `PUBLIC_SITE_URL=https://enemites.com/realms` didukung, termasuk dengan trailing slash. Nilai `https://enemites.com` juga didukung. Kode mengambil origin HTTPS agar tautan tidak menjadi `/realms/realms`. URL dengan query, fragment, kredensial, atau path lain ditolak sebelum penyimpanan undangan dan pengiriman email. URL ini bukan rahasia dan boleh disimpan sebagai configuration environment variable biasa.
- `WAITLIST_EMAIL_FROM=Enemites Realms <no-reply@notify.enemites.com>` mengikuti format sender Resend. Domain `notify.enemites.com` harus sudah terverifikasi. Nilai sender bukan API key.
- `RESEND_API_KEY`, `DATABASE_URL`, dan `CRON_SECRET` adalah rahasia server. Jangan memakai prefix `VITE_`, memasukkannya ke Git, atau mengirim nilainya melalui chat. Pilih environment Vercel yang sesuai, lalu redeploy agar nilai baru dipakai deployment tersebut.

Email undangan berbahasa Inggris dalam HTML dan plain text. Keduanya berisi tiga tautan terpisah: review website `/realms`, pendaftaran `/realms/parent-waitlist#TOKEN`, dan privacy notice `/realms/privacy-policy`. Mengunjungi website atau membuka undangan tidak mencatat persetujuan. Token baru dikonsumsi setelah orang tua menyelesaikan pendaftaran.

### Mematikan tracking di Resend

Pengaturan ini berada di Resend, bukan Vercel. Click tracking mengganti tautan dengan redirect milik penyedia email; open tracking menambahkan gambar pelacak untuk mencatat pembukaan email. Alur undangan tidak memerlukan keduanya.

1. Buka dashboard Resend, pilih **Domains**, lalu domain pengirim **notify.enemites.com**.
2. Cari pengaturan tracking untuk domain tersebut. Pastikan **Click Tracking** dan **Open Tracking** dalam keadaan **off/disabled**, lalu simpan jika diminta. Bila sudah off, tidak perlu perubahan lagi.
3. Kirim undangan uji ke inbox yang dikendalikan sendiri. Pastikan tautan website dan undangan langsung menuju domain aplikasi, fragment token tetap tersedia ketika formulir dibuka, dan tidak ada gambar open-tracking dari Resend di sumber email. Keberhasilan API Resend saja tidak membuktikan email masuk inbox.

Tracking merupakan pengaturan domain; perubahan berlaku untuk pengiriman lain dari domain yang sama. API domain resmi Resend mendukung `PATCH /domains/{domain_id}` dengan `{"click_tracking":false,"open_tracking":false}`. Endpoint ini memerlukan izin pengelolaan domain; kunci sending-only aplikasi tidak cukup. Jangan menambahkan field tracking buatan ke payload `POST /emails`, karena opsi tersebut bukan bagian dari kontrak send-email yang digunakan aplikasi. Kode ini tidak mengklaim bahwa pengaturan Resend sudah dimatikan hanya karena HTML email tidak berisi tracker.

### Memeriksa database Neon sebelum migrasi

Pilih project, branch, dan database yang benar di Neon. Pengaturan Vercel tidak otomatis memberikan koneksi database kepada workspace pengembangan atau tool Neon di chat lain. Perubahan isi email dan dukungan URL `/realms` tidak memerlukan migrasi tambahan. Skema undangan dari migrasi `migrations/20261009_waitlist_parent_registration.sql` tetap diperlukan.

Mulai dengan pemeriksaan metadata ini di SQL Editor; query tidak membaca data kontak:

```sql
SELECT to_regclass('public.waitlist') AS waitlist,
       to_regclass('public.enemites_forms') AS forms,
       to_regclass('public.enemites_form_submissions') AS submissions,
       to_regclass('public.waitlist_parent_requests') AS parent_requests;

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('waitlist', 'waitlist_parent_requests')
ORDER BY table_name, ordinal_position;
```

Jika tabel dasar `waitlist`, `enemites_forms`, atau `enemites_form_submissions` belum tersedia, jangan mengarang skema atau menjalankan migrasi terhadap database lain. Migrasi ini memperluas skema aplikasi yang sudah ada, bukan bootstrap database kosong. Jika skema undangan belum diterapkan, jalankan file migrasi lengkap dalam transaksi setelah memeriksa skema dan data yang sudah ada. Verifikasi kolom izin orang tua, tabel `waitlist_parent_requests`, indeks expiry, constraint, dan trigger sesudahnya. Gunakan `tests/database.sql` hanya pada branch uji terisolasi dengan skema yang kompatibel; fixture sintetisnya di-rollback.
