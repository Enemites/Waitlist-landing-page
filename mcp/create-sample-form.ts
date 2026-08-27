import { handleCreateForm, handleSubmitForm, handleGetFormSubmissions } from "../api/forms.js";
import { getDbPool } from "../api/forms.js";

async function createAndTestEnemitesForm() {
  const authHeader = "Bearer enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";

  console.log("1. Creating dynamic form with dropdown select question...");
  const formPayload = {
    title: "ENEMITES Product Discovery & Customer Feedback",
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
        label: "How likely are you to recommend ENEMITES to your colleagues or engineering team?",
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

  const createRes = await handleCreateForm(formPayload as any, authHeader);
  console.log("Create Form Result:", JSON.stringify(createRes, null, 2));

  console.log("\n2. Testing submission with simulated IP, device, and location metadata...");
  const submitRes = await handleSubmitForm(
    "customer-feedback",
    {
      responses: {
        full_name_and_role: "Alex Rivera, Lead Product Designer",
        company_stage: "Seed funded startup",
        nps_score: 10,
        priority_features: [
          "Autonomous Agent Form Generation via MCP",
          "Real-time IP & Country Geolocation Tracking",
        ],
        primary_challenges: "Need AI agents to automatically deploy forms and analyze responses.",
        work_email: "alex@enemites.com",
      },
      respondent_info: {
        timezone: "Asia/Jakarta",
        screenResolution: "1920x1080",
        language: "en-US",
      },
    },
    {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "x-forwarded-for": "103.28.12.89",
        "x-vercel-ip-country": "ID",
        "x-vercel-ip-city": "Jakarta",
        "x-vercel-ip-country-region": "JK",
      },
    }
  );
  console.log("Submit Result:", JSON.stringify(submitRes, null, 2));

  console.log("\n3. Fetching submissions to verify geolocation and device storage in Supabase...");
  const subs = await handleGetFormSubmissions("customer-feedback", authHeader);
  console.log("Recorded Submissions:", JSON.stringify(subs, null, 2));

  const pool = getDbPool();
  await pool.end();
}

createAndTestEnemitesForm().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
