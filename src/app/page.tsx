import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/games");

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Top nav */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚾</span>
          <span className="font-bold text-lg tracking-tight">Lineup Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-red-100 text-red-700 rounded-full mb-4">
            For coaches who hate spreadsheets
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Build your lineup{" "}
            <span className="text-red-600">in minutes</span>, not innings.
          </h1>
          <p className="mt-5 text-lg text-stone-600 leading-relaxed">
            Drag players onto the diamond. Plan all six innings. Print clean
            sheets for the dugout. Share with your assistant coaches before
            first pitch.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm"
            >
              Start free →
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-stone-700 hover:text-stone-900"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Free to try. No credit card required.
          </p>
        </div>

        {/* Hero diamond illustration */}
        <div className="relative">
          <div className="aspect-square rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-gradient-to-br from-green-700 to-green-800">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M 5 70 Q 50 -10 95 70 L 95 95 L 5 95 Z"
                fill="#3d7a31"
                opacity=".6"
              />
              <circle cx="50" cy="68" r="22" fill="#b9874a" />
              <polygon
                points="50,57 62,68 50,79 38,68"
                fill="#4a8b3b"
              />
              <rect
                x="48.5"
                y="77.5"
                width="3"
                height="3"
                fill="#fff"
                stroke="#333"
                strokeWidth=".3"
              />
              <rect
                x="60.5"
                y="66.5"
                width="3"
                height="3"
                fill="#fff"
                stroke="#333"
                strokeWidth=".3"
              />
              <rect
                x="48.5"
                y="55.5"
                width="3"
                height="3"
                fill="#fff"
                stroke="#333"
                strokeWidth=".3"
              />
              <rect
                x="36.5"
                y="66.5"
                width="3"
                height="3"
                fill="#fff"
                stroke="#333"
                strokeWidth=".3"
              />
              <circle cx="50" cy="68" r="2.5" fill="#d4a06a" />
              <line
                x1="50"
                y1="79"
                x2="5"
                y2="34"
                stroke="#fff"
                strokeWidth=".4"
              />
              <line
                x1="50"
                y1="79"
                x2="95"
                y2="34"
                stroke="#fff"
                strokeWidth=".4"
              />
              {/* Player chips */}
              {[
                { x: 50, y: 18, label: "CF" },
                { x: 22, y: 30, label: "LF" },
                { x: 78, y: 30, label: "RF" },
                { x: 43, y: 56, label: "SS" },
                { x: 57, y: 56, label: "2B" },
                { x: 35, y: 68, label: "3B" },
                { x: 65, y: 68, label: "1B" },
                { x: 50, y: 68, label: "P" },
                { x: 50, y: 91, label: "C" },
              ].map((s) => (
                <g key={s.label}>
                  <circle cx={s.x} cy={s.y} r="5" fill="white" stroke="#1f2937" strokeWidth=".4" />
                  <text
                    x={s.x}
                    y={s.y + 1.5}
                    textAnchor="middle"
                    fontSize="3.5"
                    fontWeight="700"
                    fill="#b91c1c"
                  >
                    {s.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-stone-200">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need on game day
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "🎯",
              title: "Drag-and-drop diamond",
              body: "Set positions visually, just like a magnetic board. Swap players in one drag.",
            },
            {
              icon: "🔁",
              title: "All six innings",
              body: "Plan your defensive rotation ahead of time. Copy from inning to inning.",
            },
            {
              icon: "📋",
              title: "Batting order",
              body: "Drag to reorder. Add or remove batters when players miss a game.",
            },
            {
              icon: "📊",
              title: "Player summary",
              body: "See at a glance who played where each inning, and who sat the bench.",
            },
            {
              icon: "🖨️",
              title: "Print-ready sheets",
              body: "One click to print a clean lineup for the dugout — fields, batting order, and all.",
            },
            {
              icon: "👥",
              title: "Share with your staff",
              body: "Send the lineup to assistant coaches and collect feedback before first pitch.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-stone-200">
        <h2 className="text-3xl font-bold text-center mb-3">Simple pricing</h2>
        <p className="text-center text-stone-600 mb-10">
          Try it free. Upgrade when you&apos;re ready to save your work.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="text-sm font-semibold uppercase text-stone-500 tracking-wider mb-1">
              Free
            </div>
            <div className="text-3xl font-bold mb-4">
              $0<span className="text-base font-normal text-stone-500">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-stone-600">
              <li>✓ Inning 1 lineup</li>
              <li>✓ Roster + batting order</li>
              <li>✗ No saved games</li>
              <li>✗ No sharing</li>
            </ul>
          </div>
          <div className="bg-stone-900 text-white p-6 rounded-xl border-2 border-red-600 relative">
            <span className="absolute -top-3 right-4 px-2 py-0.5 text-xs font-bold bg-red-600 rounded-full">
              POPULAR
            </span>
            <div className="text-sm font-semibold uppercase text-red-400 tracking-wider mb-1">
              Pro
            </div>
            <div className="text-3xl font-bold mb-4">
              $5<span className="text-base font-normal text-stone-400">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-stone-300">
              <li>✓ All 6 innings</li>
              <li>✓ Save unlimited games</li>
              <li>✓ Share with coaches</li>
              <li>✓ Player history across games</li>
              <li>✓ Pitcher rotation plan</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-sm text-stone-500">
          <div>⚾ Lineup Pro</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
