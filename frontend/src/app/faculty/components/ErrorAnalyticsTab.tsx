"use client";

import React, { useState, useEffect } from "react";
import { ErrorAnalyticsData, LanguageAnalyticsData, fetchFacultyErrorAnalytics, fetchFacultyLanguageAnalytics } from "@/lib/api";
import { AlertTriangle, Bug, Code2, Loader2, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

export default function ErrorAnalyticsTab() {
  const [errorData, setErrorData] = useState<ErrorAnalyticsData | null>(null);
  const [langData, setLangData] = useState<LanguageAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [errRes, langRes] = await Promise.all([
        fetchFacultyErrorAnalytics(),
        fetchFacultyLanguageAnalytics(),
      ]);
      if (errRes.success && errRes.data) setErrorData(errRes.data);
      if (langRes.success && langRes.data) setLangData(langRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[var(--syn-keyword)] animate-spin" />
        <p className="text-xs font-mono text-[var(--ink-dim)]">Aggregating error frequency & language analytics...</p>
      </div>
    );
  }

  if (!errorData || !langData) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-[var(--ink)]">Error & Programming Language Analytics</h1>
        <p className="text-xs text-[var(--ink-dim)] font-mono">
          Diagnostic analysis across C, C++, Java, and Python compilations
        </p>
      </div>

      {/* Language Breakdown Banner */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-[var(--ink)]">Programming Language Usage & Reliability</h2>
          <span className="text-xs font-mono text-[var(--syn-keyword)] font-semibold">
            Most Used: {langData.mostUsedLanguage}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {langData.languages.map((lang) => (
            <div
              key={lang.code}
              className="glass-strong border border-[var(--border-strong)] rounded-2xl p-5 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-bold text-[var(--ink)]">{lang.language}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--syn-function)]">
                  {lang.executions} runs
                </span>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--ink-dim)]">Success Rate</span>
                  <span className="text-emerald-400 font-bold">{lang.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-dim)]">Error Rate</span>
                  <span className="text-rose-400 font-bold">{lang.errorRate}%</span>
                </div>
              </div>

              <div className="h-1.5 w-full bg-[var(--bg)] rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${lang.successRate}%` }} />
                <div className="h-full bg-rose-500 rounded-r-full" style={{ width: `${lang.errorRate}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Category Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-display font-semibold text-[var(--ink)]">Error Categories Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {errorData.byCategory.map((cat, idx) => (
            <div key={idx} className="glass-strong border border-[var(--border-strong)] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--ink-dim)] truncate">{cat.category}</span>
                <span className="font-bold text-rose-400">{cat.percentage}%</span>
              </div>
              <p className="text-2xl font-display font-bold text-[var(--ink)]">{cat.count}</p>
              <p className="text-[10px] text-[var(--ink-faint)] leading-tight font-sans line-clamp-2">{cat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Language-Wise Error Breakdown & Most Common Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Wise Error Matrix */}
        <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--syn-function)]" />
            <h2 className="text-base font-display font-semibold text-[var(--ink)]">Language-Wise Error Breakdown</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--ink-dim)] text-[11px]">
                  <th className="pb-3 font-medium">Lang</th>
                  <th className="pb-3 font-medium">Syntax</th>
                  <th className="pb-3 font-medium">Compile</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Runtime</th>
                  <th className="pb-3 font-medium">Logic</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {errorData.languageWise.map((row) => (
                  <tr key={row.language} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-bold text-[var(--ink)]">{row.language}</td>
                    <td className="py-3 text-[var(--ink-dim)]">{row.syntax}</td>
                    <td className="py-3 text-[var(--ink-dim)]">{row.compilation}</td>
                    <td className="py-3 text-[var(--ink-dim)]">{row.type}</td>
                    <td className="py-3 text-rose-400 font-semibold">{row.runtime}</td>
                    <td className="py-3 text-[var(--ink-dim)]">{row.logic}</td>
                    <td className="py-3 text-right font-bold text-[var(--syn-keyword)]">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Common Error Messages */}
        <div className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-display font-semibold text-[var(--ink)]">Most Frequently Occurring Compiler Errors</h2>
          </div>

          <div className="space-y-3">
            {errorData.mostCommonErrors.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl glass border border-white/10 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 font-mono text-[11px] truncate max-w-[280px]">{item.error}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold shrink-0">
                    {item.count} occurrences
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--ink-dim)]">
                  <span>Primary: <strong className="text-[var(--syn-function)]">{item.primaryLanguage}</strong></span>
                  <span>Students Affected: <strong className="text-[var(--syn-keyword)]">{item.affectedStudents}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
