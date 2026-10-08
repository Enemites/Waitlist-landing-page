# Waitlist Introduction Page

Project ini berisi ekstraksi halaman **Introduction** ke dalam project terpisah tanpa Lottie. Fokusnya tetap mempertahankan desain, animasi, dan section yang ada pada halaman introduction asli.

## Menjalankan dengan Docker

```bash
docker compose up --build
```

Akses di `http://localhost:5173`.

## Menjalankan secara lokal (tanpa Docker)

```bash
npm install
npm run dev
```

## Catatan

Asset background tidak disertakan di repo. Simpan file gambar `cosmic-planet-background.jpg` ke:

```
waitlist/public/assets/cosmic-planet-background.jpg
```

File tersebut akan dipanggil oleh halaman introduction melalui path `/assets/cosmic-planet-background.jpg`.

## Privacy and legal-risk remediation

See [the audit and rollout steps](docs/LEGAL-RISK-AUDIT.md) and
[DMCA registration guide](docs/DMCA-REGISTRATION.md). New API submissions require
an eligible `age_group`; apply the versioned privacy migration with the updated
API as one coordinated release. Marketing sender configuration is server-only
and incomplete until a real operator name and postal address are supplied.

```sh
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

Fonts are bundled locally; their licenses ship in `public/licenses/`.
