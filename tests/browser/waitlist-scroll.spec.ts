import { test, expect } from "@playwright/test";

test("Product definition copy font-size is 17px on desktop and 14px on mobile", async ({ page }) => {
  // Desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/realms");
  const definitionParagraph = page.locator(".product-definition .product-container > p:not(.product-eyebrow)");
  await expect(definitionParagraph).toHaveCSS("font-size", "17px");

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/realms");
  await expect(definitionParagraph).toHaveCSS("font-size", "14px");
});

test("Casual path Request early access button scrolls waitlist form into view on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/realms?entry=casual");

  // Wait for casual entry mode
  const casualButton = page.locator(".casual-access");
  await expect(casualButton).toBeVisible();

  // Click Request early access
  await casualButton.click();

  // Wait for smooth scroll animation to finish
  await page.waitForTimeout(1000);

  // Check waitlist form container is in viewport
  const form = page.locator("#waitlist-form-container");
  await expect(form).toBeVisible();
  const box = await form.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeLessThan(844 * 0.7); // Form top is nicely framed in top/middle part of screen, not below fold
});

test("Competitive path Get match updates button scrolls waitlist form into view on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/realms?entry=competitive");

  const competitiveButton = page.locator(".competitive-waitlist-link");
  await expect(competitiveButton).toBeVisible();

  // Click Get match updates
  await competitiveButton.click();

  // Wait for smooth scroll animation to finish
  await page.waitForTimeout(1000);

  // Check waitlist form container is in viewport
  const form = page.locator("#waitlist-form-container");
  await expect(form).toBeVisible();
  const box = await form.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeLessThan(844 * 0.7);
});
