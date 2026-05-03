import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Privacy Policy · Lineup Pro",
};

const LAST_UPDATED = "May 2, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo height={44} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 hover:border-stone-400"
        >
          ← Home
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 prose prose-stone">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-stone-500 mb-8">
          Last updated: {LAST_UPDATED}
        </p>

        <section className="space-y-6 text-stone-800 leading-relaxed">
          <p>
            This Privacy Policy explains what information Lineup Pro
            (&quot;we&quot;, &quot;us&quot;) collects, how we use it, and the
            choices you have. We try to keep this short and plain-English.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            1. Information You Give Us
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Account info:</strong> your email address and a hashed
              password (handled by{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener"
                className="text-red-700 underline"
              >
                Supabase
              </a>{" "}
              auth).
            </li>
            <li>
              <strong>Roster + lineup data:</strong> team names, player names,
              optional jersey numbers, photos, coaching notes, and per-game
              defensive/batting/pitching plans.
            </li>
            <li>
              <strong>Payment info:</strong> if you subscribe to Pro, payment
              details are collected and stored by{" "}
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noopener"
                className="text-red-700 underline"
              >
                Stripe
              </a>{" "}
              — we never see your full card number.
            </li>
            <li>
              <strong>Optional integrations:</strong> if you connect a
              GameChanger team schedule widget, we store the widget ID you
              provide.
            </li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3">
            2. Information Collected Automatically
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Usage data:</strong> standard server logs (IP address,
              browser type, pages visited) handled by our hosting provider{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener"
                className="text-red-700 underline"
              >
                Vercel
              </a>
              .
            </li>
            <li>
              <strong>Cookies:</strong> we use essential cookies for login
              sessions. We don&apos;t use advertising or tracking cookies.
            </li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>To provide the Service (storing rosters, lineups, etc.)</li>
            <li>
              To process payments and manage subscriptions (via Stripe)
            </li>
            <li>
              To communicate with you about your account (password resets,
              billing, important updates)
            </li>
            <li>To diagnose problems and improve the Service</li>
          </ul>
          <p>
            We <strong>do not</strong> sell your data, share it for advertising,
            or use it to train AI models.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            4. Who We Share Information With
          </h2>
          <p>
            We use a small number of service providers that process data on our
            behalf:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Supabase</strong> — database + authentication
            </li>
            <li>
              <strong>Stripe</strong> — payment processing
            </li>
            <li>
              <strong>Vercel</strong> — hosting + delivery
            </li>
            <li>
              <strong>GameChanger</strong> — schedule widget (only if you
              choose to enable it)
            </li>
          </ul>
          <p>
            We may also share data when required by law or to protect rights or
            safety.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            5. Sharing You Initiate
          </h2>
          <p>
            When you generate a public share link for a game, anyone with that
            link can view the lineup and submit comments. Don&apos;t share that
            link with anyone you don&apos;t want to see the lineup or roster
            names.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            6. Information About Minors (COPPA)
          </h2>
          <p>
            Lineup Pro is a tool for <strong>coaches</strong>. We don&apos;t
            knowingly collect information directly from children under 13. When
            a coach creates a player record (which may include a minor&apos;s
            name and photo), the coach is responsible for having the appropriate
            consent under their league&apos;s policies and applicable law (e.g.,
            COPPA in the US).
          </p>
          <p>
            If you believe a child has provided us information directly,
            contact{" "}
            <a
              href="mailto:support@getlineuppro.com"
              className="text-red-700 underline"
            >
              support@getlineuppro.com
            </a>{" "}
            and we&apos;ll delete it promptly.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            7. Data Retention &amp; Your Rights
          </h2>
          <p>
            We retain your data for as long as your account is active. You can:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              View and edit your data at any time inside the app (rosters,
              games, notes, photos)
            </li>
            <li>Delete individual players, games, or photos directly</li>
            <li>
              Request a full export or full deletion of your account by emailing{" "}
              <a
                href="mailto:support@getlineuppro.com"
                className="text-red-700 underline"
              >
                support@getlineuppro.com
              </a>{" "}
              — we&apos;ll respond within 30 days
            </li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3">8. Security</h2>
          <p>
            We use industry-standard practices (TLS in transit, encrypted at
            rest via Supabase, hashed passwords, row-level security so users
            can only see their own data). No system is 100% secure — please use
            a strong unique password and notify us immediately of any suspected
            breach.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            9. International Users
          </h2>
          <p>
            Lineup Pro is operated from the United States. Your data may be
            processed in the US. By using the Service from outside the US, you
            consent to that transfer.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Policy from time to time. Material changes will
            be announced by email or in-app. The &quot;Last updated&quot; date
            at the top of this page reflects the current version.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">11. Contact</h2>
          <p>
            Questions about privacy? Email{" "}
            <a
              href="mailto:support@getlineuppro.com"
              className="text-red-700 underline"
            >
              support@getlineuppro.com
            </a>
            .
          </p>

          <hr className="my-10 border-stone-200" />
          <p className="text-sm text-stone-500">
            See also our{" "}
            <Link href="/terms" className="text-red-700 underline">
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
