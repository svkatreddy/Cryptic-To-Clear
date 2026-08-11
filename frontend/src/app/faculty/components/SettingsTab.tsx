"use client";

import React, { useState, useEffect } from "react";
import { FacultySubscriptionData, fetchFacultySubscription } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Settings, Shield, Users, Sparkles, CreditCard, Building2, CheckCircle2, Loader2 } from "lucide-react";

export default function SettingsTab() {
  const { user } = useAuth();
  const [subData, setSubData] = useState<FacultySubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetchFacultySubscription();
      if (res.success && res.data) setSubData(res.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[var(--syn-keyword)] animate-spin" />
        <p className="text-xs font-mono text-[var(--ink-dim)]">Loading faculty profile & subscription architecture...</p>
      </div>
    );
  }

  if (!subData) return null;

  const facultySeatPct = Math.round((subData.facultySeatsUsed / subData.facultySeatsMax) * 100);
  const studentSeatPct = Math.round((subData.studentSeatsUsed / subData.studentSeatsMax) * 100);
  const aiCreditPct = Math.round((subData.aiCreditsUsed / subData.aiCreditsQuota) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-[var(--ink)]">Faculty & Institution Settings</h1>
        <p className="text-xs text-[var(--ink-dim)] font-mono">
          Account preferences, department configuration, and seat quota monitoring
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-display font-semibold text-[var(--ink)] flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--syn-keyword)]" />
          <span>Faculty Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3 rounded-xl glass border border-white/10">
            <span className="text-[10px] text-[var(--ink-dim)] block">Faculty Member</span>
            <span className="font-bold text-[var(--ink)] text-sm">{user?.name || "Dr. Sarah Jenkins"}</span>
          </div>

          <div className="p-3 rounded-xl glass border border-white/10">
            <span className="text-[10px] text-[var(--ink-dim)] block">Email</span>
            <span className="font-bold text-[var(--ink)] text-sm">{user?.email || "faculty@cryptictoclear.io"}</span>
          </div>

          <div className="p-3 rounded-xl glass border border-white/10">
            <span className="text-[10px] text-[var(--ink-dim)] block">Title</span>
            <span className="font-bold text-[var(--syn-keyword)] text-sm">{user?.title || "Professor of CS"}</span>
          </div>
        </div>
      </div>

      {/* Subscription & Quota Architecture */}
      <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-purple-300 font-bold uppercase px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20">
              {subData.plan}
            </span>
            <h2 className="text-lg font-display font-bold text-[var(--ink)] mt-2">{subData.institution} Subscription Architecture</h2>
          </div>

          <div className="text-xs font-mono text-right">
            <span className="text-[var(--ink-dim)] block">Billing Cycle: <strong className="text-[var(--ink)]">{subData.billingCycle}</strong></span>
            <span className="text-[var(--syn-string)] font-semibold">Next Renewal: {subData.nextRenewal}</span>
          </div>
        </div>

        {/* Quota Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {/* Faculty Seats */}
          <div className="p-4 rounded-xl glass border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--ink-dim)] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" /> Faculty Seats
              </span>
              <strong className="text-[var(--ink)] font-bold">{subData.facultySeatsUsed} / {subData.facultySeatsMax}</strong>
            </div>
            <div className="h-2 w-full bg-[var(--bg)] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${facultySeatPct}%` }} />
            </div>
            <span className="text-[10px] text-[var(--ink-faint)] block text-right">{facultySeatPct}% allocated</span>
          </div>

          {/* Student Seats */}
          <div className="p-4 rounded-xl glass border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--ink-dim)] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" /> Student Seats
              </span>
              <strong className="text-[var(--ink)] font-bold">{subData.studentSeatsUsed} / {subData.studentSeatsMax}</strong>
            </div>
            <div className="h-2 w-full bg-[var(--bg)] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${studentSeatPct}%` }} />
            </div>
            <span className="text-[10px] text-[var(--ink-faint)] block text-right">{studentSeatPct}% allocated</span>
          </div>

          {/* AI Credits */}
          <div className="p-4 rounded-xl glass border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--ink-dim)] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" /> AI Explanation Quota
              </span>
              <strong className="text-[var(--ink)] font-bold">{subData.aiCreditsUsed.toLocaleString()} / {subData.aiCreditsQuota.toLocaleString()}</strong>
            </div>
            <div className="h-2 w-full bg-[var(--bg)] rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${aiCreditPct}%` }} />
            </div>
            <span className="text-[10px] text-[var(--ink-faint)] block text-right">{aiCreditPct}% consumed</span>
          </div>
        </div>

        {/* Plan Features */}
        <div className="pt-4 border-t border-[var(--border)] space-y-3">
          <h3 className="text-xs font-mono text-[var(--ink-dim)] uppercase tracking-wider">Institutional Entitlements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {subData.features.map((feat, idx) => (
              <div key={idx} className="p-2.5 rounded-xl glass border border-white/10 text-xs font-mono flex items-center gap-2 text-[var(--ink)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--syn-string)] shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
