"use client";

import React from "react";
import { FacultyOverviewData } from "@/lib/api";
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Code2,
  Bug,
  Sparkles,
  Award,
  ArrowUpRight,
  TrendingUp,
  Lightbulb,
  ShieldAlert,
  Info,
} from "lucide-react";

interface OverviewTabProps {
  data: FacultyOverviewData;
  onNavigate: (tab: string, studentId?: string) => void;
}

export default function OverviewTab({ data, onNavigate }: OverviewTabProps) {
  const statCards = [
    { label: "Total Students", value: data.totalStudents, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Active Students", value: data.activeStudents, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Students At Risk", value: data.atRiskStudents, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Programs Executed", value: data.programsExecuted.toLocaleString(), icon: Code2, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Compiler Errors", value: data.compilationErrors, icon: Bug, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    { label: "AI Explanations Used", value: data.aiExplanationsUsed, icon: Sparkles, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Avg Coding Score", value: `${data.averageCodingScore}%`, icon: Award, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-[var(--ink)]">Institutional Overview</h1>
          <p className="text-xs text-[var(--ink-dim)] mt-1 font-mono">
            {data.institution.name} • {data.institution.code}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("reports")}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-[var(--ink)] glass border border-white/10 hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Export Institutional Report</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--syn-keyword)]" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-strong border border-[var(--border-strong)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[var(--syn-keyword)]/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--ink-dim)]">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-display font-bold text-[var(--ink)] group-hover:text-gradient transition-colors">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Faculty Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[var(--syn-cursor)]" />
          <h2 className="text-lg font-display font-semibold text-[var(--ink)]">Faculty Insights</h2>
          <span className="text-xs font-mono text-[var(--ink-dim)] bg-white/5 px-2 py-0.5 rounded-full border border-[var(--border)]">
            AI Digest
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.insights.map((insight) => {
            const isWarning = insight.type === "warning";
            const isCritical = insight.type === "critical";
            const isTrend = insight.type === "trend";

            const badgeColor = isCritical
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : isWarning
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : isTrend
              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
              : "bg-blue-500/10 border-blue-500/20 text-blue-400";

            const Icon = isCritical ? ShieldAlert : isWarning ? AlertTriangle : isTrend ? TrendingUp : Info;

            return (
              <div
                key={insight.id}
                className="glass-strong border border-[var(--border-strong)] rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg border ${badgeColor} flex items-center gap-1.5`}>
                      <Icon className="w-3 h-3" />
                      <span>{insight.type}</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--ink)] font-sans">{insight.title}</h3>
                  <p className="text-xs text-[var(--ink-dim)] mt-1 leading-relaxed font-sans">{insight.description}</p>
                </div>
                <div className="pt-3 border-t border-[var(--border)] text-xs font-mono text-[var(--syn-keyword)] flex items-start gap-2">
                  <span className="font-bold">Recommendation:</span>
                  <span className="text-[var(--ink)]">{insight.actionable}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-semibold text-[var(--ink)]">Recent Student Executions</h2>
            <p className="text-xs text-[var(--ink-dim)] font-mono">Live compilation stream</p>
          </div>
          <button
            onClick={() => onNavigate("activity")}
            className="text-xs font-mono text-[var(--syn-function)] hover:underline cursor-pointer"
          >
            View Full Stream →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-dim)] text-[11px]">
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Roll No</th>
                <th className="pb-3 font-medium">Section</th>
                <th className="pb-3 font-medium">Language</th>
                <th className="pb-3 font-medium">Execution Status</th>
                <th className="pb-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.recentActivity.map((act) => {
                const isSuccess = act.status.toLowerCase().includes("success");
                const isError = act.status.toLowerCase().includes("error");
                return (
                  <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-semibold text-[var(--ink)]">{act.studentName}</td>
                    <td className="py-3 text-[var(--ink-dim)]">{act.rollNumber}</td>
                    <td className="py-3 text-[var(--syn-keyword)]">{act.section}</td>
                    <td className="py-3 uppercase font-bold text-[var(--syn-function)]">{act.language}</td>
                    <td className="py-3">
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
                      <p className="text-[10px] text-[var(--ink-dim)] truncate max-w-xs mt-0.5 font-sans">{act.detail}</p>
                    </td>
                    <td className="py-3 text-[var(--ink-faint)]">{act.timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
