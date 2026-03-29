import React from "react";
import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#05060b] text-zinc-400 py-24 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-mono text-zinc-500 hover:text-indigo-400 transition-colors mb-8"
        >
          <ChevronLeft size={16} className="mr-1" /> Back to Hub
        </Link>

        <div className="border border-zinc-900 bg-[#0a0014] rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Lock size={200} />
          </div>

          <h1 className="text-3xl md:text-5xl text-white font-medium tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm font-mono text-zinc-500 mb-12 uppercase tracking-widest">
            Last Updated: March 2026
          </p>

          <div className="space-y-8 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                1. Information We Collect
              </h2>
              <p className="mb-3">
                When you initialize your node and use Elonode, we collect the
                following:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                <li>
                  <strong className="text-white">Authentication Data:</strong>{" "}
                  Managed securely via Clerk. We store your unique Node ID,
                  username, and connected OAuth profiles (like GitHub).
                </li>
                <li>
                  <strong className="text-white">Match Data:</strong> Code
                  submissions, execution time, memory usage, and match outcomes.
                </li>
                <li>
                  <strong className="text-white">Telemetry:</strong> WebSocket
                  connection stability logs to improve matchmaking quality.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                2. How We Use Your Information
              </h2>
              <p>
                We use your data strictly to operate the Elonode arena. Match
                data is used to calculate your dynamic ELO rating. Code
                submissions are isolated and executed to determine match
                results. Telemetry data helps us provision backend architecture
                on AWS/Render during high-load spikes.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                3. Data Sharing & Security
              </h2>
              <p>
                Elonode does not sell your personal data. Code payloads are
                transmitted via encrypted WebSocket channels (AES-128 minimum)
                to our Judge0 execution servers. We may share anonymized
                aggregate data (such as language popularity or average solve
                times) for community leaderboards.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                4. Third-Party Services
              </h2>
              <p>
                We integrate with essential third-party infrastructure: Clerk
                (Authentication), PostgreSQL (Database), and Judge0 (Code
                Execution Sandbox). These providers are bound by strict data
                protection agreements and only process data required for their
                specific functions.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                5. Your Rights
              </h2>
              <p>
                You have the right to request a complete export of your match
                history and ELO progression. You may also request the deletion
                of your account, which will permanently erase your unique Node
                ID and associated code submissions from our primary databases.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
