import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  MessageSquare,
  Mail,
  Terminal,
  Activity,
} from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#05060b] text-zinc-400 py-24 px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-mono text-zinc-500 hover:text-indigo-400 transition-colors mb-8"
        >
          <ChevronLeft size={16} className="mr-1" /> Back to Hub
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl text-white font-medium tracking-tight mb-4">
            System Support
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl">
            Having trouble with your node integration, code compilation, or
            matchmaking? Our engineering team and community are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Discord CTA */}
          <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                <MessageSquare size={24} className="text-white" />
              </div>
              <h3 className="text-2xl text-white font-medium mb-2">
                Community Discord
              </h3>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                The fastest way to get help. Connect with other Grandmasters,
                report bugs directly to developers, and discuss algorithmic
                strategies.
              </p>
            </div>
            <Link
              href="https://discord.com/channels/1308083728035217429/1478339574592835634"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-md hover:bg-indigo-500 transition-colors"
            >
              Join the Server
            </Link>
          </div>

          {/* Email Support */}
          <div className="border border-zinc-800 bg-[#0a0014] rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center mb-6">
                <Mail size={24} className="text-zinc-300" />
              </div>
              <h3 className="text-2xl text-white font-medium mb-2">
                Direct Email
              </h3>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                For account issues, API quota increases, or reporting critical
                security vulnerabilities in the isolated sandboxes.
              </p>
            </div>
            <a
              href="mailto:support@maverickswatantra@gmail.com"
              className="w-full text-center px-6 py-3 bg-white text-black text-sm font-bold rounded-md hover:bg-zinc-200 transition-colors"
            >
              support@elonode.online
            </a>
          </div>
        </div>

        <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
          <Terminal size={24} className="text-indigo-400" />
          System FAQs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-zinc-900 bg-[#0a0014] p-6 rounded-xl">
            <h4 className="text-white font-bold mb-2">
              My code timed out, but it works locally?
            </h4>
            <p className="text-sm leading-relaxed text-zinc-500">
              Our Judge0 execution engines run in isolated containers with
              strict resource limits. Ensure your algorithm time complexity is
              optimized for large hidden test cases.
            </p>
          </div>
          <div className="border border-zinc-900 bg-[#0a0014] p-6 rounded-xl">
            <h4 className="text-white font-bold mb-2">
              How is ELO calculated?
            </h4>
            <p className="text-sm leading-relaxed text-zinc-500">
              We use a modified percentile-based ELO formula. Winning against
              higher-rated Grandmasters yields significantly more points than
              defeating Newbies.
            </p>
          </div>
          <div className="border border-zinc-900 bg-[#0a0014] p-6 rounded-xl">
            <h4 className="text-white font-bold mb-2">
              I suspect an opponent cheated.
            </h4>
            <p className="text-sm leading-relaxed text-zinc-500">
              Our system runs automated payload verifications. If you suspect
              foul play, please open a ticket in our Discord #reports channel
              with the Match ID.
            </p>
          </div>
          <div className="border border-zinc-900 bg-[#0a0014] p-6 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-white font-bold mb-2">System Status</h4>
              <p className="text-sm text-zinc-500">
                Check current WebSocket latency and server loads.
              </p>
            </div>
            <Activity size={24} className="text-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
