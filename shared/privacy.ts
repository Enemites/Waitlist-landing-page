// Shared by browser and API: no date of birth or identity document is collected.
export const PRIVACY_NOTICE_VERSION = "2026-10-08";
export const AGE_OPTIONS = [
  { value: "under-13", label: "Under 13" },
  { value: "13-17", label: "13–17" },
  { value: "18-20", label: "18–20" },
  { value: "20+", label: "21 or older" },
] as const;
export function isEligibleAgeGroup(value: unknown): value is string {
  return value === "13-17" || value === "18-20" || value === "20+";
}
export const MARKETING_CONSENT_TEXT = "Email me Enemites launch announcements, early access invitations, and product news. Optional; unsubscribe at any time.";
