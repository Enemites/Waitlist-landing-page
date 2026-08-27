import { handleCreateForm, handleDeleteForm } from "../api/forms.js";
import { getDbPool } from "../api/db.js";

async function createEnemitesEnglishSampleForm() {
  const authHeader = "Bearer enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";

  // First delete previous version if exists
  await handleDeleteForm("customer-feedback", authHeader).catch(() => {});

  const formPayload = {
    title: "enemites User Discovery & Product Feedback",
    description:
      "Help us shape the future of autonomous agent forms and survey automation. This feedback survey takes approximately 2 minutes to complete.",
    slug: "customer-feedback",
    expires_at: null, // endless
    questions: [
      {
        id: "name_and_role",
        label: "Your Full Name and Role / Title",
        type: "text",
        placeholder: "e.g. Alex Rivera, Lead Product Designer",
        required: true,
      },
      {
        id: "nps_score",
        label: "How likely are you to recommend enemites to your colleagues or engineering team?",
        type: "rating",
        min: 1,
        max: 10,
        required: true,
        helperText: "Scale from 1 (Extremely Unlikely) to 10 (Extremely Likely)",
      },
      {
        id: "priority_features",
        label: "Which capabilities are most crucial for your workflow?",
        type: "checkbox",
        required: false,
        options: [
          "Autonomous Agent Form Generation via MCP",
          "Automated Sentiment Analysis & AI Synthesis",
          "Custom Branding & Dynamic URL Slugs",
          "Configurable Expiration Windows & Lifetime Rules",
          "Instant Webhook & Real-time Integrations",
        ],
      },
      {
        id: "primary_challenges",
        label: "What is your biggest bottleneck or frustration with current customer feedback tools?",
        type: "textarea",
        placeholder: "Share your thoughts or specific use-cases...",
        required: false,
      },
      {
        id: "work_email",
        label: "Work Email Address",
        type: "email",
        placeholder: "you@company.com",
        required: true,
        helperText: "We'll keep you posted on core product updates and feature releases.",
      },
    ],
  };

  const result = await handleCreateForm(formPayload as any, authHeader);
  console.log("English Form Created Result:", JSON.stringify(result, null, 2));

  const pool = getDbPool();
  await pool.end();
}

createEnemitesEnglishSampleForm().catch((err) => {
  console.error("Error creating sample form:", err);
  process.exit(1);
});
