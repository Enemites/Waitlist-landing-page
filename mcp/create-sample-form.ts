import { handleCreateForm, handleDeleteForm, getDbPool } from "../api/forms.js";

async function updateSampleFormNaturalTitle() {
  const authHeader = "Bearer enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";

  // Delete previous
  await handleDeleteForm("customer-feedback", authHeader).catch(() => {});

  const formPayload = {
    title: "Enemites Product Discovery & Customer Feedback",
    description:
      "Help us shape the future of autonomous agent forms and survey automation. This feedback survey takes approximately 2 minutes to complete.",
    slug: "customer-feedback",
    expires_at: null, // endless
    questions: [
      {
        id: "full_name_and_role",
        label: "Your Full Name & Role",
        type: "text",
        placeholder: "e.g. Alex Rivera, Lead Product Designer",
        required: true,
      },
      {
        id: "company_stage",
        label: "What stage best describes your current company or project?",
        type: "select",
        placeholder: "-- Select company stage --",
        required: true,
        options: [
          "Pre-seed / Idea stage",
          "Seed funded startup",
          "Series A/B Growth company",
          "Enterprise / Established business",
          "Individual developer / Creator",
        ],
        helperText: "Select the option that best matches your organization size.",
      },
      {
        id: "nps_score",
        label: "How likely are you to recommend Enemites to your colleagues or engineering team?",
        type: "rating",
        min: 1,
        max: 10,
        required: true,
        helperText: "Scale from 1 (Extremely Unlikely) to 10 (Extremely Likely)",
      },
      {
        id: "priority_features",
        label: "Which capabilities are most critical for your team?",
        type: "checkbox",
        required: false,
        options: [
          "Autonomous Agent Form Generation via MCP",
          "Real-time IP & Country Geolocation Tracking",
          "Custom Branding & Dynamic URL Routing",
          "Configurable Lifetime & Expiration Windows",
          "Automated Sentiment Analysis & AI Summaries",
        ],
      },
      {
        id: "primary_challenges",
        label: "What is your biggest bottleneck or frustration with existing customer feedback tools?",
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

  const res = await handleCreateForm(formPayload as any, authHeader);
  console.log("Updated Form Result:", JSON.stringify(res, null, 2));

  const pool = getDbPool();
  await pool.end();
}

updateSampleFormNaturalTitle().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
