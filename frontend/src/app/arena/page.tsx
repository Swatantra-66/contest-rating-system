"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Search,
  Swords,
  Loader2,
  ArrowLeft,
  Target,
  ShieldAlert,
  Zap,
  Trophy,
  Star,
} from "lucide-react";
import { Orbitron } from "next/font/google";
import Link from "next/link";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"] });

interface NodeUser {
  id: string;
  name: string;
  image_url?: string;
  current_rating: number;
  contests_played: number;
  tier: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const TIER_CONFIG: Record<
  string,
  { color: string; glow: string; bg: string; rank: string }
> = {
  newbie: {
    color: "#71717a",
    glow: "rgba(113,113,122,0.2)",
    bg: "rgba(113,113,122,0.08)",
    rank: "I",
  },
  apprentice: {
    color: "#34d399",
    glow: "rgba(52,211,153,0.2)",
    bg: "rgba(52,211,153,0.08)",
    rank: "II",
  },
  specialist: {
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.2)",
    bg: "rgba(34,211,238,0.08)",
    rank: "III",
  },
  expert: {
    color: "#818cf8",
    glow: "rgba(129,140,248,0.25)",
    bg: "rgba(129,140,248,0.08)",
    rank: "IV",
  },
  master: {
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.25)",
    bg: "rgba(251,191,36,0.08)",
    rank: "V",
  },
  grandmaster: {
    color: "#f87171",
    glow: "rgba(248,113,113,0.35)",
    bg: "rgba(248,113,113,0.08)",
    rank: "VI",
  },
};

function getTier(tier: string) {
  return TIER_CONFIG[tier.toLowerCase()] || TIER_CONFIG["newbie"];
}

function RatingBar({ rating }: { rating: number }) {
  const max = 1800;
  const pct = Math.min(100, (rating / max) * 100);
  const color =
    rating >= 1800
      ? "#f87171"
      : rating >= 1400
        ? "#fbbf24"
        : rating >= 1200
          ? "#818cf8"
          : rating >= 1100
            ? "#22d3ee"
            : "#71717a";
  return (
    <div
      style={{
        height: 2,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 1,
        marginTop: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 1,
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}

export default function ArenaPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<NodeUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [myNodeId, setMyNodeId] = useState<string | null>(null);
  const [challenging, setChallenging] = useState<string | null>(null);

  useEffect(() => {
    setMyNodeId(localStorage.getItem("elonode_db_id"));
    fetch(`${API}users`)
      .then((r) => r.json())
      .then((data) =>
        setUsers(
          data.sort(
            (a: NodeUser, b: NodeUser) => b.current_rating - a.current_rating,
          ),
        ),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChallenge = async (opponent: NodeUser) => {
    setChallenging(opponent.id);
    try {
      const myNode = users.find((u) => u.id === myNodeId);
      const myName =
        myNode?.name || user?.username || user?.firstName || "Unknown";

      const res = await fetch(`${API}contests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `1v1: ${myName} vs ${opponent.name}`,
          total_participants: 2,
        }),
      });

      if (!res.ok) throw new Error("Failed to create contest");
      const data = await res.json();
      const contestId = data.id || data.ID;

      router.push(
        `/duel/${contestId}?opponent=${encodeURIComponent(opponent.name)}&opponentId=${opponent.id}`,
      );
    } catch (err) {
      console.error(err);
      alert("Failed to initialize duel. Try again.");
      setChallenging(null);
    }
  };

  const opponents = users.filter(
    (u) =>
      u.id !== myNodeId &&
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isLoaded || loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#05060b",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <Loader2
          style={{
            width: 28,
            height: 28,
            color: "#6366f1",
            animation: "spin 1s linear infinite",
          }}
        />
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "#3f3f46",
            textTransform: "uppercase",
          }}
        >
          Scanning grid for active nodes...
        </span>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05060b",
        fontFamily: "ui-monospace, monospace",
        color: "#e4e4e7",
      }}
    >
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scanline { 0%{top:-10%} 100%{top:110%} }
        .node-card { transition: all 0.25s ease; }
        .node-card:hover { transform: translateY(-3px); }
        .challenge-btn { transition: all 0.2s ease; }
        .challenge-btn:hover { transform: translateY(-1px); }
        .challenge-btn:active { transform: translateY(1px); }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ animation: "fadeUp 0.5s ease-out", marginBottom: 40 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#52525b",
              textDecoration: "none",
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: 24,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
          >
            <ArrowLeft size={12} /> Return to Hub
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Swords size={18} style={{ color: "#818cf8" }} />
                </div>
                <h1
                  className={orbitron.className}
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "#fff",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  MATCH<span style={{ color: "#3f3f46" }}>MAKING</span>
                </h1>
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: "#3f3f46",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginLeft: 48,
                }}
              >
                Select a node to initiate duel protocol
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#52525b",
                }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Target specific node..."
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "10px 14px 10px 36px",
                  color: "#e4e4e7",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  width: 240,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")
                }
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 32,
            animation: "fadeUp 0.5s ease-out 0.1s both",
          }}
        >
          {[
            {
              icon: <Target size={12} />,
              label: "Targets",
              value: opponents.length,
              color: "#4ade80",
            },
            {
              icon: <Trophy size={12} />,
              label: "Total Nodes",
              value: users.length,
              color: "#fbbf24",
            },
            {
              icon: <Star size={12} />,
              label: "Top Rating",
              value: users[0]?.current_rating || 0,
              color: "#818cf8",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 8,
                fontSize: 10,
              }}
            >
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span
                style={{
                  color: "#3f3f46",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}:
              </span>
              <span style={{ color: "#e4e4e7", fontWeight: 700 }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {opponents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ShieldAlert size={32} style={{ color: "#27272a" }} />
            <p
              style={{
                fontSize: 11,
                color: "#3f3f46",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              No active targets match your parameters
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {opponents.map((opponent, i) => {
              const tier = getTier(opponent.tier);
              const isChallengingThis = challenging === opponent.id;
              return (
                <div
                  key={opponent.id}
                  className="node-card"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid rgba(255,255,255,0.06)`,
                    borderRadius: 16,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    animation: `cardIn 0.4s ease-out ${i * 0.06}s both`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      `${tier.color}40`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      `0 8px 32px ${tier.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "none";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 60,
                      height: 60,
                      background: `radial-gradient(circle at top right, ${tier.color}10, transparent 70%)`,
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          overflow: "hidden",
                          border: `1.5px solid ${tier.color}40`,
                          background: tier.bg,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 900,
                          color: tier.color,
                        }}
                      >
                        {opponent.image_url ? (
                          <img
                            src={opponent.image_url}
                            alt={opponent.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          opponent.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            color: "#fff",
                            textTransform: "uppercase",
                          }}
                        >
                          {opponent.name}
                        </div>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 3,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: tier.bg,
                            border: `1px solid ${tier.color}30`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 900,
                              letterSpacing: "0.15em",
                              color: tier.color,
                              textTransform: "uppercase",
                            }}
                          >
                            {opponent.tier}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        className={orbitron.className}
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          color: "#fff",
                          lineHeight: 1,
                        }}
                      >
                        {opponent.current_rating}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "#3f3f46",
                          letterSpacing: "0.1em",
                          marginTop: 3,
                        }}
                      >
                        {opponent.contests_played} MATCHES
                      </div>
                      <RatingBar rating={opponent.current_rating} />
                    </div>
                  </div>

                  <button
                    className="challenge-btn"
                    onClick={() => handleChallenge(opponent)}
                    disabled={!!challenging}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: 10,
                      border: "none",
                      cursor: challenging ? "not-allowed" : "pointer",
                      background: isChallengingThis
                        ? "rgba(99,102,241,0.3)"
                        : "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08))",
                      color: isChallengingThis ? "#818cf8" : "#a5b4fc",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      borderTop: "1px solid rgba(99,102,241,0.2)",
                      opacity: challenging && !isChallengingThis ? 0.4 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!challenging) {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background =
                          "linear-gradient(135deg,#6366f1,#4f46e5)";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "#fff";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 4px 20px rgba(99,102,241,0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!challenging) {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background =
                          "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08))";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "#a5b4fc";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "none";
                      }
                    }}
                  >
                    {isChallengingThis ? (
                      <>
                        <Loader2
                          size={12}
                          style={{ animation: "spin 1s linear infinite" }}
                        />{" "}
                        Initializing Duel...
                      </>
                    ) : (
                      <>
                        <Zap size={12} /> Issue Challenge
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
