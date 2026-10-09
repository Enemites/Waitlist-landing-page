import ResponsiveHeader from "@/components/ResponsiveHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const PrivacyPolicyPage = () => {
  useScrollAnimation();

  return (
    <div className="product-site legal-product min-h-screen bg-[var(--nova-bone)] text-[var(--nova-void)]">
      <ResponsiveHeader theme="dark" />

      <main className="px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <section
          className="mx-auto max-w-5xl opacity-100 transform translate-y-0 transition-all duration-1000 ease-out"
          data-scroll="fade-up"
        >
          <div className="border-b border-[var(--nova-void)]/15 pb-6 sm:pb-10">
            <p className="nova-mono text-[10px] sm:text-xs font-medium uppercase tracking-[0.24em] text-[var(--nova-brand)]">
              Legal / Privacy Policy
            </p>
            <div className="mt-4 sm:mt-5 grid gap-6 lg:grid-cols-[0.9fr_0.55fr] lg:items-end">
              <div>
                <h1
                  className="nova-display font-medium leading-[1.1] sm:leading-[1.05] tracking-normal"
                  style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)" }}
                >
                  Privacy Policy
                </h1>
                <p className="nova-mono mt-3 text-xs text-[#AFBAB6]">
                  Last updated: <time dateTime="2026-10-09">October 9, 2026</time>
                </p>
                <p className="mt-3 sm:mt-5 max-w-3xl text-xs sm:text-base leading-relaxed sm:leading-[1.7] text-[#AFBAB6] md:text-lg">
                  This Privacy Policy explains how Enemites collects, uses, and protects information
                  when you join the waitlist, request early access, explore demos, or use available
                  learning simulations and AI mentor experiences.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/45 p-4 sm:p-5 text-xs sm:text-sm leading-relaxed sm:leading-[1.6] text-[#AFBAB6]">
                <p className="font-semibold text-[var(--nova-void)]">Current product status</p>
                <p className="mt-1.5 sm:mt-2">
                  Enemites is in a waitlist and private beta stage. Data practices may become more
                  detailed as more features, simulations, and account systems become available.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-3 rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/40 p-4 text-sm text-[#AFBAB6]">
                <p className="nova-mono text-xs uppercase tracking-[0.18em] text-[var(--nova-brand)]">
                  Summary
                </p>
                <p>We do not sell personal information.</p>
                <p>We use data to run and improve Enemites.</p>
                <p>You can contact us about your data.</p>
              </div>
            </aside>

            <div className="space-y-5 text-sm leading-[1.7] text-[#AFBAB6] sm:text-base">
              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  1. Information We Collect
                </h2>
                <p className="mt-3">
                  The information we collect depends on how you interact with Enemites. It may include:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>
                    <span className="font-semibold text-[var(--nova-void)]">Contact information</span>{" "}
                    including your name, phone/WhatsApp number, email address, and age group
                    when you join the waitlist, plus the request for launch notifications and your choice about updates beyond the launch. For a parent-led entry, these contact details belong to the parent or guardian; we also record the date and notice version of their permission.
                  </li>
                  <li>
                    <span className="font-semibold text-[var(--nova-void)]">Site usage data</span>{" "}
                    Hosting providers receive technical request information, including your IP address,
                    to deliver the site and protect it. Our form handlers do not save new IP addresses,
                    location data, browser details, or screen sizes in registration or survey records. The current landing page has no analytics pipeline. Future IP-based security or analytics processing will have a defined purpose, legal basis, access controls, and retention appropriate to that purpose; it is not categorically prohibited.
                  </li>
                  <li>
                    <span className="font-semibold text-[var(--nova-void)]">
                      Learning and interaction data
                    </span>{" "}
                    including answers you submit to public questionnaires, an age group,
                    and the version of the privacy notice. Please do not include sensitive personal information in free-text answers.
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  2. How We Use Information
                </h2>
                <p className="mt-3">
                  We use information to operate, test, and improve Enemites. This includes:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Managing the waitlist, private beta, and early access invitations.</li>
                  <li>Sending the launch and early access notifications you request by joining the waitlist. The optional checkbox controls only updates beyond the launch, such as product news. Promotional messages include an unsubscribe link.</li>
                  <li>Improving simulations, scenario design, mentor feedback, and product reliability.</li>
                  <li>Detecting abuse, misuse, security issues, bugs, and technical problems.</li>
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  3. Cookies and Similar Technologies
                </h2>
                <p className="mt-3">
                  The landing page does not initialize analytics or session replay tools. Fonts are served
                  from our own site. Embedded YouTube video loads only after you choose to allow it;
                  YouTube then receives your IP address and may process playback data. Your choice
                  is held only in page memory and is reset when you reload.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  4. Data Retention
                </h2>
                <p className="mt-3">
                  We keep information only as long as needed for the purposes described in this
                  policy, including waitlist management, support, security, and legal compliance. Parent invitation links expire after seven days. Uncompleted requests are removed by the daily cleanup, within eight days of the request when the scheduled cleanup is operating. If you ask to withdraw a pending request, contact support@enemites.com. Parent permission records are retained with the corresponding waitlist entry as evidence of the request. Other retention periods depend on the purpose and applicable obligations, and are reviewed when that purpose ends.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  5. How We Share Information
                </h2>
                <p className="mt-3">
                  We do not sell your personal information. We may share information in limited
                  situations, including:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>With hosting and database providers (including Vercel and Neon) that help us operate the site and forms, and email delivery providers that send requested launch notifications, parent invitations, or optional updates. Parent invitation delivery uses Resend when configured. These providers may process data outside your country, including in the United States; applicable safeguards are required for international transfers.</li>
                  <li>When required by law, regulation, legal process, or security obligations.</li>
                  <li>
                    In connection with a merger, acquisition, financing, or similar business change,
                    with appropriate steps to continue protecting personal information.
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  6. Students and Young Users
                </h2>
                <p className="mt-3">
                  Learners under 13 can join through a parent or guardian. We first ask for a parent email solely to send an invitation; we do not request the child's name, phone number, or email. The parent opens the email link, reads the notice, and registers their own contact details to receive launch notifications for the learner. This verifies access to that email and records the adult's declaration and permission for the waitlist; it does not independently establish the family relationship or authorize a future child account. Public questionnaires for this age group must be answered by the parent with their own information, without identifying the child. Contact support@enemites.com to review, correct, or delete an entry or withdraw permission. Local rules may require additional permission for older minors; any required permission must be obtained before the relevant child data collection.
                </p>
                <p className="mt-3">
                  The launched learning service is planned to distinguish child and adult experiences: age appropriate educational scenarios and mentor responses, restrictions on adult-only content and social features, and parent controls where required. Adult participation will not automatically make adult-only content available to children. These product features are not active on this waitlist. Before launch, we will explain the actual child data practices and obtain any additional parental permission required before collecting that data; waitlist permission is not carried over as blanket consent.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  7. Your Choices and Rights
                </h2>
                <p className="mt-3">
                  Depending on your location, you may have rights to access, correct, delete, or
                  request a copy of certain personal information. You can stop marketing emails using the unsubscribe link in each message,
                  without signing in, or contact support@enemites.com. To make a privacy request,
                  contact us using the email below.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  8. Data Security
                </h2>
                <p className="mt-3">
                  We use reasonable technical and organizational measures to protect information
                  from unauthorized access, loss, misuse, or alteration. No online system is
                  perfectly secure, so we cannot guarantee absolute security.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  9. Third-Party Services
                </h2>
                <p className="mt-3">
                  The site uses hosting and database providers. Our fonts and main images and videos are
                  served from this site; optional YouTube playback connects to YouTube after your
                  choice. Following external social or research links takes you to another service.
                  Those services have their own privacy practices.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[#131D20]/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  10. Changes to This Privacy Policy
                </h2>
                <p className="mt-3">
                  As Enemites evolves, we may update this Privacy Policy. If we make material changes,
                  we will update the last updated date and, where appropriate, provide additional
                  notice. Where consent is required for a new use, we will request it separately.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[var(--nova-void)] p-5 text-[var(--nova-bone)] sm:p-7">
                <h2 className="nova-display text-xl font-medium">11. Contact</h2>
                <p className="mt-3 text-[rgba(232,228,217,0.75)]">
                  If you have questions about this Privacy Policy or how Enemites handles data,
                  contact us at:
                </p>
                <a
                  href="mailto:support@enemites.com"
                  className="mt-3 inline-flex text-[var(--nova-bone)] underline decoration-[var(--nova-brand)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--nova-brand)]"
                >
                  support@enemites.com
                </a>
              </section>

              <p className="nova-mono pt-2 text-xs uppercase tracking-[0.16em] text-[#646A78]">
                Last updated: <time dateTime="2026-10-09">October 9, 2026</time>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
