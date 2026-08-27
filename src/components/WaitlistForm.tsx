import { useState, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowRight, Loader2, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

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

const AGE_OPTIONS = [
  { value: "<10", label: "< 10" },
  { value: "10-18", label: "10 - 18" },
  { value: "18-20", label: "18 - 20" },
  { value: "20+", label: "20+" },
];

export default function WaitlistForm({
  className = "",
  onSuccessCallback,
}: {
  className?: string;
  onSuccessCallback?: () => void;
}) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    number: "",
    email: "",
    age_group: "",
    receive_updates: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

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
      newErrors.number = "Phone or WhatsApp number is required";
    } else if (formData.number.replace(/\D/g, "").length < 6) {
      newErrors.number = "Please enter a valid phone number";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.age_group) {
      newErrors.age_group = "Please select your age group";
    }

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Already registered duplicate rejection
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
          general: data.message || "Unable to join waitlist. Please verify your details and try again.",
        });
        return;
      }

      // Success
      setSubmittedName(formData.name.trim());
      setIsSuccess(true);
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch (err: any) {
      setErrors({
        general: "Connection failed. Please check your internet network and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      number: "",
      email: "",
      age_group: "",
      receive_updates: false,
    });
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <div
      className={`relative w-full max-w-xl mx-auto rounded-2xl border border-white/10 bg-[#0A0C10]/95 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all ${className}`}
    >
      {/* Decorative subtle ambient backdrop glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#D97757]/10 rounded-full blur-3xl -z-10" />

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="py-6 text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <span className="nova-mono inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1 text-xs font-medium text-[#10B981]">
              <Sparkles className="h-3 w-3" /> Waitlist Confirmed
            </span>

            <h3 className="nova-display mt-4 text-2xl sm:text-3xl font-medium tracking-tight text-white">
              You're on the list{submittedName ? `, ${submittedName}` : ""}!
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm sm:text-base leading-relaxed text-[#E8E4D9]/75">
              Thank you for signing up. We're rolling out access in batches. You will receive priority invitation details directly via email and WhatsApp.
            </p>

            <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-left">
              <div className="flex items-center gap-3 text-xs text-[#E8E4D9]/60">
                <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Priority Access Status: <strong className="text-white">Active Queue</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="mt-8 text-xs font-medium uppercase tracking-wider text-[#D97757] hover:text-[#e48b6e] transition-colors"
            >
              Add another response
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-left"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="nova-display text-xl sm:text-2xl font-medium tracking-tight text-white">
                  Your information
                </h3>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#E8E4D9]/40">
                  Step 1 of 1
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#E8E4D9]/60">
                Reserve your spot in the next NovaX Arena simulation batch.
              </p>
            </div>

            {/* General Banner Error (e.g. Duplication or Server issue) */}
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-200 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-100">{errors.general}</p>
                    <p className="text-xs text-red-300/80 mt-0.5">
                      If you have already registered, you do not need to submit again.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Field: Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={nameId}
                  className="text-xs sm:text-sm font-medium text-[#E8E4D9]/90 flex items-center gap-1"
                >
                  Name <span className="text-[#D97757]">*</span>
                </label>
                {errors.name && (
                  <span className="text-[11px] font-medium text-red-400">{errors.name}</span>
                )}
              </div>
              <div className="relative group">
                <input
                  id={nameId}
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name || errors.general) setErrors({ ...errors, name: undefined, general: undefined });
                  }}
                  className={`w-full rounded-xl border bg-black/40 px-4 py-3 pr-12 text-sm text-white placeholder-[#E8E4D9]/30 shadow-inner transition-all outline-none focus:ring-2 focus:ring-[#D97757]/40 ${
                    errors.name
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 group-hover:border-white/20 focus:border-[#D97757]"
                  }`}
                />
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 select-none text-xs font-semibold text-[#E8E4D9]/40 tracking-wider">
                  Aa
                </div>
              </div>
            </div>

            {/* Field: Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={numberId}
                  className="text-xs sm:text-sm font-medium text-[#E8E4D9]/90 flex items-center gap-1"
                >
                  Number <span className="text-[#D97757]">*</span>
                </label>
                {errors.number && (
                  <span className="text-[11px] font-medium text-red-400">{errors.number}</span>
                )}
              </div>
              <div className="relative group">
                <input
                  id={numberId}
                  type="tel"
                  placeholder="e.g. +628123456789 or 0812..."
                  value={formData.number}
                  onChange={(e) => {
                    setFormData({ ...formData, number: e.target.value });
                    if (errors.number || errors.general) setErrors({ ...errors, number: undefined, general: undefined });
                  }}
                  className={`w-full rounded-xl border bg-black/40 px-4 py-3 pr-12 text-sm text-white placeholder-[#E8E4D9]/30 shadow-inner transition-all outline-none focus:ring-2 focus:ring-[#D97757]/40 ${
                    errors.number
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 group-hover:border-white/20 focus:border-[#D97757]"
                  }`}
                />
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 select-none text-xs font-semibold text-[#E8E4D9]/40 tracking-wider">
                  Aa
                </div>
              </div>
            </div>

            {/* Field: Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={emailId}
                  className="text-xs sm:text-sm font-medium text-[#E8E4D9]/90 flex items-center gap-1"
                >
                  Email <span className="text-[#D97757]">*</span>
                </label>
                {errors.email && (
                  <span className="text-[11px] font-medium text-red-400">{errors.email}</span>
                )}
              </div>
              <div className="relative group">
                <input
                  id={emailId}
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email || errors.general) setErrors({ ...errors, email: undefined, general: undefined });
                  }}
                  className={`w-full rounded-xl border bg-black/40 px-4 py-3 pr-12 text-sm text-white placeholder-[#E8E4D9]/30 shadow-inner transition-all outline-none focus:ring-2 focus:ring-[#D97757]/40 ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 group-hover:border-white/20 focus:border-[#D97757]"
                  }`}
                />
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-[#E8E4D9]/40">
                  @
                </div>
              </div>
            </div>

            {/* Field: Age Range Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-[#E8E4D9]/90 flex items-center gap-1">
                  Age Range <span className="text-[#D97757]">*</span>
                </span>
                {errors.age_group && (
                  <span className="text-[11px] font-medium text-red-400">{errors.age_group}</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AGE_OPTIONS.map((opt) => {
                  const isSelected = formData.age_group === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, age_group: opt.value });
                        if (errors.age_group) setErrors({ ...errors, age_group: undefined });
                      }}
                      className={`relative flex items-center justify-center gap-2 rounded-xl border px-3.5 py-3 text-xs sm:text-sm font-medium transition-all duration-200 select-none ${
                        isSelected
                          ? "border-[#D97757] bg-[#D97757]/15 text-white shadow-[0_0_15px_rgba(217,119,87,0.25)]"
                          : "border-white/10 bg-white/[0.02] text-[#E8E4D9]/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isSelected
                            ? "border-[#D97757] bg-[#D97757] text-white"
                            : "border-white/20 bg-black/40 text-transparent"
                        }`}
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkbox: Receive updates */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={formData.receive_updates}
                    onChange={(e) =>
                      setFormData({ ...formData, receive_updates: e.target.checked })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                      formData.receive_updates
                        ? "border-[#D97757] bg-[#D97757] text-white shadow-[0_0_10px_rgba(217,119,87,0.3)]"
                        : "border-white/20 bg-black/40 group-hover:border-white/40"
                    }`}
                  >
                    {formData.receive_updates && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs sm:text-sm leading-snug text-[#E8E4D9]/80 group-hover:text-[#E8E4D9] transition-colors">
                  Want to receive updates from us beyond the launch?
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full relative flex items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black hover:bg-[#F2EDE4] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.25)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>Verifying and Joining...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

            {/* Security note */}
            <p className="text-center text-[11px] text-[#E8E4D9]/40">
              🔒 No spam, ever. Your information is securely stored and never shared.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
