import { useState, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import AgeGate from "./AgeGate";
import ParentWaitlistInvite from "./ParentWaitlistInvite";
import { isEligibleAgeGroup, requiresParentRegistration, MARKETING_CONSENT_TEXT, PARENT_WAITLIST_NOTICE } from "../../shared/privacy";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface FormData {
  name: string;
  number: string;
  email: string;
  age_group: string;
  receive_updates: boolean;
}

interface FormErrors {
  name?: string;
  number?: string;
  email?: string;
  age_group?: string;
  general?: string;
}

export function EligibleWaitlistForm({
  ageGroup,
  className = "",
  onSuccessCallback,
  parentInvitation,
}: {
  ageGroup: string;
  className?: string;
  onSuccessCallback?: () => void;
  parentInvitation?: { token: string; email: string };
}) {
  const [parentPermission, setParentPermission] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    number: "",
    email: parentInvitation?.email || "",
    age_group: ageGroup,
    receive_updates: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ name: string; email: string; timestamp: string }>({
    name: "",
    email: "",
    timestamp: "",
  });

  const nameId = useId();
  const numberId = useId();
  const emailId = useId();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.number.trim()) {
      newErrors.number = "Phone number is required";
    } else if (formData.number.replace(/\D/g, "").length < 6) {
      newErrors.number = "Please enter a valid phone number";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!isEligibleAgeGroup(formData.age_group)) {
      newErrors.age_group = "Please select an age group";
    }
    if (parentInvitation && !parentPermission) newErrors.general = "Please confirm that you are the learner's parent or legal guardian and agree to the waitlist notice.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          number: formData.number.trim(),
          email: formData.email.trim(),
          age_group: formData.age_group,
          receive_updates: formData.receive_updates,
          ...(parentInvitation ? { parent_token: parentInvitation.token, parent_permission: parentPermission } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          if (data.field === "email") {
            setErrors({
              email: data.message || "This email is already registered on the waitlist.",
              general: data.message || "This email is already registered on the waitlist.",
            });
          } else if (data.field === "number") {
            setErrors({
              number: data.message || "This phone number is already registered on the waitlist.",
              general: data.message || "This phone number is already registered on the waitlist.",
            });
          } else {
            setErrors({
              general: data.message || "This email or phone number is already registered on the waitlist.",
            });
          }
          return;
        }

        setErrors({
          general: data.message || "Unable to process registration. Please try again.",
        });
        return;
      }

      // Success
      setSubmittedData({
        name: formData.name.trim(),
        email: formData.email.trim(),
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      });
      setIsSuccess(true);
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch {
      setErrors({
        general: "Connection failed. Please check your network and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      number: "",
      email: parentInvitation?.email || "",
      age_group: ageGroup,
      receive_updates: false,
    });
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <div className={`waitlist-form w-full max-w-2xl mx-auto ${className}`}>
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="border border-[#253632] bg-[#101B1C] p-6 sm:p-12 text-left"
          >
            {/* Header / Monospace Status */}
            <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-[#253632]">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#C4ED6C]" />
                <span className="nova-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C4ED6C] font-medium">
                  Entry Confirmed
                </span>
              </div>
              <span className="nova-mono text-[10px] sm:text-[11px] tracking-wider text-[#9AA6A4]">
                TIME {submittedData.timestamp || "REC"}
              </span>
            </div>

            {/* Main Headline */}
            <div className="pt-6 sm:pt-8 pb-4 sm:pb-6">
              <h3 className="nova-display text-xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#EDF1EF]">
                You are on the list, {submittedData.name}.
              </h3>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-[15px] leading-relaxed text-[#9AA6A4] max-w-lg">
                Your entry has been recorded for the upcoming Enemites Arena simulation batch. We will email you about the launch and early access. Additional updates follow your checkbox preference.
              </p>
            </div>

            {/* Spec / Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#253632] border border-[#253632] my-4 sm:my-6">
              <div className="bg-[#0D1517] p-3 sm:p-4">
                <p className="nova-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#9AA6A4]">Registry Status</p>
                <p className="nova-mono text-xs sm:text-sm text-[#EDF1EF] mt-1 font-medium">Active · Priority Queue</p>
              </div>
              <div className="bg-[#0D1517] p-3 sm:p-4">
                <p className="nova-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#9AA6A4]">Dispatch Channel</p>
                <p className="nova-mono text-xs sm:text-sm text-[#EDF1EF] mt-1 truncate">{submittedData.email}</p>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 flex items-center justify-between border-t border-[#253632]">
              {!parentInvitation && <button
                type="button"
                onClick={resetForm}
                className="nova-mono text-[11px] sm:text-xs text-[#9AA6A4] hover:text-[#EDF1EF] transition-colors flex items-center gap-2 group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                <span>Submit another response</span>
              </button>}
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form-state"
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-[#253632] bg-[#101B1C] p-5 sm:p-12 text-left space-y-6 sm:space-y-8"
          >
            {/* Form Title & Context */}
            <div className="pb-4 sm:pb-6 border-b border-[#253632] flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h3 className="nova-display text-lg sm:text-2xl font-medium tracking-tight text-[#EDF1EF]">
                  {parentInvitation ? "Parent or guardian information" : "Your information"}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#9AA6A4]">
                  {parentInvitation ? "Enter your own contact details, not the learner's. This registers your interest for them without creating a child account." : "Complete this form to reserve your position in the next cohort."}
                </p>
              </div>
              <span className="nova-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#C4ED6C]">
                Required Fields *
              </span>
            </div>

            {/* Error Notification Banner */}
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-red-500/40 bg-red-950/30 p-3.5 sm:p-4 text-xs sm:text-sm text-red-200 flex items-start gap-3"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1 text-xs sm:text-sm">
                    <p className="font-medium text-red-100">{errors.general}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Grid */}
            <div className="space-y-5 sm:space-y-6">
              {/* Field: Name */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={nameId}
                    className="nova-mono text-[11px] sm:text-xs font-medium text-[#AFBAB6] tracking-wide"
                  >
                    NAME <span className="text-[#C4ED6C]">*</span>
                  </label>
                  {errors.name && (
                    <span className="nova-mono text-[10px] sm:text-[11px] text-red-400">{errors.name}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id={nameId}
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name || errors.general) setErrors({ ...errors, name: undefined, general: undefined });
                    }}
                    className={`w-full rounded-none border bg-[#0D1517] px-3.5 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-[#EDF1EF] placeholder-[#71877B] transition-colors outline-none focus:ring-0 ${
                      errors.name
                        ? "border-red-500"
                        : "border-[#2D4035] focus:border-[#C4ED6C]"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 nova-mono text-[10px] sm:text-[11px] text-[#9AA6A4]">
                    Aa
                  </span>
                </div>
              </div>

              {/* Field: Number */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={numberId}
                    className="nova-mono text-[11px] sm:text-xs font-medium text-[#AFBAB6] tracking-wide"
                  >
                    NUMBER (PHONE / WHATSAPP) <span className="text-[#C4ED6C]">*</span>
                  </label>
                  {errors.number && (
                    <span className="nova-mono text-[10px] sm:text-[11px] text-red-400">{errors.number}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id={numberId}
                    type="tel"
                    placeholder="+62 8..."
                    value={formData.number}
                    onChange={(e) => {
                      setFormData({ ...formData, number: e.target.value });
                      if (errors.number || errors.general) setErrors({ ...errors, number: undefined, general: undefined });
                    }}
                    className={`w-full rounded-none border bg-[#0D1517] px-3.5 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-[#EDF1EF] placeholder-[#71877B] transition-colors outline-none focus:ring-0 ${
                      errors.number
                        ? "border-red-500"
                        : "border-[#2D4035] focus:border-[#C4ED6C]"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 nova-mono text-[10px] sm:text-[11px] text-[#9AA6A4]">
                    Aa
                  </span>
                </div>
              </div>

              {/* Field: Email */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={emailId}
                    className="nova-mono text-[11px] sm:text-xs font-medium text-[#AFBAB6] tracking-wide"
                  >
                    {parentInvitation ? "PARENT EMAIL" : "EMAIL"} <span className="text-[#C4ED6C]">*</span>
                  </label>
                  {errors.email && (
                    <span className="nova-mono text-[10px] sm:text-[11px] text-red-400">{errors.email}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id={emailId}
                    type="email"
                    readOnly={!!parentInvitation}
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email || errors.general) setErrors({ ...errors, email: undefined, general: undefined });
                    }}
                    className={`w-full rounded-none border bg-[#0D1517] px-3.5 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-[#EDF1EF] placeholder-[#71877B] transition-colors outline-none focus:ring-0 ${
                      errors.email
                        ? "border-red-500"
                        : "border-[#2D4035] focus:border-[#C4ED6C]"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 nova-mono text-[11px] sm:text-xs text-[#9AA6A4]">
                    @
                  </span>
                </div>
              </div>

              {parentInvitation && <label className="flex items-start gap-3 text-sm text-[#AFBAB6]">
                <input type="checkbox" checked={parentPermission} onChange={(event) => setParentPermission(event.target.checked)} className="mt-1" />
                <span>{PARENT_WAITLIST_NOTICE}</span>
              </label>}

              {/* Original optional preference for news beyond the launch. */}
              <div className="pt-2 sm:pt-3">
                <label className="flex items-start gap-2.5 sm:gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={formData.receive_updates}
                    onChange={(e) =>
                      setFormData({ ...formData, receive_updates: e.target.checked })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`mt-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center border transition-colors ${
                      formData.receive_updates
                        ? "border-[#C4ED6C] bg-[#C4ED6C] text-[#EDF1EF]"
                        : "border-[#333849] bg-[#0D1517] group-hover:border-[#555C75]"
                    }`}
                  >
                    {formData.receive_updates && (
                      <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-white" viewBox="0 0 24 24" fill="none" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs md:text-[13px] leading-relaxed text-[#9AA6A4] group-hover:text-[#AFBAB6] transition-colors">
                    {MARKETING_CONSENT_TEXT}
                  </span>
                </label>
              </div>
            </div>

            <p className="text-xs text-[#AFBAB6]">By joining, you request launch and early access notifications by email. The checkbox above is only for updates beyond the launch. You can unsubscribe using the link in each promotional email. Joining is free and creates no paid subscription. Read our <Link to="/arena/privacy-policy" className="underline">Privacy Policy</Link> and <Link to="/arena/terms-of-service" className="underline">Terms of Service</Link>.</p>

            {/* Submit Button */}
            <div className="pt-3 sm:pt-4 border-t border-[#253632]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white px-6 sm:px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs font-mono uppercase tracking-[0.15em] font-semibold text-black hover:bg-[#C4ED6C] hover:text-[#EDF1EF] transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WaitlistForm(props: { className?: string; onSuccessCallback?: () => void }) {
  return <AgeGate>{(ageGroup) => requiresParentRegistration(ageGroup)
    ? <ParentWaitlistInvite ageGroup={ageGroup} />
    : <EligibleWaitlistForm {...props} ageGroup={ageGroup} />}</AgeGate>;
}
