"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/sidebar-layout";

interface Project {
  id: string; title: string; description: string; status: string;
  priority: string; progress: number; deadline: string; team: string[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "active", priority: "medium", deadline: "", team: "" });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/data?type=projects").then((r) => r.json()).then(setProjects);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "project", data: { ...form, progress: 0, team: form.team.split(",").map((t: string) => t.trim()) } }),
    });
    setShowForm(false);
    setForm({ title: "", description: "", status: "active", priority: "medium", deadline: "", team: "" });
    const res = await fetch("/api/data?type=projects");
    setProjects(await res.json());
  }

  const statusColor = (s: string) => ({ active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", "on-hold": "bg-amber-100 text-amber-700" }[s] || "");
  const priorityColor = (p: string) => ({ high: "text-red-500", medium: "text-amber-500", low: "text-blue-500" }[p] || "");

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground text-sm">Manage all your projects</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-[#6c5ce7] hover:bg-[#5a4bd1] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + New Project
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-5 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium block mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required /></div>
              <div><label className="text-sm font-medium block mb-1">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required /></div>
              <div className="md:col-span-2"><label className="text-sm font-medium block mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" rows={2} /></div>
              <div><label className="text-sm font-medium block mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select></div>
              <div><label className="text-sm font-medium block mb-1">Team (comma-separated)</label>
                <input type="text" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Amir, Sara, Ali" /></div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-[#6c5ce7] text-white px-4 py-2 rounded-lg text-sm">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} onClick={() => router.push(`/projects/${p.id}`)} className="bg-card border rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{p.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(p.status)}`}>{p.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${priorityColor(p.priority)}`}>{p.priority}</span>
                <span className="text-muted-foreground">{p.deadline}</span>
              </div>
              <div className="mt-3 w-full bg-zinc-200 rounded-full h-2">
                <div className="bg-[#6c5ce7] h-2 rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{p.progress}% complete</span>
                <span>{p.team.length} members</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
