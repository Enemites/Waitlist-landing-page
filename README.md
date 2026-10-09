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
[parent waitlist flow](docs/PARENT-WAITLIST.md), plus the
[DMCA registration guide](docs/DMCA-REGISTRATION.md). Age groups are `<13`,
`13-18`, `19-20`, and `20+` (21 or older). Under-13 learners join through an email
invitation to their parent, who registers their own contact details. Joining requests
launch notifications; the original checkbox controls updates beyond the launch.
Apply `migrations/20261009_waitlist_parent_registration.sql` and the updated API/frontend
as one coordinated release. Configure server-only values from `.env.example` for
Resend invitations and daily expiry cleanup. Promotional email preparation also requires
a real operator name, postal address, and unsubscribe secret. This app has no launch
campaign sender or analytics pipeline; form records do not store new raw IP addresses.

```sh
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

Fonts are bundled locally; their licenses ship in `public/licenses/`.
