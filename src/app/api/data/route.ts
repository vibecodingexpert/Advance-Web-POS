import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { projects, tasks, attendance, teamMembers } from "@/lib/data";

export async function GET(request: Request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  switch (type) {
    case "dashboard":
      return NextResponse.json({
        stats: {
          totalProjects: projects.length,
          activeProjects: projects.filter((p) => p.status === "active").length,
          totalTasks: tasks.length,
          pendingTasks: tasks.filter((t) => t.status !== "done").length,
          teamMembers: teamMembers.filter((m) => m.status === "active").length,
          todayAttendance: attendance.filter((a) => a.date === new Date().toISOString().split("T")[0]).length,
        },
        recentProjects: projects.slice(0, 4),
        recentTasks: tasks.filter((t) => t.status !== "done").slice(0, 5),
      });
    case "projects":
      return NextResponse.json(projects);
    case "tasks":
      return NextResponse.json(tasks);
    case "attendance":
      return NextResponse.json(attendance);
    case "team":
      return NextResponse.json(teamMembers);
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, data } = body;

  switch (type) {
    case "project":
      projects.unshift({
        id: "p" + Date.now(),
        ...data,
        createdAt: new Date().toISOString().split("T")[0],
      });
      return NextResponse.json({ success: true });
    case "task":
      tasks.unshift({
        id: "t" + Date.now(),
        ...data,
        createdAt: new Date().toISOString().split("T")[0],
      });
      return NextResponse.json({ success: true });
    case "attendance":
      attendance.unshift({
        id: "a" + Date.now(),
        ...data,
      });
      return NextResponse.json({ success: true });
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}
