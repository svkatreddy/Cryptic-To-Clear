"use client";

import React, { useState, useEffect } from "react";
import { ActivityItem, fetchFacultyOverview } from "@/lib/api";
import { Activity, RefreshCw, Filter, Search, Loader2 } from "lucide-react";

export default function ActivityTab() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [langFilter, setLangFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadActivity = async () => {
    setLoading(true);
    const res = await fetchFacultyOverview();
    if (res.success && res.data) {
      setActivity(res.data.recentActivity);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadActivity();
  }, []);

  const filteredActivity = activity.filter((act) => {
    if (langFilter && act.language.toLowerCase() !== langFilter.toLowerCase()) return false;
    if (statusFilter && !act.status.toLowerCase().includes(statusFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-[var(--ink)]">Live Activity Log</h1>
          <p className="text-xs text-[var(--ink-dim)] font-mono">
            Real-time compiler executions and AI explanation requests
          </p>
        </div>

        <button
          onClick={loadActivity}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-white/10 text-xs font-mono text-[var(--ink-dim)] hover:text-[var(--ink)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[var(--syn-keyword)]" />
          <span>Refresh Stream</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-4 flex flex-wrap items-center gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-[var(--ink-dim)]">
          <Filter className="w-4 h-4 text-[var(--syn-function)]" />
          <span>Filter Feed:</span>
        </div>

        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-[var(--ink)] focus:outline-none focus:border-[var(--syn-keyword)]"
        >
          <option value="">All Languages</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-[var(--ink)] focus:outline-none focus:border-[var(--syn-keyword)]"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="error">Compile Error</option>
          <option value="ai">AI Requested</option>
        </select>
      </div>

      {/* Activity Log Stream */}
      <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-4">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--syn-keyword)] animate-spin" />
            <p className="text-xs font-mono text-[var(--ink-dim)]">Fetching real-time activity stream...</p>
          </div>
        ) : filteredActivity.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[var(--ink-dim)]">No activity matching filters.</div>
        ) : (
          <div className="space-y-3">
            {filteredActivity.map((act) => {
              const isSuccess = act.status.toLowerCase().includes("success");
              const isError = act.status.toLowerCase().includes("error");

              return (
                <div
                  key={act.id}
                  className="p-4 rounded-xl glass border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                      <Activity className="w-4 h-4 text-[var(--syn-keyword)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-[var(--ink)] font-semibold">{act.studentName}</strong>
                        <span className="text-[10px] text-[var(--ink-dim)]">({act.rollNumber})</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                          {act.section}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-dim)] mt-1 font-sans leading-relaxed">{act.detail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="uppercase font-bold text-[var(--syn-function)]">{act.language}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSuccess
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : isError
                          ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      }`}
                    >
                      {act.status}
                    </span>
                    <span className="text-[10px] text-[var(--ink-faint)]">{act.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
