// Shared by browser and API: no date of birth or identity document is collected.
export const PRIVACY_NOTICE_VERSION = "2026-10-09";
export const AGE_OPTIONS = [
  { value: "<13", label: "<13" },
  { value: "13-18", label: "13–18" },
  { value: "19-20", label: "19–20" },
  { value: "20+", label: "21 or older" },
] as const;
export function isEligibleAgeGroup(value: unknown): value is string {
  return AGE_OPTIONS.some((option) => option.value === value);
}
export function requiresParentRegistration(ageGroup: string) { return ageGroup === "<13"; }
export const MARKETING_CONSENT_TEXT = "Want to receive updates from us beyond the launch?";
export const PARENT_WAITLIST_NOTICE = "I am this learner's parent or legal guardian. I am registering my own contact details to receive Enemites launch and early access notifications for them. This permission covers the waitlist only; it does not authorize a child account, learning data collection, or adult content. I can withdraw this request or permission by contacting support@enemites.com, and stop promotional email using the unsubscribe link.";
