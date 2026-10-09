import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EligibleWaitlistForm } from "@/components/WaitlistForm";

export default function ParentWaitlistPage() {
  const [token] = useState(() => window.location.hash.slice(1));
  const [invitation, setInvitation] = useState<{ parent_email: string; age_group: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const meta = document.createElement("meta"); meta.name = "referrer"; meta.content = "no-referrer"; document.head.append(meta);
    window.history.replaceState(null, "", window.location.pathname);
    void fetch("/api/parent-permission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "inspect", token }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message); setInvitation(data.invitation); })
      .catch((cause) => setError(cause.message || "Unable to open this invitation. Please request a new one."));
    return () => { meta.remove(); };
  }, [token]);
  return <main className="product-site min-h-screen bg-[#0D1517] text-[#EDF1EF] px-4 py-20">
    <div className="max-w-2xl mx-auto mb-8"><Link to="/arena" className="text-sm underline">Enemites Arena</Link>
      <h1 className="nova-display text-3xl mt-6">Parent or guardian waitlist registration</h1>
      <p className="mt-3 text-sm text-[#AFBAB6]">Register your interest in Enemites for a learner. Launch notifications go to you. Permission for a future child account and age appropriate learning features will be handled separately before those features collect child data.</p>
    </div>
    {error ? <p role="alert" className="max-w-2xl mx-auto">{error}</p> : invitation
      ? <EligibleWaitlistForm ageGroup={invitation.age_group} parentInvitation={{ token, email: invitation.parent_email }} />
      : <p role="status" className="max-w-2xl mx-auto">Opening your invitation…</p>}
  </main>;
}
