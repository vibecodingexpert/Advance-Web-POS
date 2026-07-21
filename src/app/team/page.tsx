"use client";

import { useEffect, useState } from "react";
import SidebarLayout from "@/components/sidebar-layout";

interface Member {
  id: string; name: string; role: string; email: string;
  projects: number; status: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch("/api/data?type=team").then((r) => r.json()).then(setMembers);
  }, []);

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Team</h1>
            <p className="text-muted-foreground text-sm">Manage your team members</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div key={m.id} className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#6c5ce7] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{m.name}</h3>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${m.status === "active" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {m.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📧 {m.email}</p>
                <p>📁 {m.projects} projects</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
