import React from "react";
import Link from "next/link";
import { ChevronLeft, TerminalSquare } from "lucide-react";

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen bg-[#05060b] text-zinc-400 py-32 px-6 font-sans relative overflow-hidden flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full text-center relative z-10">
        <TerminalSquare
          size={64}
          className="mx-auto text-indigo-500 mb-8 opacity-50"
        />
        <h1 className="text-4xl md:text-5xl text-white font-medium tracking-tight mb-4">
          API Reference
        </h1>
        <p className="text-zinc-400 mb-8 text-lg">
          We are currently building the public REST API for Elonode. Soon, you
          will be able to programmatically access match history, global
          leaderboards, and user stats.
        </p>
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg font-mono text-sm text-zinc-500 mb-12 inline-block">
          $ curl https://api.elonode.online/v1/status
          <br />
          <span className="text-indigo-400">
            {"{"} "status": "development_in_progress" {"}"}
          </span>
        </div>
        <br />
        <Link
          href="/"
          className="inline-flex items-center text-sm font-bold bg-white text-black px-6 py-3 rounded-md hover:bg-zinc-200 transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" /> Return to Hub
        </Link>
      </div>
    </div>
  );
}
