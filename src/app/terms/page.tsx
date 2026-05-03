import Link from "next/link";

export const metadata = {
  title: "Terms of Service · Lineup Pro",
};

const LAST_UPDATED = "May 2, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚾</span>
          <span className="font-bold text-lg tracking-tight">Lineup Pro</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 hover:border-stone-400"
        >
          ← Home
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 prose prose-stone">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-stone-500 mb-8">
          Last updated: {LAST_UPDATED}
        </p>

        <section className="space-y-6 text-stone-800 leading-relaxed">
          <p>
            These Terms of Service (&quot;<strong>Terms</strong>&quot;) govern
            your access to and use of Lineup Pro (the &quot;<strong>Service</strong>&quot;),
            operated through getlineuppro.com. By creating an account or using
            the Service, you agree to be bound by these Terms. If you don&apos;t
            agree, please don&apos;t use the Service.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">1. The Service</h2>
          <p>
            Lineup Pro is a web-based tool for baseball coaches to plan
            defensive rotations, batting orders, and pitching plans, manage
            team rosters, and share lineups with assistant coaches. The Service
            is provided &quot;as is&quot; and may change over time as we add
            features, fix bugs, or sunset features.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">2. Your Account</h2>
          <p>
            You need to create an account to use most features. You&apos;re
            responsible for keeping your password secure and for all activity
            under your account. Notify us at{" "}
            <a
              href="mailto:support@getlineuppro.com"
              className="text-red-700 underline"
            >
              support@getlineuppro.com
            </a>{" "}
            if you suspect your account has been compromised.
          </p>
          <p>You must be at least 18 years old to create an account.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            3. Subscription and Billing
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              The Service offers a free tier and paid &quot;Pro&quot; subscriptions
              (monthly and annual).
            </li>
            <li>
              Payments are processed by{" "}
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noopener"
                className="text-red-700 underline"
              >
                Stripe
              </a>
              . By subscribing you agree to Stripe&apos;s terms in addition to
              these Terms.
            </li>
            <li>
              Subscriptions auto-renew at the end of each billing period until
              canceled. Cancel anytime from your account settings — you&apos;ll
              keep Pro access through the end of the current paid period.
            </li>
            <li>
              <strong>Refunds:</strong> We don&apos;t offer prorated refunds for
              partial billing periods. If you believe you&apos;ve been charged
              in error, email us.
            </li>
            <li>
              We may change pricing with at least 30 days&apos; notice to
              existing subscribers.
            </li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3">
            4. Your Content (Rosters, Lineups, Photos, Notes)
          </h2>
          <p>
            You retain ownership of any content you create or upload (player
            names, photos, notes, lineups). By uploading, you grant us a
            limited license to store, display, and process that content for the
            sole purpose of providing the Service to you and the coaches you
            choose to share it with.
          </p>
          <p>
            <strong>You are responsible for the rights and consents</strong>{" "}
            for any photos or personal information you upload — including for
            minors on your roster. By uploading you confirm that you have
            authority to do so under the applicable league&apos;s policies and
            local law.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              Upload content that&apos;s unlawful, harassing, offensive, or
              violates someone&apos;s privacy
            </li>
            <li>
              Attempt to access another user&apos;s account or data without
              permission
            </li>
            <li>
              Reverse engineer, scrape, or systematically copy the Service
            </li>
            <li>
              Use the Service to send spam or for any commercial purpose other
              than managing your own team(s)
            </li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3">6. Termination</h2>
          <p>
            You can delete your account at any time by contacting{" "}
            <a
              href="mailto:support@getlineuppro.com"
              className="text-red-700 underline"
            >
              support@getlineuppro.com
            </a>
            . We may suspend or terminate your account if you violate these
            Terms. On termination, your data will be deleted within 30 days.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">7. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
            WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. We
            don&apos;t guarantee the Service will always be available, error-free,
            or that data won&apos;t be lost. <strong>Back up anything
            important.</strong>
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">
            8. Limitation of Liability
          </h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY ARISING
            OUT OF OR RELATED TO THE SERVICE IS LIMITED TO THE AMOUNT YOU PAID
            US IN THE 12 MONTHS PRECEDING THE CLAIM, OR USD $100, WHICHEVER IS
            GREATER. WE&apos;RE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR
            CONSEQUENTIAL DAMAGES.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">9. Changes to These Terms</h2>
          <p>
            We may update these Terms occasionally. Material changes will be
            announced via email or a notice in the app. Continued use after
            changes means you accept the updated Terms.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Illinois,
            United States, without regard to conflict of laws principles.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3">11. Contact</h2>
          <p>
            Questions? Email{" "}
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
            <Link href="/privacy" className="text-red-700 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
