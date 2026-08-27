import ResponsiveHeader from "@/components/ResponsiveHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TermsOfServicePage = () => {
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
              Legal / Terms of Service
            </p>
            <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_0.55fr] lg:items-end">
              <div>
                <h1
                  className="nova-display font-medium leading-[1.05] tracking-normal"
                  style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
                >
                  Terms of Service
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-[1.7] text-[#464B58] sm:text-lg">
                  These Terms govern your access to Enemites, a private beta learning environment
                  that turns problem-based learning into adaptive world simulations with an AI
                  mentor.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--nova-void)]/10 bg-white/45 p-5 text-sm leading-[1.6] text-[#464B58]">
                <p className="font-semibold text-[var(--nova-void)]">Current product status</p>
                <p className="mt-2">
                  Enemites is currently offered through a waitlist and early access experience.
                  Features, simulations, and mentor behavior may change while the product is being
                  tested.
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
                <p>Use Enemites responsibly.</p>
                <p>Early access can change.</p>
                <p>AI feedback needs judgment.</p>
              </div>
            </aside>

            <div className="space-y-5 text-sm leading-[1.7] text-[#464B58] sm:text-base">
              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  1. Acceptance of Terms
                </h2>
                <p className="mt-3">
                  By accessing Enemites, joining the waitlist, requesting early access, exploring
                  demos, or using any available simulation or AI mentor experience, you agree to
                  these Terms. If you do not agree, you should not use Enemites.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  2. Who Enemites Is For
                </h2>
                <p className="mt-3">
                  Enemites is built for students, learners, and problem solvers who want to train
                  decision making and problem-solving ability through short, adaptive learning
                  simulations. You are responsible for making sure your use of Enemites follows
                  applicable laws, school or campus rules, and age requirements in your region.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  3. Waitlist and Early Access
                </h2>
                <p className="mt-3">
                  Enemites may be available only as a waitlist, private beta, limited access demo, or
                  experimental environment. By joining the waitlist or requesting access, you:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Understand that features, arenas, scenarios, and feedback may change.</li>
                  <li>Accept that bugs, downtime, data resets, or limited availability may occur.</li>
                  <li>
                    Allow us to contact you using the email you provide for Enemites updates, access
                    invites, and product-related notices.
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  4. Responsible Use
                </h2>
                <p className="mt-3">
                  You agree to use Enemites for learning, reflection, and capability development. You
                  agree not to:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Bypass security, exploit bugs, overload systems, or interfere with stability.</li>
                  <li>Use Enemites to create, rehearse, or encourage harmful, abusive, or illegal acts.</li>
                  <li>
                    Misrepresent yourself, impersonate another person, or attempt to reverse
                    engineer non-public systems.
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  5. Learning Data and Experience Logs
                </h2>
                <p className="mt-3">
                  Enemites is designed to record meaningful parts of a learning run, including choices,
                  reasoning, reflections, decision paths, and progress indicators. This helps Enemites
                  adapt the experience and build a clearer picture of problem-solving capability.
                </p>
                <p className="mt-3">
                  Details about how information is collected, used, shared, and protected are
                  described in the Privacy Policy.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  6. No Guaranteed Outcomes
                </h2>
                <p className="mt-3">
                  Enemites is intended to support learning and problem-solving practice. We do not
                  guarantee specific academic, career, admission, hiring, or life outcomes. You
                  remain responsible for how you use feedback, simulation results, and any decisions
                  you make outside Enemites.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  7. Intellectual Property
                </h2>
                <p className="mt-3">
                  Enemites, including its interface, simulations, scenarios, visual assets, feedback
                  systems, and product experience, is owned by Enemites or its licensors unless stated
                  otherwise. You may not copy, redistribute, sell, or commercially exploit these
                  materials without permission.
                </p>
                <p className="mt-3">
                  You keep ownership of original content you submit, such as reflections or written
                  responses, but you grant Enemites permission to process that content to operate,
                  improve, and personalize the service.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  8. Experimental AI Mentor
                </h2>
                <p className="mt-3">
                  The AI mentor and adaptive systems in Enemites are experimental. They may provide
                  incomplete, inaccurate, or unsuitable feedback. Use your own judgment, and consult
                  teachers, mentors, or qualified professionals before relying on Enemites feedback for
                  important decisions.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  9. Limitation of Liability
                </h2>
                <p className="mt-3">
                  To the maximum extent permitted by law, Enemites and its team will not be liable for
                  indirect, incidental, special, consequential, or punitive damages, or for loss of
                  data, opportunities, profits, or reputation arising from your use of Enemites. You
                  use the service at your own risk.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-white/55 p-5 sm:p-7">
                <h2 className="nova-display text-xl font-medium text-[var(--nova-void)]">
                  10. Changes to These Terms
                </h2>
                <p className="mt-3">
                  Because Enemites is actively evolving, we may update these Terms from time to time.
                  If we make material changes, we will update the last updated date and, where
                  appropriate, provide additional notice. Continued use of Enemites after changes take
                  effect means you accept the updated Terms.
                </p>
              </section>

              <section className="rounded-xl border border-[var(--nova-void)]/10 bg-[var(--nova-void)] p-5 text-[var(--nova-bone)] sm:p-7">
                <h2 className="nova-display text-xl font-medium">11. Contact</h2>
                <p className="mt-3 text-[rgba(232,228,217,0.75)]">
                  If you have questions about these Terms or how Enemites works, contact us at:
                </p>
                <a
                  href="mailto:support@enemites.com"
                  className="mt-3 inline-flex text-[var(--nova-bone)] underline decoration-[var(--nova-brand)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--nova-brand)]"
                >
                  support@enemites.com
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

export default TermsOfServicePage;
