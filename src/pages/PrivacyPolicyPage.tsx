import ResponsiveHeader from "@/components/ResponsiveHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const PrivacyPolicyPage = () => {
  useScrollAnimation();

  return (
    <div className="min-h-screen bg-[var(--nova-bone)] text-[var(--nova-void)]">
      <ResponsiveHeader />

      <main className="px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <section
          className="mx-auto max-w-5xl opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
          data-scroll="fade-up"
        >
          <div className="border-b border-[var(--nova-void)]/15 pb-8 sm:pb-10">
            <p className="nova-mono text-xs font-medium uppercase tracking-[0.24em] text-[var(--nova-brand)]">
              Legal / Privacy Policy
            </p>
            <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_0.55fr] lg:items-end">
              <div>
                <h1
                  className="nova-display font-medium leading-[1.05] tracking-normal"
                  style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
                >
                  Privacy Policy
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-[1.7] text-[#464B58] sm:text-lg">
                  This Privacy Policy explains how Enemites collects, uses, and protects information
                  when you join the waitlist, request early access, explore demos, or use available
                  learning simulations and AI mentor experiences.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--nova-void)]/10 bg-white/45 p-5 text-sm leading-[1.6] text-[#464B58]">
                <p className="font-semibold text-[var(--nova-void)]">Current product status</p>
                <p className="mt-2">
                  Enemites is in a waitlist and private beta stage. Data practices may become more
                  detailed as more features, simulations, and account systems become available.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-3 rounded-xl border border-[var(--nova-void)]/10 bg-white/40 p-4 text-sm text-[#464B58]">
                <p className="nova-mono text-xs uppercase tracking-[0.18em] text-[var(--nova-brand)]">
                  Summary
                </p>
                <p>We do not sell personal information.</p>
                <p>We use data to run and improve Enemites.</p>
                <p>You can contact us about your data.</p>
              </div>
            </aside>

            <div className="space-y-5 text-sm leading-[1.7] text-[#464B58] sm:text-base">
              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  1. Information We Collect
                </h2>
                <p className="mt-3">
                  The information we collect depends on how you interact with Enemites. It may include:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>
                    <span className="font-semibold text-[var(--nova-void)]">Contact information</span>{" "}
                    such as your email address when you join the waitlist, request access, or
                    contact us.
                  </li>
                  <li>
                    <span className="font-semibold text-[var(--nova-void)]">Site usage data</span>{" "}
                    such as pages visited, buttons clicked, device/browser information, and basic
                    analytics that help us understand how people explore Enemites.
                  </li>
                  <li>
                    <span className="font-semibold text-[var(--nova-void)]">
                      Learning and interaction data
                    </span>{" "}
                    when available, such as simulation choices, written reflections, decision
                    paths, mentor interactions, and progress indicators.
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  2. How We Use Information
                </h2>
                <p className="mt-3">
                  We use information to operate, test, and improve Enemites. This includes:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Managing the waitlist, private beta, and early access invitations.</li>
                  <li>Sending product updates, access notices, and policy changes.</li>
                  <li>Improving simulations, scenario design, mentor feedback, and product reliability.</li>
                  <li>Detecting abuse, misuse, security issues, bugs, and technical problems.</li>
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  3. Cookies and Similar Technologies
                </h2>
                <p className="mt-3">
                  Enemites may use cookies or similar technologies for basic site functionality,
                  analytics, remembering preferences, and understanding how people navigate the
                  product. Browser settings may allow you to limit or block some of these
                  technologies, although parts of the experience may not work as intended.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  4. Data Retention
                </h2>
                <p className="mt-3">
                  We keep information only as long as needed for the purposes described in this
                  policy, including waitlist management, product testing, support, security,
                  analytics, legal compliance, and service improvement. Retention periods may vary
                  depending on the type of data and the stage of the product.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  5. How We Share Information
                </h2>
                <p className="mt-3">
                  We do not sell your personal information. We may share information in limited
                  situations, including:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>With service providers that help us operate hosting, analytics, forms, or email.</li>
                  <li>When required by law, regulation, legal process, or security obligations.</li>
                  <li>
                    In connection with a merger, acquisition, financing, or similar business change,
                    with appropriate steps to continue protecting personal information.
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  6. Students and Young Users
                </h2>
                <p className="mt-3">
                  Enemites is designed for students and learners. If you are under the age required to
                  consent to online services in your region, use Enemites only with appropriate parent,
                  guardian, school, or institutional permission. As Enemites expands, additional
                  controls may be added for school, campus, or organization-based use.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  7. Your Choices and Rights
                </h2>
                <p className="mt-3">
                  Depending on your location, you may have rights to access, correct, delete, or
                  request a copy of certain personal information. You may also opt out of some
                  product communications. To make a privacy request, contact us using the email
                  below.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  8. Data Security
                </h2>
                <p className="mt-3">
                  We use reasonable technical and organizational measures to protect information
                  from unauthorized access, loss, misuse, or alteration. No online system is
                  perfectly secure, so we cannot guarantee absolute security.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  9. Third-Party Services
                </h2>
                <p className="mt-3">
                  Enemites may use third-party services such as waitlist forms, hosting providers,
                  analytics tools, video embeds, or email systems. These providers process
                  information according to their own terms and privacy policies.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  10. Changes to This Privacy Policy
                </h2>
                <p className="mt-3">
                  As Enemites evolves, we may update this Privacy Policy. If we make material changes,
                  we will update the last updated date and, where appropriate, provide additional
                  notice. Continued use of Enemites after changes take effect means you accept the
                  updated policy.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[var(--nova-void)] p-5 text-[var(--nova-bone)] sm:p-7">
                <h2 className="nova-display text-xl font-medium">11. Contact</h2>
                <p className="mt-3 text-[rgba(232,228,217,0.75)]">
                  If you have questions about this Privacy Policy or how Enemites handles data,
                  contact us at:
                </p>
                <a
                  href="mailto:support@enemitesarena.tech"
                  className="mt-3 inline-flex text-[var(--nova-bone)] underline decoration-[var(--nova-brand)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--nova-brand)]"
                >
                  support@enemitesarena.tech
                </a>
              </section>

              <p className="nova-mono pt-2 text-xs uppercase tracking-[0.16em] text-[#646A78]">
                Last updated: {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
