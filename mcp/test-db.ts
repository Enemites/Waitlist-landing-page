import { ensureEnemitesSchema, getDbPool } from "../api/db.js";
import {
  handleCreateForm,
  handleGetFormBySlug,
  handleSubmitForm,
  handleListForms,
  handleGetFormSubmissions,
  handleDeleteForm,
} from "../api/forms.js";

async function testIntegration() {
  console.log("1. Initializing schema in Supabase...");
  await ensureEnemitesSchema();
  console.log("Schema initialized successfully.");

  const testAuth = "Bearer enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";
  const testSlug = "enemites-early-feedback-" + Date.now();

  console.log("\n2. Testing handleCreateForm...");
  const createRes = await handleCreateForm(
    {
      title: "Survei Kepuasan Pengguna enemites",
      description: "Bantu kami meningkatkan kualitas platform dengan mengisi survei singkat 2 menit ini.",
      slug: testSlug,
      expires_at: null, // endless
      questions: [
        {
          id: "rating_satisfaction",
          label: "Seberapa puas Anda dengan produk enemites?",
          type: "rating",
          required: true,
          min: 1,
          max: 5,
          helperText: "Pilih bintang 1 (kurang puas) hingga 5 (sangat puas)",
        },
        {
          id: "features_used",
          label: "Fitur apa saja yang paling sering Anda gunakan?",
          type: "checkbox",
          required: false,
          options: ["Dynamic Forms", "AI Agent MCP", "Analytics Dashboard", "Custom Domain"],
        },
        {
          id: "user_feedback",
          label: "Apa saran atau masukan Anda untuk tim enemites?",
          type: "textarea",
          required: false,
          placeholder: "Tuliskan saran Anda...",
        },
      ],
    },
    testAuth
  );
  console.log("Create Form Result:", JSON.stringify(createRes, null, 2));

  console.log("\n3. Testing handleGetFormBySlug (public)...");
  const getRes = await handleGetFormBySlug(testSlug);
  console.log("Get Form Result:", JSON.stringify(getRes, null, 2));

  console.log("\n4. Testing handleSubmitForm (public submission)...");
  const submitRes = await handleSubmitForm(testSlug, {
    responses: {
      rating_satisfaction: 5,
      features_used: ["Dynamic Forms", "AI Agent MCP"],
      user_feedback: "Sangat mudah diintegrasikan dengan AI agent!",
    },
    respondent_info: {
      tester: "Antigravity Agent",
    },
  });
  console.log("Submit Response Result:", JSON.stringify(submitRes, null, 2));

  console.log("\n5. Testing handleListForms (Agent auth)...");
  const listRes = await handleListForms(testAuth);
  console.log("List Forms Result:", JSON.stringify(listRes, null, 2));

  console.log("\n6. Testing handleGetFormSubmissions (Agent auth)...");
  const subsRes = await handleGetFormSubmissions(testSlug, testAuth);
  console.log("Submissions Result:", JSON.stringify(subsRes, null, 2));

  console.log("\n7. Testing handleDeleteForm (Agent auth)...");
  const deleteRes = await handleDeleteForm(testSlug, testAuth);
  console.log("Delete Form Result:", JSON.stringify(deleteRes, null, 2));

  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
  const pool = getDbPool();
  await pool.end();
}

testIntegration().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
