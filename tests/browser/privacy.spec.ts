import { test, expect } from "@playwright/test";

test("age check precedes contact fields and under-13 cannot submit", async ({ page }) => {
  const submissions: string[] = [];
  page.on("request", (r) => { if (r.method() === "POST") submissions.push(r.url()); });
  await page.goto("/arena");
  await expect(page.getByPlaceholder("Enter your name")).toHaveCount(0);
  await page.getByLabel("What is your age group?").selectOption("under-13");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("cannot accept");
  await expect(page.getByPlaceholder("Enter your name")).toHaveCount(0);
  expect(submissions).toEqual([]);
});

test("eligible signup sends age and affirmative email consent with no device metadata", async ({ page }) => {
  let submitted: any;
  await page.route("**/api/waitlist", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { success: true } });
  });
  await page.goto("/arena");
  await page.getByLabel("What is your age group?").selectOption("13-17");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByPlaceholder("Enter your name").fill("Test Learner");
  await page.getByPlaceholder("+62 8...").fill("+620000000000");
  await page.getByPlaceholder("name@example.com").fill("test@example.com");
  const consent = page.getByRole("checkbox");
  await expect(consent).not.toBeChecked();
  await consent.check({ force: true });
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("You are on the list, Test Learner.")).toBeVisible();
  expect(submitted.age_group).toBe("13-17");
  expect(submitted.receive_updates).toBe(true);
  expect(submitted).not.toHaveProperty("client_meta");
});

test("initial landing page fonts are local and YouTube connects only after permission", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (r) => { if (new URL(r.url()).hostname !== "127.0.0.1") externalRequests.push(r.url()); });
  await page.goto("/arena");
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Allow YouTube and play video" }).scrollIntoViewIfNeeded();
  expect(externalRequests).toEqual([]);
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ body: "Video test placeholder" }));
  await page.getByRole("button", { name: "Allow YouTube and play video" }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com/);
  expect(externalRequests.some((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toBe(false);
});

test("questionnaire age check precedes downloading and displaying questions", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/forms/**", async (route) => {
    calls++;
    await route.fulfill({ json: { success: true, form: { id: "test", slug: "test", title: "Test Survey", questions: [{ id: "email", label: "Your email", type: "email", required: true }], is_active: true } } });
  });
  await page.goto("/form/test");
  await expect(page.getByLabel("What is your age group?")).toBeVisible();
  expect(calls).toBe(0);
  await page.getByLabel("What is your age group?").selectOption("18-20");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Test Survey" })).toBeVisible();
  // React StrictMode can fetch twice in development; both must follow the gate.
  expect(calls).toBeGreaterThan(0);
});
