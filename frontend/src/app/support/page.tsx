"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  MessageSquare,
  Mail,
  Terminal,
  Activity,
  Bug,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function SupportPage() {
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    category: "ui_bug",
    roomCode: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.description.trim()) {
      setError("Please provide a description of the issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); //fake delay right now, will connect it to backend soon
      setIsSuccess(true);
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
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

        <div className="mb-16 border border-zinc-800 bg-[#0a0014] rounded-2xl overflow-hidden">
          <div className="border-b border-zinc-800 p-6 flex items-center gap-4 bg-zinc-900/30">
            <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center">
              <Bug size={20} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-xl text-white font-medium">Report a Bug</h3>
              <p className="text-sm text-zinc-500">
                Found a glitch in the Matrix? Let us know the details.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {isSuccess ? (
              <div className="py-8 text-center space-y-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-emerald-400" size={32} />
                </div>
                <h3 className="text-xl text-white font-medium">
                  Report Submitted
                </h3>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Thanks for the heads-up! Our team will investigate this issue
                  shortly.
                </p>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      category: "ui_bug",
                      roomCode: "",
                      description: "",
                    });
                  }}
                  className="mt-4 px-6 py-2 border border-zinc-700 hover:bg-zinc-800 text-white rounded transition-colors text-sm"
                >
                  Submit Another Report
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">
                      Issue Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full bg-[#05060b] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    >
                      <option value="ui_bug">UI / Visual Bug</option>
                      <option value="execution_engine">
                        Code Execution Engine
                      </option>
                      <option value="websocket_sync">Lobby / Sync Issue</option>
                      <option value="rating_system">
                        ELO Rating Calculation
                      </option>
                      <option value="feature_request">Feature Request</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">
                      Room Code / Match ID{" "}
                      <span className="text-zinc-600">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TTZBM"
                      value={formData.roomCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          roomCode: e.target.value.toUpperCase(),
                        })
                      }
                      maxLength={6}
                      className="w-full bg-[#05060b] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors uppercase placeholder:normal-case placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 flex justify-between">
                    <span>Description</span>
                    <span className="text-rose-500 text-xs">*Required</span>
                  </label>
                  <textarea
                    placeholder="Describe the issue and steps to reproduce..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full h-32 bg-[#05060b] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isLoaded}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-md transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
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
