import React from "react";
import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";

export default function TermsPage() {
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
            <Shield size={200} />
          </div>

          <h1 className="text-3xl md:text-5xl text-white font-medium tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm font-mono text-zinc-500 mb-12 uppercase tracking-widest">
            Last Updated: March 2026
          </p>

          <div className="space-y-8 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                1. Agreement to Terms
              </h2>
              <p>
                By initializing a node, accessing, or using the Elonode
                platform, you agree to be bound by these Terms of Service. If
                you do not agree to these terms, you may not access or use our
                services. Elonode provides an algorithmic competitive
                programming environment.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                2. Platform Usage & Code Execution
              </h2>
              <p className="mb-3">
                Our platform utilizes isolated, containerized environments
                (powered by Judge0) to execute user-submitted code. You agree
                NOT to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                <li>
                  Submit malicious code designed to exploit, damage, or
                  compromise the execution sandboxes.
                </li>
                <li>
                  Attempt to bypass resource limits (Time Limit Exceeded, Memory
                  Limit Exceeded).
                </li>
                <li>
                  Use the execution engine for cryptocurrency mining, DDoS
                  attacks, or any non-algorithmic computational tasks.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                3. Fair Play & Competitive Integrity
              </h2>
              <p>
                Elonode is built on pure algorithmic duels. Any form of
                cheating, including but not limited to using multiple accounts
                to manipulate ELO ratings, utilizing unauthorized external APIs
                during a match, or plagiarizing code from other participants,
                will result in immediate hardware ban and permanent account
                termination. Your ELO rating is a reflection of your own skill.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                4. Intellectual Property
              </h2>
              <p>
                The code you submit during matches remains your intellectual
                property. However, by submitting code to Elonode, you grant us a
                license to store, compile, execute, and analyze the code for
                matchmaking, anti-cheat verification, and leaderboard generation
                purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">
                5. Disclaimer of Warranties
              </h2>
              <p>
                The platform is provided "as is" without warranty of any kind.
                While we strive for sub-second WebSocket latency and 99.9%
                uptime for our execution engine, Elonode does not guarantee that
                the service will be uninterrupted or error-free during peak
                competition hours.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
