import { handleCreateForm } from "../api/forms.js";
import { getDbPool } from "../api/db.js";

async function createEnemitesSampleForm() {
  const authHeader = "Bearer enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";

  const formPayload = {
    title: "Survei Kepuasan & Kebutuhan Pengguna enemites",
    description:
      "Selamat datang di survei resmi enemites! Masukan Anda sangat berharga untuk membantu kami menyempurnakan fitur otomasi cerdas dan pengalaman penggunaan platform.",
    slug: "customer-feedback",
    expires_at: null, // endless
    questions: [
      {
        id: "name_and_role",
        label: "Nama Lengkap & Role / Posisi Anda",
        type: "text",
        placeholder: "Contoh: Budi Santoso - Product Manager",
        required: true,
      },
      {
        id: "nps_score",
        label: "Seberapa besar kemungkinan Anda merekomendasikan enemites ke rekan kerja atau startup lain?",
        type: "rating",
        min: 1,
        max: 10,
        required: true,
        helperText: "Skala 1 (Sangat Tidak Mungkin) hingga 10 (Sangat Mungkin)",
      },
      {
        id: "favorite_features",
        label: "Fitur apa yang paling penting bagi alur kerja Anda?",
        type: "checkbox",
        required: false,
        options: [
          "Otomasi Pembuatan Form via AI Agent",
          "Integrasi MCP Server untuk Agent",
          "Analisis Sentimen & Insight Otomatis",
          "Custom Branding & Dynamic Links",
          "Pengaturan Masa Berlaku Form (Endless / Expiring)",
        ],
      },
      {
        id: "current_pain_points",
        label: "Tantangan atau kendala terbesar yang Anda hadapi saat membuat survei atau mengumpulkan feedback customer saat ini?",
        type: "textarea",
        placeholder: "Ceritakan kendala atau kebutuhan spesifik Anda di sini...",
        required: false,
      },
      {
        id: "email",
        label: "Email Aktif Anda",
        type: "email",
        placeholder: "nama@domain.com",
        required: true,
        helperText: "Kami akan mengirimkan ringkasan perkembangan fitur terbaru ke email ini.",
      },
    ],
  };

  const result = await handleCreateForm(formPayload as any, authHeader);
  console.log("Creation Result:", JSON.stringify(result, null, 2));

  const pool = getDbPool();
  await pool.end();
}

createEnemitesSampleForm().catch((err) => {
  console.error("Error creating sample form:", err);
  process.exit(1);
});
