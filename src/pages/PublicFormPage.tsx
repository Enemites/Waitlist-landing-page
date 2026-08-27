import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  HelpCircle,
  Star,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

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
}

export default function PublicFormPage() {
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
        const res = await fetch(`/api/forms/${slug}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.message || "Form tidak ditemukan atau telah dihapus.");
          return;
        }

        setForm(json.form);

        // Pre-initialize checkbox responses as empty arrays
        const initialResponses: Record<string, any> = {};
        json.form.questions.forEach((q: Question) => {
          if (q.type === "checkbox") {
            initialResponses[q.id] = [];
          }
        });
        setResponses(initialResponses);
      } catch (err: any) {
        console.error("Error loading form:", err);
        setError("Gagal memuat form. Silakan periksa koneksi internet Anda.");
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
          errors[q.id] = "Pertanyaan ini wajib diisi.";
        }
      }

      if (q.type === "email" && responses[q.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(responses[q.id])) {
          errors[q.id] = "Masukkan alamat email yang valid.";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !slug) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/forms/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          respondent_info: {
            userAgent: navigator.userAgent,
            submittedAt: new Date().toISOString(),
          },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || "Gagal mengirim jawaban. Silakan coba lagi.");
        return;
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submission error:", err);
      alert("Terjadi kesalahan saat mengirim jawaban.");
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b10] text-white flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-lg font-medium tracking-wide">Memuat kuesioner enemites...</span>
        </div>
      </div>
    );
  }

  // 2. Error / Not Found State
  if (error || !form) {
    return (
      <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5 text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Form Tidak Ditemukan</h2>
          <p className="text-white/60 mb-6 text-sm leading-relaxed">{error || "Form kuesioner ini tidak aktif atau telah dihapus."}</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition text-sm"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // 3. Expired State
  if (form.is_expired) {
    return (
      <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Periode Kuesioner Telah Berakhir</h2>
          <p className="text-white/60 mb-4 text-sm leading-relaxed">
            Form <span className="text-white font-semibold">"{form.title}"</span> sudah ditutup dan tidak lagi menerima respons baru.
          </p>
          {form.expires_at && (
            <p className="text-xs text-amber-400/80 bg-amber-500/10 py-1.5 px-3 rounded-lg inline-block mb-6">
              Berakhir pada: {new Date(form.expires_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
            </p>
          )}
          <div>
            <span className="text-xs text-white/40 block">Powered by enemites</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Success State
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white/[0.03] border border-emerald-500/20 rounded-2xl p-8 sm:p-10 text-center backdrop-blur-xl shadow-2xl animate-fade-in">
          <div className="w-18 h-18 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Terima Kasih!</h2>
          <p className="text-white/70 mb-6 text-base leading-relaxed">
            Jawaban kuesioner Anda untuk <strong className="text-white font-semibold">"{form.title}"</strong> telah berhasil kami terima.
          </p>
          <div className="inline-flex items-center space-x-2 text-xs text-emerald-400/80 bg-emerald-500/10 px-3.5 py-2 rounded-full mb-8">
            <ShieldCheck className="w-4 h-4" />
            <span>Respons tersimpan secara aman di sistem enemites</span>
          </div>
          <div>
            <span className="text-xs text-white/40 block">enemites intelligent forms</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Active Form Questionnaire Screen
  return (
    <div className="min-h-screen bg-[#08090d] text-white py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-indigo-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header Branding */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-black text-sm">
              e
            </div>
            <span className="font-semibold tracking-wider text-base uppercase text-white/90">enemites</span>
          </div>

          <div className="flex items-center space-x-2">
            {form.is_endless ? (
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                Active
              </span>
            ) : form.expires_at ? (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1 font-medium">
                <Clock className="w-3 h-3 inline mr-1" />
                <span>Hingga {new Date(form.expires_at).toLocaleDateString("id-ID")}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Form Title & Description Card */}
        <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl mb-6 shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">{form.title}</h1>
          {form.description && (
            <p className="text-white/70 text-sm sm:text-base leading-relaxed whitespace-pre-line">{form.description}</p>
          )}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
            <span>{form.questions.length} Pertanyaan</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Respons Rahasia & Aman
            </span>
          </div>
        </div>

        {/* Questionnaire Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {form.questions.map((q, idx) => {
            const hasError = Boolean(validationErrors[q.id]);
            const errorMsg = validationErrors[q.id];

            return (
              <div
                key={q.id || idx}
                className={`bg-white/[0.03] border rounded-2xl p-5 sm:p-6 backdrop-blur-lg transition duration-200 ${
                  hasError ? "border-red-500/60 bg-red-500/[0.02]" : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Question Label */}
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-base font-medium text-white/90">
                    <span className="text-cyan-400 font-semibold mr-1.5">{idx + 1}.</span>
                    {q.label}
                    {q.required && <span className="text-red-400 ml-1.5 font-bold" title="Wajib diisi">*</span>}
                  </label>
                </div>

                {/* Helper text */}
                {q.helperText && (
                  <p className="text-xs text-white/50 mb-3 flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 mr-1 inline shrink-0" />
                    <span>{q.helperText}</span>
                  </p>
                )}

                {/* Question Inputs by Type */}
                <div className="mt-2">
                  {/* 1. Text / Email / Phone / Number */}
                  {["text", "email", "phone", "number"].includes(q.type) && (
                    <input
                      type={q.type === "email" ? "email" : q.type === "number" ? "number" : "text"}
                      placeholder={q.placeholder || "Ketik jawaban Anda di sini..."}
                      value={responses[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                  )}

                  {/* 2. Textarea */}
                  {q.type === "textarea" && (
                    <textarea
                      rows={4}
                      placeholder={q.placeholder || "Tuliskan tanggapan Anda secara mendalam..."}
                      value={responses[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition resize-y"
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
                            className={`w-full text-left flex items-center justify-between p-3.5 rounded-xl border text-sm transition ${
                              isSelected
                                ? "bg-cyan-500/15 border-cyan-400/80 text-white font-medium"
                                : "bg-black/20 border-white/10 hover:border-white/20 text-white/80 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? "border-cyan-400 bg-cyan-400" : "border-white/30"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                              </div>
                              <span>{opt}</span>
                            </div>
                            {isSelected && <ChevronRight className="w-4 h-4 text-cyan-400" />}
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
                            className={`w-full text-left flex items-center justify-between p-3.5 rounded-xl border text-sm transition ${
                              isChecked
                                ? "bg-indigo-500/15 border-indigo-400/80 text-white font-medium"
                                : "bg-black/20 border-white/10 hover:border-white/20 text-white/80 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isChecked ? "border-indigo-400 bg-indigo-500 text-white" : "border-white/30"
                                }`}
                              >
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                              <span>{opt}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 5. Rating Scale (1-5 or 1-10) */}
                  {q.type === "rating" && (
                    <div className="pt-2">
                      {q.max && q.max > 5 ? (
                        // 1 to 10 Scale
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                          {Array.from({ length: q.max || 10 }, (_, i) => i + 1).map((val) => {
                            const isSelected = responses[q.id] === val;
                            return (
                              <button
                                type="button"
                                key={val}
                                onClick={() => handleInputChange(q.id, val)}
                                className={`py-3 rounded-xl border text-sm font-semibold transition flex flex-col items-center justify-center ${
                                  isSelected
                                    ? "bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20"
                                    : "bg-black/30 border-white/10 hover:border-white/30 text-white/80"
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        // 1 to 5 Stars Rating
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const isFilled = (responses[q.id] || 0) >= starVal;
                            return (
                              <button
                                type="button"
                                key={starVal}
                                onClick={() => handleInputChange(q.id, starVal)}
                                className="p-2 rounded-xl hover:bg-white/10 transition group"
                              >
                                <Star
                                  className={`w-7 h-7 sm:w-8 sm:h-8 transition ${
                                    isFilled
                                      ? "text-amber-400 fill-amber-400 scale-110"
                                      : "text-white/20 group-hover:text-amber-400/50"
                                  }`}
                                />
                              </button>
                            );
                          })}
                          {responses[q.id] && (
                            <span className="text-sm font-medium text-amber-400 ml-2">
                              {responses[q.id]} / 5
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Select / Dropdown */}
                  {q.type === "select" && (
                    <select
                      value={responses[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    >
                      <option value="" disabled className="bg-[#12141c] text-white/50">
                        -- Pilih Opsi --
                      </option>
                      {(q.options || []).map((opt, optIdx) => (
                        <option key={optIdx} value={opt} className="bg-[#12141c] text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Error message */}
                {hasError && (
                  <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>
            );
          })}

          {/* Submit Button Card */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold text-base flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Mengirimkan Jawaban...</span>
                </>
              ) : (
                <>
                  <span>Kirim Kuesioner</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-white/40 mt-4">
              Ditenagai oleh <span className="text-white/70 font-medium">enemites platform</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
