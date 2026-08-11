"use client";

import React, { useState, useEffect } from "react";
import { fetchFacultyOverview, FacultyOverviewData } from "@/lib/api";
import OverviewTab from "./components/OverviewTab";
import StudentsTab from "./components/StudentsTab";
import StudentDetailTab from "./components/StudentDetailTab";
import ErrorAnalyticsTab from "./components/ErrorAnalyticsTab";
import ClassesTab from "./components/ClassesTab";
import AssignmentsTab from "./components/AssignmentsTab";
import ActivityTab from "./components/ActivityTab";
import ReportsTab from "./components/ReportsTab";
import SettingsTab from "./components/SettingsTab";
import { Loader2 } from "lucide-react";

export default function FacultyDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<FacultyOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    const res = await fetchFacultyOverview();
    if (res.success && res.data) {
      setOverviewData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();

    const handleNavEvent = (e: Event) => {
      const customEvt = e as CustomEvent<string>;
      if (customEvt.detail) {
        setActiveTab(customEvt.detail);
        if (customEvt.detail !== "student-detail") {
          setSelectedStudentId(null);
        }
      }
    };

    window.addEventListener("faculty-nav", handleNavEvent);
    return () => window.removeEventListener("faculty-nav", handleNavEvent);
  }, []);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab("student-detail");
  };

  if (loading || !overviewData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[var(--syn-keyword)] animate-spin" />
        <p className="text-xs font-mono text-[var(--ink-dim)] font-medium">Initializing Institutional Faculty Dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {activeTab === "overview" && <OverviewTab data={overviewData} onNavigate={(tab) => setActiveTab(tab)} />}
      {activeTab === "students" && <StudentsTab onSelectStudent={handleSelectStudent} />}
      {activeTab === "student-detail" && selectedStudentId && (
        <StudentDetailTab studentId={selectedStudentId} onBack={() => setActiveTab("students")} />
      )}
      {activeTab === "errors" && <ErrorAnalyticsTab />}
      {activeTab === "classes" && <ClassesTab />}
      {activeTab === "assignments" && <AssignmentsTab />}
      {activeTab === "activity" && <ActivityTab />}
      {activeTab === "reports" && <ReportsTab />}
      {activeTab === "settings" && <SettingsTab />}
    </div>
  );
}
