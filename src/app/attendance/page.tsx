"use client";

import { useEffect, useState } from "react";
import SidebarLayout from "@/components/sidebar-layout";

interface AttendanceRecord {
  id: string; userId: string; date: string; checkIn: string;
  checkOut: string | null; status: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    fetch("/api/data?type=attendance").then((r) => r.json()).then(setRecords);
    const today = new Date().toISOString().split("T")[0];
    const existing = records.find((r) => r.date === today);
    if (existing) setCheckedIn(true);
  }, []);

  async function handleCheckIn() {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0].slice(0, 5);
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);

    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "attendance",
        data: { userId: "1", date, checkIn: time, checkOut: null, status: isLate ? "late" : "present" },
      }),
    });
    setCheckedIn(true);
    const res = await fetch("/api/data?type=attendance");
    setRecords(await res.json());
  }

  const statusColor = (s: string) => ({ present: "bg-green-100 text-green-700", late: "bg-amber-100 text-amber-700", absent: "bg-red-100 text-red-700" }[s] || "");

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Attendance</h1>
            <p className="text-muted-foreground text-sm">Track daily check-ins and attendance history</p>
          </div>
          {!checkedIn && (
            <button onClick={handleCheckIn} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Check In Now
            </button>
          )}
        </div>

        {checkedIn && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6 text-sm">
            ✅ Checked in today at {records.find((r) => r.date === new Date().toISOString().split("T")[0])?.checkIn || "N/A"}
          </div>
        )}

        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Check In</th>
                <th className="text-left p-4 font-medium">Check Out</th>
                <th className="text-left p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-4">{r.date}</td>
                  <td className="p-4">{r.checkIn}</td>
                  <td className="p-4">{r.checkOut || "—"}</td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}
