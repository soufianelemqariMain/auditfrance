"use client";

import Navbar from "@/components/Navbar";
import AnalyserPanel from "@/components/AnalyserPanel";

export default function AnalysePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Navbar />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <AnalyserPanel />
      </div>
    </div>
  );
}
