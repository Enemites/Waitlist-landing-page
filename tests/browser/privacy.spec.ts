import { test, expect } from "@playwright/test";

test("under-13 can invite a parent without sharing their own contact details", async ({ page }) => {
  let submitted: any;
  await page.route("**/api/parent-permission", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 202, json: { success: true, message: "Ask your parent to check their inbox for the invitation." } });
  });
  await page.goto("/arena");
  await expect(page.getByPlaceholder("Enter your name")).toHaveCount(0);
  await page.getByLabel("What is your age group?").selectOption("<13");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Join with your parent or guardian" })).toBeVisible();
  await expect(page.getByPlaceholder("Enter your name")).toHaveCount(0);
  await page.getByPlaceholder("parent@example.com").fill("parent@example.com");
  await page.getByRole("button", { name: "Invite my parent" }).click();
  await expect(page.getByRole("status")).toContainText("inbox");
  expect(submitted).toEqual({ action: "request", parent_email: "parent@example.com", age_group: "<13" });
});

test("signup requests launch notifications while keeping the original optional beyond-launch checkbox", async ({ page }) => {
  let submitted: any;
  await page.route("**/api/waitlist", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { success: true } });
  });
  await page.goto("/arena");
  await page.getByLabel("What is your age group?").selectOption("13-18");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByPlaceholder("Enter your name").fill("Test Learner");
  await page.getByPlaceholder("+62 8...").fill("+620000000000");
  await page.getByPlaceholder("name@example.com").fill("test@example.com");
  const consent = page.getByRole("checkbox");
  await expect(consent).not.toBeChecked();
  await expect(page.getByText("Want to receive updates from us beyond the launch?")).toBeVisible();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("You are on the list, Test Learner.")).toBeVisible();
  expect(submitted.age_group).toBe("13-18");
  expect(submitted.receive_updates).toBe(false);
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
  await page.getByLabel("What is your age group?").selectOption("19-20");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Test Survey" })).toBeVisible();
  // React StrictMode can fetch twice in development; both must follow the gate.
  expect(calls).toBeGreaterThan(0);
});

test("parent invitation verifies email, requires permission, and submits adult contact details", async ({ page }) => {
  const token = "a".repeat(64);
  let submitted: any;
  await page.route("**/api/parent-permission", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ action: "inspect", token });
    await route.fulfill({ json: { success: true, invitation: { parent_email: "parent@example.com", age_group: "<13" } } });
  });
  await page.route("**/api/waitlist", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { success: true } });
  });
  await page.goto(`/arena/parent-waitlist#${token}`);
  await expect(page.getByRole("heading", { name: "Parent or guardian information" })).toBeVisible();
  await expect(page.getByPlaceholder("name@example.com")).toHaveValue("parent@example.com");
  await expect(page.getByPlaceholder("name@example.com")).toHaveAttribute("readonly", "");
  expect(page.url()).not.toContain(token);
  await page.getByPlaceholder("Enter your name").fill("Test Parent");
  await page.getByPlaceholder("+62 8...").fill("+620000000000");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Please confirm that you are the learner's parent or legal guardian and agree to the waitlist notice.")).toBeVisible();
  expect(submitted).toBeUndefined();
  await page.getByRole("checkbox", { name: /I am this learner's parent/ }).check();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("You are on the list, Test Parent.")).toBeVisible();
  expect(submitted).toEqual({ name: "Test Parent", number: "+620000000000", email: "parent@example.com", age_group: "<13", receive_updates: false, parent_token: token, parent_permission: true });
});

test("expired parent invitation exposes no registration form", async ({ page }) => {
  await page.route("**/api/parent-permission", (route) => route.fulfill({ status: 400, json: { success: false, message: "This invitation is invalid or expired." } }));
  await page.goto(`/arena/parent-waitlist#${"a".repeat(64)}`);
  await expect(page.getByRole("alert")).toContainText("expired");
  await expect(page.getByPlaceholder("Enter your name")).toHaveCount(0);
});
