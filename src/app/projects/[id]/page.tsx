"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SidebarLayout from "@/components/sidebar-layout";

interface Task {
  id: string; projectId: string; title: string; description: string;
  status: string; assignee: string; priority: string; deadline: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "todo", assignee: "", priority: "medium", deadline: "" });

  useEffect(() => {
    fetch("/api/data?type=projects").then((r) => r.json()).then((all) => {
      const p = all.find((x: any) => x.id === id);
      setProject(p);
    });
    fetch("/api/data?type=tasks").then((r) => r.json()).then((all) => {
      setTaskList(all.filter((t: Task) => t.projectId === id));
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "task", data: { ...form, projectId: id } }),
    });
    setShowForm(false);
    setForm({ title: "", description: "", status: "todo", assignee: "", priority: "medium", deadline: "" });
    const res = await fetch("/api/data?type=tasks");
    setTaskList((await res.json()).filter((t: Task) => t.projectId === id));
  }

  const statusColor = (s: string) => ({ todo: "bg-zinc-100 text-zinc-600", "in-progress": "bg-blue-100 text-blue-700", review: "bg-amber-100 text-amber-700", done: "bg-green-100 text-green-700" }[s] || "");

  if (!project) return <SidebarLayout><div className="p-6">Loading...</div></SidebarLayout>;

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-muted-foreground text-sm">{project.description}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-[#6c5ce7] hover:bg-[#5a4bd1] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Add Task
          </button>
        </div>

        <div className="bg-card border rounded-xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">Status</span><p className="font-medium capitalize">{project.status}</p></div>
          <div><span className="text-muted-foreground">Priority</span><p className="font-medium capitalize">{project.priority}</p></div>
          <div><span className="text-muted-foreground">Deadline</span><p className="font-medium">{project.deadline}</p></div>
          <div><span className="text-muted-foreground">Progress</span><p className="font-medium">{project.progress}%</p></div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-5 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium block mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required /></div>
              <div><label className="text-sm font-medium block mb-1">Assignee</label>
                <input type="text" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" /></div>
              <div><label className="text-sm font-medium block mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select></div>
              <div><label className="text-sm font-medium block mb-1">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" /></div>
              <div className="md:col-span-2"><label className="text-sm font-medium block mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" rows={2} /></div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-[#6c5ce7] text-white px-4 py-2 rounded-lg text-sm">Create Task</button>
              <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {taskList.map((task) => (
            <div key={task.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-sm">{task.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{task.description} — <strong>{task.assignee}</strong></p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(task.status)}`}>{task.status}</span>
                <span className="text-xs text-muted-foreground">{task.deadline}</span>
              </div>
            </div>
          ))}
          {taskList.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tasks yet. Add your first task!</p>}
        </div>
      </div>
    </SidebarLayout>
  );
}
