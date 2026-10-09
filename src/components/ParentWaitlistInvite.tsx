import { useState } from "react";
import { Link } from "react-router-dom";

export default function ParentWaitlistInvite({ ageGroup }: { ageGroup: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="waitlist-form max-w-2xl mx-auto border border-[#253632] bg-[#101B1C] p-6 sm:p-10 text-[#EDF1EF] space-y-5" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/parent-permission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", parent_email: email.trim(), age_group: ageGroup }) });
      const data = await response.json(); setSent(response.ok); setMessage(data.message);
    } catch { setMessage("We could not send the invitation. Please try again later."); }
    finally { setBusy(false); }
  }}>
    <h2 className="nova-display text-xl">Join with your parent or guardian</h2>
    <p className="text-sm text-[#AFBAB6]">You can join the waitlist through your parent or guardian. Ask them before entering their email. They will receive a link to register their own contact details and receive launch notifications for you. Please do not enter your own name, phone number, or email.</p>
    {!sent && <>
      <label className="block text-sm">Parent or guardian email<input required type="email" maxLength={254} placeholder="parent@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="block mt-2 w-full border border-[#2D4035] bg-[#0D1517] p-3" /></label>
      <button type="submit" disabled={busy} className="bg-white text-black px-6 py-3 disabled:opacity-50">{busy ? "Sending invitation…" : "Invite my parent"}</button>
    </>}
    {message && <p role={sent ? "status" : "alert"} className="text-sm">{message}</p>}
    <p className="text-xs text-[#AFBAB6]">An invitation does not create a waitlist registration. Uncompleted invitations expire after seven days. <Link to="/arena/privacy-policy" className="underline">Privacy Policy</Link></p>
  </form>;
}
