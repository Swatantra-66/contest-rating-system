"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import UnicornScene from "unicornstudio-react";
import { Swords, Trophy, Activity, Loader2, Terminal, Zap } from "lucide-react";

export default function NodeHub() {
  const { user, isLoaded } = useUser();
  const [isSyncing, setIsSyncing] = useState(true);
  const [nodeId, setNodeId] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const syncUserToDatabase = async () => {
      if (!isLoaded) return;

      if (!user) {
        setIsSyncing(false);
        return;
      }

      const playerName =
        user.username ||
        user.firstName ||
        user.primaryEmailAddress?.emailAddress.split("@")[0] ||
        "Unknown_Node";

      try {
        const res = await fetch(`${API_BASE_URL}users`);
        if (!res.ok) throw new Error("Failed to fetch users");
        const users = await res.json();

        const existingUser = users.find(
          (u: { id: string; name: string }) => u.name === playerName,
        );

        if (existingUser) {
          setNodeId(existingUser.id);
          localStorage.setItem("elonode_db_id", existingUser.id);
        } else {
          const createRes = await fetch(`${API_BASE_URL}users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: playerName,
              image_url: user.imageUrl,
            }),
          });

          if (!createRes.ok) throw new Error("Failed to auto-create user");

          const newUser = await createRes.json();
          setNodeId(newUser.id);
          localStorage.setItem("elonode_db_id", newUser.id);
        }
      } catch (error) {
        console.error("Database sync failed:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncUserToDatabase();
  }, [isLoaded, user, API_BASE_URL]);

  if (!isLoaded || isSyncing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 font-mono text-sm uppercase tracking-widest gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        Synchronizing Node Details :: It might take 20-30s to load cause it is
        hosted on Render free tier cpu instance :)
      </div>
    );
  }

  const handleScroll = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          a[href*="unicorn.studio"] {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          html { 
            scroll-behavior: smooth; 
            will-change: scroll-position;
          }
          .hardware-accelerated {
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
          }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #09090b; }
          ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }

          @keyframes fadeDown {
            from { opacity: 0; transform: translateY(-20px) translateZ(0); }
            to { opacity: 1; transform: translateY(0) translateZ(0); }
          }
          .animate-fade-down {
            animation: fadeDown 0.8s ease-out forwards;
          }
        `,
        }}
      />

      <div
        className="fixed inset-y-0 right-0 left-0 md:left-64 -z-10 h-screen overflow-hidden pointer-events-none bg-black hardware-accelerated"
        style={{ willChange: "transform" }}
      >
        <div className="absolute top-0 left-0 w-full h-[calc(100vh+80px)]">
          <UnicornScene
            projectId="iWEVjdOYv0tYrCvCauok"
            width="100%"
            height="100%"
            scale={1}
            dpi={1}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.2/dist/unicornStudio.umd.js"
          />
        </div>
      </div>

      <div className="relative z-10 w-full overflow-x-hidden">
        <section className="relative w-full h-screen flex flex-col justify-between pointer-events-none">
          <div className="absolute top-8 left-8 right-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pointer-events-auto animate-fade-down">
            {user ? (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox:
                        "w-9 h-9 border-2 border-indigo-500/50 hover:border-indigo-400 transition-colors",
                    },
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                    Active Node
                  </span>
                  <span className="text-[13px] font-bold text-white uppercase tracking-wider">
                    {user?.username || user?.firstName || "Unknown"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                <div className="w-9 h-9 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center">
                  <Terminal size={16} className="text-zinc-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                    System Status
                  </span>
                  <span className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider">
                    Unauthenticated
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/arena"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md text-zinc-100 font-mono text-[11px] font-bold uppercase tracking-widest rounded-lg border border-indigo-500/50 shadow-[0_3px_0_rgba(79,70,229,0.5)] hover:bg-indigo-500/20 hover:shadow-[0_1px_0_rgba(79,70,229,0.5)] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer"
                  >
                    <Swords size={14} className="text-indigo-400" />
                    Enter Arena
                  </Link>

                  <Link
                    href="/leaderboard"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md text-zinc-100 font-mono text-[11px] font-bold uppercase tracking-widest rounded-lg border border-amber-500/50 shadow-[0_3px_0_rgba(245,158,11,0.5)] hover:bg-amber-500/20 hover:shadow-[0_1px_0_rgba(245,158,11,0.5)] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer"
                  >
                    <Trophy size={14} className="text-amber-400" />
                    Rankings
                  </Link>

                  <Link
                    href={`/profile/${nodeId}`}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md text-zinc-100 font-mono text-[11px] font-bold uppercase tracking-widest rounded-lg border border-cyan-500/50 shadow-[0_3px_0_rgba(6,182,212,0.5)] hover:bg-cyan-500/20 hover:shadow-[0_1px_0_rgba(6,182,212,0.5)] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer"
                  >
                    <Activity size={14} className="text-cyan-400" />
                    My Node
                  </Link>

                  <Link
                    href="/docs"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md text-zinc-100 font-mono text-[11px] font-bold uppercase tracking-widest rounded-lg border border-blue-500/50 shadow-[0_3px_0_rgba(59,130,246,0.5)] hover:bg-blue-500/20 hover:shadow-[0_1px_0_rgba(59,130,246,0.5)] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer"
                  >
                    <Terminal size={14} className="text-blue-400" />
                    System Docs
                  </Link>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md text-zinc-300 hover:text-white font-mono text-[11px] font-bold uppercase tracking-widest rounded-lg border border-zinc-700 shadow-[0_3px_0_rgba(82,82,91,0.5)] hover:border-zinc-500 hover:shadow-[0_1px_0_rgba(82,82,91,0.5)] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer">
                      System Login
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 backdrop-blur-md text-indigo-300 hover:text-indigo-200 font-mono text-[11px] font-bold uppercase tracking-widest rounded-lg border border-indigo-500/50 shadow-[0_3px_0_rgba(79,70,229,0.5)] hover:shadow-[0_1px_0_rgba(79,70,229,0.5)] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer">
                      <Zap size={14} className="text-indigo-400" />
                      Initialize Node
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>

          <div
            className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-auto animate-fade-down"
            style={{
              animationDelay: "1s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            {!user ? (
              <SignInButton mode="modal" fallbackRedirectUrl="/">
                <button className="group flex flex-col items-center gap-2 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em]">
                    Get Started
                  </span>
                  {/* <ChevronDown className="w-5 h-5 animate-bounce text-zinc-400 group-hover:text-indigo-400" /> */}
                </button>
              </SignInButton>
            ) : (
              <Link
                href="/docs"
                className="group flex flex-col items-center gap-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-mono uppercase tracking-[0.3em]">
                  Access System Docs for more info
                </span>
              </Link>
            )}
          </div>
        </section>
        {/* <BelowFold nodeId={nodeId} /> */}
      </div>
    </>
  );
}
