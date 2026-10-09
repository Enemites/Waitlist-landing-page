import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AGE_OPTIONS } from "../../shared/privacy";

export default function AgeGate({ children, className = "" }: { children: (ageGroup: string) => ReactNode; className?: string }) {
  const id = useId();
  const [ageGroup, setAgeGroup] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) return <>{children(ageGroup)}</>;
  return (
    <section className={`border border-[#253632] bg-[#101B1C] p-6 sm:p-10 text-[#EDF1EF] space-y-5 ${className}`} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-medium">Before you continue</h2>
        <>
          <label htmlFor={id} className="block text-sm">What is your age group?</label>
          <select id={id} value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} className="w-full border border-[#2D4035] bg-[#0D1517] p-3 text-sm">
            <option value="" disabled>Select your age group</option>
            {AGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button type="button" disabled={!ageGroup} className="bg-white text-black px-6 py-3 disabled:opacity-50" onClick={() => setConfirmed(true)}>Continue</button>
          <p className="text-xs text-[#AFBAB6]">We ask before collecting your contact details or answers. We do not store your date of birth. Depending on your location, additional parent or guardian permission may be required.</p>
        </>
      <Link to="/arena/privacy-policy" className="inline-block text-sm underline">Privacy Policy</Link>
    </section>
  );
}
