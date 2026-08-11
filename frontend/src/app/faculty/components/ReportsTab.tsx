"use client";

import React, { useState } from "react";
import { fetchFacultyReports } from "@/lib/api";
import { FileSpreadsheet, Download, CheckCircle, FileText, Loader2, Sparkles } from "lucide-react";

export default function ReportsTab() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const reportTypes = [
    {
      id: "student-performance",
      title: "Student Performance Report",
      description: "Complete roster metrics: programs executed, compiler errors, AI explanations, coding scores, and risk status.",
      icon: FileSpreadsheet,
    },
    {
      id: "class-performance",
      title: "Class Performance & Section Comparison",
      description: "Class section performance averages, student enrollment numbers, submission rates, and score distributions.",
      icon: FileText,
    },
    {
      id: "error-analysis",
      title: "Error Analysis & Vulnerability Report",
      description: "Categorized compilation errors, syntax vs runtime breakdowns, and recurring student mistakes.",
      icon: FileSpreadsheet,
    },
    {
      id: "language-usage",
      title: "Language Usage & Reliability Report",
      description: "Comparative analytics across C, C++, Java, and Python execution success and error frequencies.",
      icon: FileText,
    },
    {
      id: "activity-log",
      title: "Compiler Activity & AI Usage Audit",
      description: "Detailed chronological record of compilation executions and AI explanation tokens/credits consumed.",
      icon: FileSpreadsheet,
    },
  ];

  const handleExportCSV = async (reportId: string, title: string) => {
    setDownloading(reportId);
    try {
      const res = await fetchFacultyReports();
      if (res.success && res.data) {
        let csvContent = "";
        if (reportId === "student-performance") {
          csvContent = "Name,RollNumber,Email,Branch,Section,Executions,Successes,Errors,AIExplanations,CodingScore,Status\n";
          res.data.students.forEach((s: any) => {
            csvContent += `"${s.name}","${s.rollNumber}","${s.email}","${s.branch}","${s.section}",${s.programsExecuted},${s.successfulExecutions},${s.compilerErrors},${s.aiExplanations},${s.codingScore},"${s.status}"\n`;
          });
        } else if (reportId === "error-analysis") {
          csvContent = "Category,Count,Percentage,Description\n";
          res.data.errors.forEach((e: any) => {
            csvContent += `"${e.category}",${e.count},${e.percentage},"${e.description}"\n`;
          });
        } else if (reportId === "language-usage") {
          csvContent = "Language,Executions,SuccessRate,ErrorRate\n";
          res.data.languages.forEach((l: any) => {
            csvContent += `"${l.language}",${l.executions},${l.successRate},${l.errorRate}\n`;
          });
        } else {
          csvContent = "Institution,TotalStudents,ActiveStudents,AtRiskStudents,ProgramsExecuted,CompilationErrors,AverageCodingScore\n";
          const s = res.data.summary;
          csvContent += `"${res.data.institution}",${s.totalStudents},${s.activeStudents},${s.atRiskStudents},${s.programsExecuted},${s.compilationErrors},${s.averageCodingScore}\n`;
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${reportId}_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      alert("Failed to export report CSV.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-[var(--ink)]">Reports & Data Export</h1>
        <p className="text-xs text-[var(--ink-dim)] font-mono">
          Generate and export official institutional metrics in CSV format
        </p>
      </div>

      {/* Reports Hub Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isProcessing = downloading === report.id;

          return (
            <div
              key={report.id}
              className="glass-strong border border-[var(--border-strong)] rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-[var(--syn-keyword)]/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-display font-semibold text-[var(--ink)]">{report.title}</h2>
                </div>
                <p className="text-xs text-[var(--ink-dim)] leading-relaxed font-sans">{report.description}</p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[var(--syn-string)] font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready for Export
                </span>

                <button
                  onClick={() => handleExportCSV(report.id, report.title)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-semibold text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(184,146,255,0.2)] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
