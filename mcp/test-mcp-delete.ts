import { handleDeleteForm, handleGetFormBySlug, handleListForms, getDbPool } from "../api/forms.js";

async function testMcpDeleteFlow() {
  const authHeader = "Bearer enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";

  console.log("1. Checking current forms list...");
  const listBefore = await handleListForms(authHeader);
  console.log("Forms before delete:", listBefore.data?.forms?.map((f: any) => ({ slug: f.slug, title: f.title })));

  console.log("\n2. Executing handleDeleteForm via MCP handler for slug 'customer-feedback'...");
  const deleteResult = await handleDeleteForm("customer-feedback", authHeader);
  console.log("Delete Result:", JSON.stringify(deleteResult, null, 2));

  console.log("\n3. Verifying form is gone via handleGetFormBySlug...");
  const getAfter = await handleGetFormBySlug("customer-feedback");
  console.log("Get Form After Delete:", JSON.stringify(getAfter, null, 2));

  console.log("\n4. Checking forms list after delete...");
  const listAfter = await handleListForms(authHeader);
  console.log("Forms count after delete:", listAfter.data?.count);

  const pool = getDbPool();
  await pool.end();
}

testMcpDeleteFlow().catch((err) => {
  console.error("Delete test failed:", err);
  process.exit(1);
});
