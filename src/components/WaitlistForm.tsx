import { useState, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
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

const AGE_OPTIONS = [
  { value: "<10", label: "<10" },
  { value: "10-18", label: "10–18" },
  { value: "18-20", label: "18–20" },
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

    if (!formData.age_group) {
      newErrors.age_group = "Please select an age group";
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
      email: "",
      age_group: "",
      receive_updates: false,
    });
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="border border-[#222222] bg-[#0A0B0E] p-8 sm:p-12 text-left"
          >
            {/* Header / Monospace Status */}
            <div className="flex items-center justify-between pb-6 border-b border-[#1A1C23]">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                <span className="nova-mono text-[11px] uppercase tracking-[0.2em] text-[#10B981] font-medium">
                  Entry Confirmed
                </span>
              </div>
              <span className="nova-mono text-[11px] tracking-wider text-[#686E7D]">
                TIME {submittedData.timestamp || "REC"}
              </span>
            </div>

            {/* Main Headline */}
            <div className="pt-8 pb-6">
              <h3 className="nova-display text-3xl sm:text-4xl font-medium tracking-tight text-white">
                You are on the list, {submittedData.name}.
              </h3>
              <p className="mt-4 text-[15px] leading-[1.7] text-[#9DA3B4] max-w-lg">
                Your entry has been recorded for the upcoming NovaX Arena simulation batch. We will deliver your private access key directly to your email and WhatsApp when onboarding begins.
              </p>
            </div>

            {/* Spec / Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#1F222C] border border-[#1F222C] my-6">
              <div className="bg-[#0D0E12] p-4">
                <p className="nova-mono text-[10px] uppercase tracking-wider text-[#686E7D]">Registry Status</p>
                <p className="nova-mono text-sm text-[#E8E4D9] mt-1 font-medium">Active · Priority Queue</p>
              </div>
              <div className="bg-[#0D0E12] p-4">
                <p className="nova-mono text-[10px] uppercase tracking-wider text-[#686E7D]">Dispatch Channel</p>
                <p className="nova-mono text-sm text-[#E8E4D9] mt-1 truncate">{submittedData.email}</p>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 flex items-center justify-between border-t border-[#1A1C23]">
              <button
                type="button"
                onClick={resetForm}
                className="nova-mono text-xs text-[#9DA3B4] hover:text-white transition-colors flex items-center gap-2 group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                <span>Submit another response</span>
              </button>
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
            className="border border-[#222222] bg-[#07080A] p-8 sm:p-12 text-left space-y-8"
          >
            {/* Form Title & Context */}
            <div className="pb-6 border-b border-[#1A1C23] flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h3 className="nova-display text-2xl font-medium tracking-tight text-white">
                  Your information
                </h3>
                <p className="mt-1 text-sm text-[#888E9E]">
                  Complete this form to reserve your position in the next cohort.
                </p>
              </div>
              <span className="nova-mono text-[11px] uppercase tracking-wider text-[#D97757]">
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
                  className="border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200 flex items-start gap-3"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1 text-xs sm:text-sm">
                    <p className="font-medium text-red-100">{errors.general}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Grid */}
            <div className="space-y-6">
              {/* Field: Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={nameId}
                    className="nova-mono text-xs font-medium text-[#C2BDB0] tracking-wide"
                  >
                    NAME <span className="text-[#D97757]">*</span>
                  </label>
                  {errors.name && (
                    <span className="nova-mono text-[11px] text-red-400">{errors.name}</span>
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
                    className={`w-full rounded-none border bg-[#0F1117] px-4 py-3.5 text-sm text-white placeholder-[#5A6070] transition-colors outline-none focus:ring-0 ${
                      errors.name
                        ? "border-red-500"
                        : "border-[#222634] focus:border-[#D97757]"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 nova-mono text-[11px] text-[#4A5060]">
                    Aa
                  </span>
                </div>
              </div>

              {/* Field: Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={numberId}
                    className="nova-mono text-xs font-medium text-[#C2BDB0] tracking-wide"
                  >
                    NUMBER (PHONE / WHATSAPP) <span className="text-[#D97757]">*</span>
                  </label>
                  {errors.number && (
                    <span className="nova-mono text-[11px] text-red-400">{errors.number}</span>
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
                    className={`w-full rounded-none border bg-[#0F1117] px-4 py-3.5 text-sm text-white placeholder-[#5A6070] transition-colors outline-none focus:ring-0 ${
                      errors.number
                        ? "border-red-500"
                        : "border-[#222634] focus:border-[#D97757]"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 nova-mono text-[11px] text-[#4A5060]">
                    Aa
                  </span>
                </div>
              </div>

              {/* Field: Email */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={emailId}
                    className="nova-mono text-xs font-medium text-[#C2BDB0] tracking-wide"
                  >
                    EMAIL <span className="text-[#D97757]">*</span>
                  </label>
                  {errors.email && (
                    <span className="nova-mono text-[11px] text-red-400">{errors.email}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id={emailId}
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email || errors.general) setErrors({ ...errors, email: undefined, general: undefined });
                    }}
                    className={`w-full rounded-none border bg-[#0F1117] px-4 py-3.5 text-sm text-white placeholder-[#5A6070] transition-colors outline-none focus:ring-0 ${
                      errors.email
                        ? "border-red-500"
                        : "border-[#222634] focus:border-[#D97757]"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 nova-mono text-xs text-[#4A5060]">
                    @
                  </span>
                </div>
              </div>

              {/* Field: Age Cohort */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="nova-mono text-xs font-medium text-[#C2BDB0] tracking-wide">
                    AGE COHORT <span className="text-[#D97757]">*</span>
                  </span>
                  {errors.age_group && (
                    <span className="nova-mono text-[11px] text-red-400">{errors.age_group}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        className={`flex items-center justify-center py-3 px-4 border text-xs font-mono transition-colors select-none ${
                          isSelected
                            ? "border-[#D97757] bg-[#D97757] text-white font-semibold"
                            : "border-[#222634] bg-[#0F1117] text-[#9DA3B4] hover:border-[#383E54] hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkbox: Consent */}
              <div className="pt-3">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={formData.receive_updates}
                    onChange={(e) =>
                      setFormData({ ...formData, receive_updates: e.target.checked })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
                      formData.receive_updates
                        ? "border-[#D97757] bg-[#D97757] text-white"
                        : "border-[#333849] bg-[#0F1117] group-hover:border-[#555C75]"
                    }`}
                  >
                    {formData.receive_updates && (
                      <svg className="h-3 w-3 stroke-white" viewBox="0 0 24 24" fill="none" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs sm:text-[13px] leading-relaxed text-[#9DA3B4] group-hover:text-[#C2BDB0] transition-colors">
                    Want to receive updates from us beyond the launch?
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-[#1A1C23]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 bg-white px-8 py-4 text-xs font-mono uppercase tracking-[0.15em] font-semibold text-black hover:bg-[#D97757] hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <ArrowRight className="h-4 w-4" />
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
