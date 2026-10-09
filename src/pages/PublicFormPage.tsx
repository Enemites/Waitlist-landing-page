import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  CornerDownLeft,
  ChevronRight,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

import AgeGate from "@/components/AgeGate";
import { requiresParentRegistration } from "../../shared/privacy";

interface Question {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "rating" | "select" | "email" | "number" | "phone";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  helperText?: string;
}

interface FormData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  questions: Question[];
  is_active: boolean;
  expires_at?: string | null;
  is_expired?: boolean;
  is_endless?: boolean;
  created_at?: string;
}

function EligiblePublicFormPage({ ageGroup }: { ageGroup: string }) {
  const { slug } = useParams<{ slug: string }>();

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchForm() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/forms/${encodeURIComponent(slug)}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.message || "Form not found or has been disabled.");
          return;
        }

        setForm(json.form);

        // Pre-populate checkbox types as empty arrays
        const initial: Record<string, any> = {};
        json.form.questions.forEach((q: Question) => {
          if (q.type === "checkbox") {
            initial[q.id] = [];
          }
        });
        setResponses(initial);
      } catch (err: any) {
        console.error("Error loading form:", err);
        setError("Unable to load form. Please check your network connection or try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchForm();
  }, [slug]);

  const handleInputChange = (questionId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleCheckboxToggle = (questionId: string, option: string) => {
    const currentList: string[] = Array.isArray(responses[questionId]) ? responses[questionId] : [];
    const nextList = currentList.includes(option)
      ? currentList.filter((item) => item !== option)
      : [...currentList, option];

    handleInputChange(questionId, nextList);
  };

  // Progress Calculation
  const progress = useMemo(() => {
    if (!form || !form.questions.length) return 0;
    const answered = form.questions.filter((q) => {
      const val = responses[q.id];
      if (val === undefined || val === null || val === "") return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    }).length;
    return Math.round((answered / form.questions.length) * 100);
  }, [form, responses]);

  const answeredCount = useMemo(() => {
    if (!form) return 0;
    return form.questions.filter((q) => {
      const val = responses[q.id];
      if (val === undefined || val === null || val === "") return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    }).length;
  }, [form, responses]);

  const validate = () => {
    if (!form) return false;
    const errors: Record<string, string> = {};

    form.questions.forEach((q) => {
      if (q.required) {
        const val = responses[q.id];
        if (
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "") ||
          (Array.isArray(val) && val.length === 0)
        ) {
          errors[q.id] = "This field is required";
        }
      }

      if (q.type === "email" && responses[q.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(responses[q.id])) {
          errors[q.id] = "Please enter a valid email address";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !slug) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey) {
        document.getElementById(`question-${firstErrorKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/forms/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          age_group: ageGroup,
          parent_submitted: requiresParentRegistration(ageGroup),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || "Failed to submit form. Please try again.");
        return;
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submission error:", err);
      alert("A network error occurred while submitting your response.");
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Sleek Skeleton Loading
  if (loading) {
    return (
      <div className="product-site product-questionnaire min-h-[100dvh] bg-[#0D1517] text-[#AFBAB6] font-sans flex flex-col justify-between p-6 sm:p-12">
        <div className="max-w-xl w-full mx-auto space-y-8 animate-pulse pt-8">
          <div className="flex items-center justify-between border-b border-[#253632] pb-4">
            <div className="h-5 w-24 bg-[#182720] rounded" />
            <div className="h-5 w-16 bg-[#182720] rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-[#182720] rounded" />
            <div className="h-4 w-full bg-[#182720]/60 rounded" />
            <div className="h-4 w-2/3 bg-[#182720]/40 rounded" />
          </div>
          <div className="space-y-4 pt-4">
            <div className="h-28 bg-[#111C1E] border border-[#253632] rounded-xl" />
            <div className="h-28 bg-[#111C1E] border border-[#253632] rounded-xl" />
          </div>
        </div>
        <div className="text-center text-xs text-zinc-600 font-mono">Enemites · secure infrastructure</div>
      </div>
    );
  }

  // 2. Error / Not Found View (English)
  if (error || !form) {
    return (
      <div className="product-site product-questionnaire min-h-[100dvh] bg-[#0D1517] text-[#EDF1EF] flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-[#253632] bg-[#111C1E]/50 rounded-2xl p-8 backdrop-blur-md">
          <div className="flex items-center space-x-3 text-[#A73328] mb-4">
            <AlertCircle className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#A73328]">404 · Not Found</span>
          </div>
          <h1 className="text-xl font-semibold text-[#EDF1EF] mb-2">Form Not Found</h1>
          <p className="text-sm text-[#AFBAB6] leading-relaxed mb-6">
            {error || "The questionnaire you are looking for does not exist, has expired, or is currently unavailable."}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-[#253632]/80">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-xs font-mono text-[#AFBAB6] hover:text-[#EDF1EF] transition"
            >
              <span>← Back to Home</span>
            </Link>
            <span className="text-xs font-medium text-[#9AA6A4]">Enemites</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Expired State (English)
  if (form.is_expired) {
    return (
      <div className="product-site product-questionnaire min-h-[100dvh] bg-[#0D1517] text-[#EDF1EF] flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-[#253632] bg-[#111C1E]/40 rounded-2xl p-8">
          <div className="flex items-center space-x-2 text-[#C4ED6C] mb-4">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-wider">Form Closed</span>
          </div>
          <h1 className="text-xl font-semibold text-[#EDF1EF] mb-2">{form.title}</h1>
          <p className="text-sm text-[#AFBAB6] leading-relaxed mb-4">
            This questionnaire is no longer accepting new submissions.
          </p>
          {form.expires_at && (
            <div className="text-xs font-mono text-[#9AA6A4] bg-[#111C1E] border border-[#253632] rounded-lg p-3 mb-6">
              Closed at: {new Date(form.expires_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          )}
          <div className="pt-4 border-t border-[#253632]/80 flex items-center justify-between text-xs text-[#9AA6A4] font-mono">
            <span>Thank you for your interest</span>
            <span className="font-medium text-[#AFBAB6]">Enemites</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Success State (Clean English Completion Receipt)
  if (submitted) {
    return (
      <div className="product-site product-questionnaire min-h-[100dvh] bg-[#0D1517] text-[#EDF1EF] flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-[#253632] bg-[#111C1E]/60 rounded-2xl p-8 backdrop-blur-md">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#C4ED6C] mb-6">
            <Check className="w-5 h-5" />
          </div>
          <div className="space-y-1 mb-6">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#C4ED6C]">Response Recorded</span>
            <h1 className="text-2xl font-semibold text-[#EDF1EF] tracking-tight">Thank You</h1>
            <p className="text-sm text-[#AFBAB6] leading-relaxed pt-1">
              Your submission for <strong className="text-[#EDF1EF] font-medium">"{form.title}"</strong> has been securely received.
            </p>
          </div>

          <div className="bg-[#101B1C]/70 border border-[#253632]/80 rounded-xl p-4 space-y-2 mb-6 font-mono text-xs text-[#AFBAB6]">
            <div className="flex justify-between">
              <span className="text-[#9AA6A4]">Form Slug:</span>
              <span className="text-[#AFBAB6] font-medium">{form.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9AA6A4]">Timestamp:</span>
              <span className="text-[#AFBAB6]">{new Date().toLocaleTimeString("en-US")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9AA6A4]">Security:</span>
              <span className="text-[#C4ED6C]/90 flex items-center gap-1">
                <Shield className="w-3 h-3 inline" /> Encrypted & Geo-Logged
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#253632]/80 flex items-center justify-between text-xs text-[#9AA6A4]">
            <span className="font-medium text-[#AFBAB6]">Enemites platform</span>
            <button
              onClick={() => window.location.reload()}
              className="text-[#AFBAB6] hover:text-[#EDF1EF] transition font-mono underline"
            >
              Submit another response
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Active Questionnaire Screen
  return (
    <div className="product-site product-questionnaire min-h-[100dvh] bg-[#0D1517] text-[#EDF1EF] selection:bg-[#182720] selection:text-[#EDF1EF] font-sans antialiased flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0D1517]/90 backdrop-blur-md border-b border-[#253632]/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-md bg-[#C4ED6C] text-[#101B1C] font-sans font-bold text-xs flex items-center justify-center tracking-tighter">
              E
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#EDF1EF]">Enemites</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#AFBAB6]">
              <span>{answeredCount} of {form.questions.length} answered</span>
              <div className="w-16 h-1.5 bg-[#182720] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C4ED6C] transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {form.is_endless ? (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#2D4035]/60 bg-[#111C1E] text-[#AFBAB6]">
                Active
              </span>
            ) : form.expires_at ? (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#2D4035]/60 bg-[#111C1E] text-[#AFBAB6] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(form.expires_at).toLocaleDateString("en-US")}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1">
        {/* Form Title & Introduction Header */}
        <div className="mb-8 sm:mb-10 space-y-2 sm:space-y-3 pb-6 sm:pb-8 border-b border-[#253632]/80">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-[#EDF1EF]">{form.title}</h1>
          {form.description && (
            <p className="text-xs sm:text-sm md:text-base text-[#AFBAB6] leading-relaxed whitespace-pre-line font-normal">
              {form.description}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1.5 sm:pt-2 text-[11px] sm:text-xs font-mono text-[#9AA6A4]">
            <span>{form.questions.length} Questions</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#AFBAB6]">
              <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5 inline" /> Sent securely to Enemites
            </span>
          </div>
        </div>

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {form.questions.map((q, idx) => {
            const hasError = Boolean(validationErrors[q.id]);
            const errorMsg = validationErrors[q.id];
            const isAnswered =
              responses[q.id] !== undefined &&
              responses[q.id] !== null &&
              responses[q.id] !== "" &&
              (!Array.isArray(responses[q.id]) || responses[q.id].length > 0);

            return (
              <section
                key={q.id || idx}
                id={`question-${q.id}`}
                className={`transition duration-150 rounded-xl p-4 sm:p-6 border ${
                  hasError
                    ? "border-red-500/50 bg-red-950/10"
                    : isAnswered
                    ? "border-[#253632] bg-[#111C1E]/30"
                    : "border-[#253632]/80 bg-[#111C1E]/20"
                }`}
              >
                {/* Header of Question */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <label className="text-sm sm:text-base font-medium text-[#EDF1EF] flex items-start gap-2 sm:gap-2.5">
                    <span className="font-mono text-[11px] sm:text-xs text-[#9AA6A4] mt-0.5 sm:mt-1 select-none">
                      {String(idx + 1).padStart(2, "0")}.
                    </span>
                    <span>
                      {q.label}
                      {q.required && (
                        <span className="text-[#9AA6A4] text-[10px] sm:text-xs font-mono ml-1.5 sm:ml-2 select-none" title="Required">
                          *required
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                {q.helperText && (
                  <p className="text-[11px] sm:text-xs text-[#AFBAB6] pl-5 sm:pl-7 mb-3 sm:mb-4 flex items-center gap-1.5 font-sans">
                    <HelpCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#9AA6A4] shrink-0" />
                    <span>{q.helperText}</span>
                  </p>
                )}

                {/* Input Fields */}
                <div className="pl-7 mt-3">
                  {/* 1. Text / Email / Phone / Number */}
                  {["text", "email", "phone", "number"].includes(q.type) && (
                    <input
                      type={q.type === "email" ? "email" : q.type === "number" ? "number" : "text"}
                      placeholder={q.placeholder || "Type your response..."}
                      value={responses[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className="w-full bg-[#101B1C] border border-[#253632] rounded-lg px-3.5 py-2.5 text-sm text-[#EDF1EF] placeholder-[#71877B] focus:outline-none focus:border-[#C4ED6C] focus:ring-1 focus:ring-zinc-500 transition"
                    />
                  )}

                  {/* 2. Textarea */}
                  {q.type === "textarea" && (
                    <textarea
                      rows={4}
                      placeholder={q.placeholder || "Write your detailed feedback here..."}
                      value={responses[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className="w-full bg-[#101B1C] border border-[#253632] rounded-lg p-3.5 text-sm text-[#EDF1EF] placeholder-[#71877B] focus:outline-none focus:border-[#C4ED6C] focus:ring-1 focus:ring-zinc-500 transition resize-y font-sans leading-relaxed"
                    />
                  )}

                  {/* 3. Radio / Single Choice */}
                  {q.type === "radio" && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt, optIdx) => {
                        const isSelected = responses[q.id] === opt;
                        return (
                          <button
                            type="button"
                            key={optIdx}
                            onClick={() => handleInputChange(q.id, opt)}
                            className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition active:scale-[0.99] ${
                              isSelected
                                ? "bg-[#182720]/80 border-[#C4ED6C] text-[#EDF1EF] font-medium shadow-sm"
                                : "bg-[#101B1C] border-[#253632] text-[#AFBAB6] hover:border-[#2D4035] hover:bg-[#111C1E]/60"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? "border-white bg-[#C4ED6C]" : "border-zinc-600"
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#101B1C]" />}
                              </span>
                              <span>{opt}</span>
                            </span>
                            {isSelected && <ChevronRight className="w-4 h-4 text-[#AFBAB6]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. Checkbox / Multiple Choice */}
                  {q.type === "checkbox" && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt, optIdx) => {
                        const selectedList: string[] = Array.isArray(responses[q.id]) ? responses[q.id] : [];
                        const isChecked = selectedList.includes(opt);
                        return (
                          <button
                            type="button"
                            key={optIdx}
                            onClick={() => handleCheckboxToggle(q.id, opt)}
                            className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition active:scale-[0.99] ${
                              isChecked
                                ? "bg-[#182720]/80 border-[#C4ED6C] text-[#EDF1EF] font-medium shadow-sm"
                                : "bg-[#101B1C] border-[#253632] text-[#AFBAB6] hover:border-[#2D4035] hover:bg-[#111C1E]/60"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isChecked ? "border-white bg-[#C4ED6C] text-[#101B1C]" : "border-zinc-600"
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </span>
                              <span>{opt}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 5. Rating Scale (Segmented Pills 1-5 or 1-10) */}
                  {q.type === "rating" && (
                    <div className="space-y-2 pt-1">
                      <div className={`grid gap-1.5 ${q.max && q.max > 5 ? "grid-cols-5 sm:grid-cols-10" : "grid-cols-5"}`}>
                        {Array.from({ length: q.max || 5 }, (_, i) => i + 1).map((val) => {
                          const isSelected = responses[q.id] === val;
                          return (
                            <button
                              type="button"
                              key={val}
                              onClick={() => handleInputChange(q.id, val)}
                              className={`py-3 rounded-lg border font-mono text-sm font-medium transition active:scale-[0.97] ${
                                isSelected
                                  ? "bg-[#C4ED6C] text-[#101B1C] border-white font-bold shadow-md"
                                  : "bg-[#101B1C] border-[#253632] text-[#AFBAB6] hover:border-[#2D4035] hover:text-[#EDF1EF] hover:bg-[#111C1E]"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>

                      {q.max && q.max > 5 && (
                        <div className="flex justify-between text-[11px] font-mono text-[#9AA6A4] px-1 pt-1">
                          <span>1: Extremely Unlikely</span>
                          <span>10: Extremely Likely</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Select Dropdown (High-Craft Custom Select) */}
                  {q.type === "select" && (
                    <div className="relative">
                      <select
                        value={responses[q.id] || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        className="w-full appearance-none bg-[#101B1C] border border-[#253632] rounded-lg pl-3.5 pr-10 py-3 text-sm text-[#EDF1EF] focus:outline-none focus:border-[#C4ED6C] focus:ring-1 focus:ring-zinc-500 transition cursor-pointer"
                      >
                        <option value="" disabled className="bg-[#111C1E] text-[#9AA6A4]">
                          {q.placeholder || "-- Select an option --"}
                        </option>
                        {(q.options || []).map((opt, optIdx) => (
                          <option key={optIdx} value={opt} className="bg-[#111C1E] text-[#EDF1EF] py-1">
                            {opt}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#AFBAB6]">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {/* Error Indicator */}
                  {hasError && (
                    <p className="mt-2 text-xs font-mono text-[#A73328] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </p>
                  )}
                </div>
              </section>
            );
          })}

          {/* Submit Action */}
          <div className="pt-6 border-t border-[#253632]/80 space-y-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#C4ED6C] text-[#101B1C] hover:bg-[#182720] active:scale-[0.98] font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? (
                <span className="font-mono text-xs">Submitting response...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Submit Response</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs font-mono text-[#9AA6A4] pt-2">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="w-3.5 h-3.5" /> Click button to complete
              </span>
              <span className="text-[#9AA6A4]">Enemites dynamic engine</span>
            </div>
          </div>
        </form>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-[#253632] py-6 text-center text-xs font-mono text-[#9AA6A4]">
        enemites.com · private questionnaire infrastructure
      </footer>
    </div>
  );
}

export default function PublicFormPage() {
  const { slug } = useParams();
  return <AgeGate key={slug} className="max-w-2xl mx-auto mt-28">{(ageGroup) => <ParentQuestionnaire ageGroup={ageGroup} />}</AgeGate>;
}

function ParentQuestionnaire({ ageGroup }: { ageGroup: string }) {
  const [confirmed, setConfirmed] = useState(false);
  if (!requiresParentRegistration(ageGroup) || confirmed) return <EligiblePublicFormPage ageGroup={ageGroup} />;
  return <section className="max-w-2xl mx-auto mt-28 p-6 bg-[#101B1C] text-[#EDF1EF] space-y-5">
    <h1 className="text-xl">Parent or guardian questionnaire</h1>
    <p>This questionnaire can be completed by a parent or guardian with their own answers and contact information. Please do not provide a child's name, email, phone number, or other identifying information. Waitlist permission does not authorize collecting questionnaire answers from a child.</p>
    <button type="button" className="bg-white text-black px-6 py-3" onClick={() => setConfirmed(true)}>I am the parent or guardian; continue</button>
  </section>;
}
