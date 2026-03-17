"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardData {
  stats: { totalPuzzles: number; totalPlays: number; totalSolves: number; avgGenTime: number };
  attemptStats: { totalAttempts: number; solvedAttempts: number; avgSolveTime: number };
  topicStats: { topic: string; count: number; plays: number; solves: number }[];
  subscribers: { id: number; email: string; subscribedAt: string }[];
  puzzles: {
    id: string; topic: string; difficulty: string; tone: string; size: number;
    grid: string[][]; cluesAcross: { number: number; clue: string; answer: string }[];
    cluesDown: { number: number; clue: string; answer: string }[];
    playCount: number; solveCount: number; generationTimeMs: number | null; createdAt: string;
  }[];
  recentAttempts: {
    id: number; puzzleId: string; solved: boolean; solveTimeSec: number | null;
    errorCount: number | null; completedAt: string;
  }[];
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [data, setData] = useState<DashboardData | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (r.ok) { setAuthed(true); return r.json(); }
        setAuthed(false);
        return null;
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoginLoading(true);
    setLoginError(false);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
        const d = await fetch("/api/admin/dashboard").then((r) => r.json());
        setData(d);
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    } finally {
      setLoginLoading(false);
    }
  };

  // Loading state
  if (authed === null) {
    return (
      <main className="min-h-screen flex items-center justify-center paper-texture">
        <p className="font-sans text-crossy-ink/40 text-sm">Loading...</p>
      </main>
    );
  }

  // Login form
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center paper-texture px-4">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl text-crossy-ink">Crossy Admin</h1>
            <p className="font-sans text-xs text-crossy-ink/40 mt-1">
              Enter password to continue
            </p>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLoginError(false); }}
            placeholder="Password"
            className="h-11 bg-white border-crossy-ink/15 focus:border-crossy-gold focus:ring-crossy-gold/30"
            style={{ fontSize: "16px" }}
            autoFocus
          />
          {loginError && (
            <p className="font-sans text-xs text-red-500 text-center">
              Incorrect password
            </p>
          )}
          <Button
            type="submit"
            disabled={!password || loginLoading}
            className="w-full bg-crossy-ink text-crossy-cream hover:bg-crossy-ink/90 font-sans font-semibold"
          >
            {loginLoading ? "..." : "Log in"}
          </Button>
        </form>
      </main>
    );
  }

  // Dashboard
  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center paper-texture">
        <p className="font-sans text-crossy-ink/40 text-sm">Loading dashboard...</p>
      </main>
    );
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const formatMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-crossy-ink">Crossy Admin</h1>
          <p className="text-sm text-crossy-ink/50 mt-1">Puzzle analytics and answer keys</p>
        </div>
        <Link href="/" className="text-sm text-crossy-gold hover:underline">
          Back to app
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Puzzles" value={data.stats.totalPuzzles} />
        <StatCard label="Total Plays" value={data.stats.totalPlays} />
        <StatCard label="Total Solves" value={data.stats.totalSolves} />
        <StatCard label="Avg Gen Time" value={formatMs(data.stats.avgGenTime)} />
        <StatCard label="Total Attempts" value={data.attemptStats.totalAttempts} />
        <StatCard label="Solved Attempts" value={data.attemptStats.solvedAttempts} />
        <StatCard
          label="Solve Rate"
          value={data.attemptStats.totalAttempts > 0
            ? `${Math.round((data.attemptStats.solvedAttempts / data.attemptStats.totalAttempts) * 100)}%`
            : "\u2014"}
        />
        <StatCard
          label="Avg Solve Time"
          value={data.attemptStats.avgSolveTime > 0
            ? formatTime(Math.round(data.attemptStats.avgSolveTime))
            : "\u2014"}
        />
        <StatCard label="Subscribers" value={data.subscribers.length} />
      </div>

      {/* Subscribers */}
      <Section title={`Subscribers (${data.subscribers.length})`} action={
        data.subscribers.length > 0
          ? <a href="/api/admin/subscribers?format=csv" className="text-sm text-crossy-gold hover:underline font-sans font-medium">Export CSV</a>
          : null
      }>
        <table className="w-full text-sm">
          <thead className="bg-crossy-ink/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-crossy-ink/60">Email</th>
              <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {data.subscribers.map((s) => (
              <tr key={s.id} className="border-t border-crossy-ink/5">
                <td className="px-4 py-2 text-crossy-ink font-mono text-xs">{s.email}</td>
                <td className="px-4 py-2 text-right text-crossy-ink/50 text-xs">{new Date(s.subscribedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {data.subscribers.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-6 text-center text-crossy-ink/40">No subscribers yet</td></tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Topics */}
      <Section title="Topics">
        <table className="w-full text-sm">
          <thead className="bg-crossy-ink/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-crossy-ink/60">Topic</th>
              <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">Puzzles</th>
              <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">Plays</th>
              <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">Solves</th>
            </tr>
          </thead>
          <tbody>
            {data.topicStats.map((t) => (
              <tr key={t.topic} className="border-t border-crossy-ink/5">
                <td className="px-4 py-2 text-crossy-ink">{t.topic}</td>
                <td className="px-4 py-2 text-right tabular-nums">{t.count}</td>
                <td className="px-4 py-2 text-right tabular-nums">{t.plays}</td>
                <td className="px-4 py-2 text-right tabular-nums">{t.solves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Recent Attempts */}
      <Section title="Recent Attempts">
        <table className="w-full text-sm">
          <thead className="bg-crossy-ink/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-crossy-ink/60">Puzzle</th>
              <th className="text-center px-4 py-2 font-medium text-crossy-ink/60">Solved?</th>
              <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">Time</th>
              <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">Errors</th>
              <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">When</th>
            </tr>
          </thead>
          <tbody>
            {data.recentAttempts.map((a) => (
              <tr key={a.id} className="border-t border-crossy-ink/5">
                <td className="px-4 py-2">
                  <a href={`/puzzle/${a.puzzleId}`} className="text-crossy-gold hover:underline font-mono text-xs">{a.puzzleId}</a>
                </td>
                <td className="px-4 py-2 text-center">{a.solved ? "Yes" : "No"}</td>
                <td className="px-4 py-2 text-right tabular-nums">{a.solveTimeSec ? formatTime(a.solveTimeSec) : "\u2014"}</td>
                <td className="px-4 py-2 text-right tabular-nums">{a.errorCount ?? 0}</td>
                <td className="px-4 py-2 text-right text-crossy-ink/50 text-xs">{new Date(a.completedAt).toLocaleString()}</td>
              </tr>
            ))}
            {data.recentAttempts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-crossy-ink/40">No attempts yet</td></tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* All Puzzles with Answer Keys */}
      <section className="mb-8">
        <h2 className="font-serif text-xl text-crossy-ink mb-3">All Puzzles (Answer Keys)</h2>
        <div className="space-y-4">
          {data.puzzles.map((p) => (
            <div key={p.id} className="bg-white rounded-lg border border-crossy-ink/10 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`/puzzle/${p.id}`} className="font-mono text-xs text-crossy-gold hover:underline">{p.id}</a>
                    <span className="font-semibold text-crossy-ink">{p.topic}</span>
                    <span className="text-xs text-crossy-ink/40 bg-crossy-ink/5 px-2 py-0.5 rounded">{p.difficulty}</span>
                    <span className="text-xs text-crossy-ink/40 bg-crossy-ink/5 px-2 py-0.5 rounded">{p.tone}</span>
                  </div>
                  <p className="text-xs text-crossy-ink/40 mt-1">
                    {new Date(p.createdAt).toLocaleString()} · Gen: {p.generationTimeMs ? formatMs(p.generationTimeMs) : "?"} · Plays: {p.playCount} · Solves: {p.solveCount}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 flex-wrap">
                <div
                  className="inline-grid gap-0 border-2 border-crossy-ink shrink-0"
                  style={{ gridTemplateColumns: `repeat(${p.size}, 1fr)` }}
                >
                  {(p.grid as string[][]).map((row, r) =>
                    row.map((cell, c) => (
                      <div key={`${r}-${c}`} className={`w-8 h-8 flex items-center justify-center text-xs font-bold border border-crossy-ink/20 ${cell === "#" ? "bg-crossy-ink" : "bg-white text-crossy-ink"}`}>
                        {cell !== "#" ? cell : ""}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-6 text-xs flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-crossy-ink/60 mb-1">Across</h4>
                    {p.cluesAcross.map((cl) => (
                      <p key={cl.number} className="text-crossy-ink/70 mb-0.5 truncate">
                        <span className="font-bold">{cl.number}.</span> {cl.clue} <span className="text-crossy-gold font-mono">[{cl.answer}]</span>
                      </p>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-crossy-ink/60 mb-1">Down</h4>
                    {p.cluesDown.map((cl) => (
                      <p key={cl.number} className="text-crossy-ink/70 mb-0.5 truncate">
                        <span className="font-bold">{cl.number}.</span> {cl.clue} <span className="text-crossy-gold font-mono">[{cl.answer}]</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-crossy-ink/10 p-4">
      <p className="text-xs text-crossy-ink/50 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-crossy-ink tabular-nums mt-1">{value}</p>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-xl text-crossy-ink">{title}</h2>
        {action}
      </div>
      <div className="bg-white rounded-lg border border-crossy-ink/10 overflow-hidden">
        {children}
      </div>
    </section>
  );
}
