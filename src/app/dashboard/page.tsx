"use client";

import { useEffect, useState } from "react";
import SidebarLayout from "@/components/sidebar-layout";

interface Stats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  pendingTasks: number;
  teamMembers: number;
  todayAttendance: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/data?type=dashboard").then((r) => r.json()).then((d) => setStats(d.stats));
  }, []);

  const cards = stats ? [
    { label: "Total Projects", value: stats.totalProjects, color: "bg-blue-500" },
    { label: "Active Projects", value: stats.activeProjects, color: "bg-green-500" },
    { label: "Total Tasks", value: stats.totalTasks, color: "bg-violet-500" },
    { label: "Pending Tasks", value: stats.pendingTasks, color: "bg-amber-500" },
    { label: "Team Members", value: stats.teamMembers, color: "bg-cyan-500" },
    { label: "Today Attendance", value: stats.todayAttendance, color: "bg-rose-500" },
  ] : [];

  return (
    <SidebarLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Welcome back! Here is your project overview.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${card.color}`} />
                <span className="text-sm text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-3xl font-bold mt-3">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
