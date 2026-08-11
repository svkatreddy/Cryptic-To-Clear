"use client";

import React, { useState, useEffect } from "react";
import { StudentDetailData, fetchFacultyStudentDetail } from "@/lib/api";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Award,
  CheckCircle,
  Bug,
  Sparkles,
  Clock,
  Code2,
  AlertTriangle,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface StudentDetailTabProps {
  studentId: string;
  onBack: () => void;
}

export default function StudentDetailTab({ studentId, onBack }: StudentDetailTabProps) {
  const [detail, setDetail] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetchFacultyStudentDetail(studentId);
      if (res.success && res.data) {
        setDetail(res.data);
      }
      setLoading(false);
    }
    load();
  }, [studentId]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[var(--syn-keyword)] animate-spin" />
        <p className="text-xs font-mono text-[var(--ink-dim)]">Loading student performance dossier...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-xs font-mono text-[var(--syn-keyword)] flex items-center gap-1 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </button>
        <div className="p-8 text-center text-xs font-mono text-[var(--ink-dim)]">Student profile record not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--ink-dim)] hover:text-[var(--ink)] glass border border-white/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-[var(--syn-keyword)]" />
        <span>Back to Student Roster</span>
      </button>

      {/* Student Profile Card */}
      <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="blob h-[180px] w-[180px] bg-[var(--syn-keyword)] -top-20 -right-20" />

        <div className="flex items-center gap-4">
          {detail.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={detail.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-[var(--syn-keyword)] bg-white/10" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--syn-keyword)] to-[var(--syn-function)] flex items-center justify-center font-bold text-xl text-[#0a0d13]">
              {detail.name.charAt(0)}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-[var(--ink)]">{detail.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  detail.status === "At Risk"
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                }`}
              >
                {detail.status}
              </span>
            </div>
            <p className="text-xs font-mono text-[var(--ink-dim)]">
              Roll No: <span className="text-[var(--ink)] font-semibold">{detail.rollNumber}</span> • Email: {detail.email}
            </p>
            <p className="text-xs font-mono text-[var(--syn-keyword)]">
              Branch: {detail.branch} | Year: {detail.year} | Section: {detail.section}
            </p>
          </div>
        </div>

        {/* Coding Score Badge */}
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 self-start md:self-auto">
          <Award className="w-8 h-8 text-[var(--syn-cursor)]" />
          <div>
            <p className="text-[10px] font-mono text-[var(--ink-dim)] uppercase tracking-wider">Overall Coding Score</p>
            <p className="text-3xl font-display font-bold text-gradient">{detail.codingScore}%</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[var(--ink-dim)]">Total Programs</span>
          <p className="text-2xl font-display font-bold text-[var(--ink)]">{detail.programsExecuted}</p>
        </div>
        <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[var(--ink-dim)]">Successful Runs</span>
          <p className="text-2xl font-display font-bold text-emerald-400">{detail.successfulExecutions}</p>
        </div>
        <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[var(--ink-dim)]">Compiler Errors</span>
          <p className="text-2xl font-display font-bold text-rose-400">{detail.compilerErrors}</p>
        </div>
        <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-[var(--ink-dim)]">AI Explanations</span>
          <p className="text-2xl font-display font-bold text-indigo-400">{detail.aiExplanations}</p>
        </div>
      </div>

      {/* Progress Timeline & Error Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress over time */}
        <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--syn-function)]" />
            <h2 className="text-base font-display font-semibold text-[var(--ink)]">Performance Growth Timeline</h2>
          </div>

          <div className="space-y-3 pt-2">
            {detail.progressTimeline.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--ink-dim)]">{item.week}</span>
                  <span className="text-[var(--syn-keyword)] font-bold">{item.score}% Score</span>
                </div>
                <div className="h-2 w-full bg-[var(--bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] rounded-full transition-all duration-500"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frequently Occurring Mistakes & Error Categories */}
        <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-display font-semibold text-[var(--ink)]">Frequent Mistakes & Vulnerabilities</h2>
          </div>

          <div className="space-y-2">
            {detail.frequentMistakes && detail.frequentMistakes.length > 0 ? (
              detail.frequentMistakes.map((mistake, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300 flex items-start gap-2">
                  <span className="font-bold shrink-0">#{idx + 1}</span>
                  <span>{mistake}</span>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-[var(--ink-dim)]">No recurring pattern recorded.</p>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <h3 className="text-xs font-mono text-[var(--ink-dim)] uppercase tracking-wider">Error Category Distribution</h3>
            <div className="grid grid-cols-2 gap-2">
              {detail.errorCategories.map((cat, idx) => (
                <div key={idx} className="p-2.5 rounded-xl glass border border-white/10 text-xs font-mono flex items-center justify-between">
                  <span className="text-[var(--ink-dim)] truncate">{cat.category}</span>
                  <span className="font-bold text-rose-400">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attempted Programs Log */}
      <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-display font-semibold text-[var(--ink)]">Recent Attempted Assignments & Programs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-dim)] text-[11px]">
                <th className="pb-3 font-medium">Program Title</th>
                <th className="pb-3 font-medium">Language</th>
                <th className="pb-3 font-medium">Attempts</th>
                <th className="pb-3 font-medium">Time Spent</th>
                <th className="pb-3 font-medium">Execution Status</th>
                <th className="pb-3 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {detail.attemptedPrograms.map((prog) => (
                <tr key={prog.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-semibold text-[var(--ink)]">{prog.title}</td>
                  <td className="py-3 uppercase font-bold text-[var(--syn-function)]">{prog.language}</td>
                  <td className="py-3 text-[var(--ink-dim)]">{prog.attempts} try(s)</td>
                  <td className="py-3 text-[var(--ink-dim)]">{prog.timeSpent}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {prog.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-[var(--syn-keyword)]">{prog.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
