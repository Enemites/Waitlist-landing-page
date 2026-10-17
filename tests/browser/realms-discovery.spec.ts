import { test, expect } from "@playwright/test";
import { REALMS_ENTITY_ID } from "../../shared/seo";
import { REALMS_GUIDES } from "../../shared/realms-guides";

test("product page gives a direct definition and links to the official English guides", async ({ page }) => {
  await page.goto("/realms");
  const definition = page.locator(".product-definition");
  await expect(definition).toContainText("Enemites Realms is a simulation environment in development around an internal AI world model");
  await expect(definition.getByRole("link", { name: "Explore the learning loop" })).toHaveAttribute("href", "/realms/blogs/how-enemites-realms-works");
  await expect(definition).toContainText("core simulation engine");
  await expect(definition).toContainText("AI imagination");
  await definition.getByRole("link", { name: "Read the Realms guide" }).click();
  await expect(page).toHaveURL(/\/realms\/blogs\/what-is-enemites-realms$/);
  await expect(page.locator("h1")).toHaveText("What is Enemites Realms?");
  await expect(page.locator(".blog-facts")).toContainText("An internal AI world model in development");
  await expect(page.getByRole("heading", { name: "What does AI imagination mean in Enemites Realms?", exact: true })).toBeVisible();
});

test("the former translated guide redirects to the English canonical and preserves query and fragment", async ({ page, request }) => {
  const response = await request.get("/realms/blogs/apa-itu-enemites-realms/?source=legacy", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/realms/blogs/what-is-enemites-realms?source=legacy");
  await page.goto("/realms/blogs/apa-itu-enemites-realms?source=legacy#faq");
  await expect(page).toHaveURL(/\/realms\/blogs\/what-is-enemites-realms\?source=legacy#faq$/);
  await expect(page.locator("h1")).toHaveText("What is Enemites Realms?");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://enemites.com/realms/blogs/what-is-enemites-realms");
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
  const graph = JSON.parse((await page.locator("#site-structured-data").textContent())!)["@graph"];
  expect(graph.find((node: any) => node["@type"] === "Product")["@id"]).toBe(REALMS_ENTITY_ID);
  for (const node of graph.filter((node: any) => node.inLanguage)) expect(node.inLanguage).toBe("en");
  await expect(page.locator(".blog-article-topline")).toHaveText(/Blogs Overview.*The Realms Journal/);
  await page.getByRole("link", { name: "Blogs Overview", exact: true }).first().click();
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
});

test("each guide has visible FAQ answers matching its markup and working official references", async ({ page, request }) => {
  for (const post of REALMS_GUIDES) {
    await page.goto(`/realms/blogs/${post.slug}`);
    const graph = JSON.parse((await page.locator("#site-structured-data").textContent())!)["@graph"];
    const faq = graph.find((node: any) => node["@type"] === "FAQPage");
    for (const entry of faq.mainEntity) {
      await expect(page.locator("#faq").getByRole("heading", { name: entry.name, exact: true })).toBeVisible();
      await expect(page.locator("#faq")).toContainText(entry.acceptedAnswer.text);
    }
    for (const reference of post.references!) {
      await expect(page.locator(".blog-references").getByRole("link", { name: reference.label, exact: true })).toHaveAttribute("href", reference.path);
      expect((await request.get(reference.path)).status()).toBe(200);
    }
  }
});

test("the AI source index is a genuine text file and contains all new public guides", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/text\/plain/);
  const text = await response.text();
  expect(text).toContain("Enemites Realms is a simulation environment in development around an internal AI world model");
  for (const post of REALMS_GUIDES) expect(text).toContain(`https://enemites.com/realms/blogs/${post.slug}`);
  expect(text).not.toMatch(/parent-waitlist|\/form\/|<html|apa-itu-enemites-realms|Language: id/);
});
