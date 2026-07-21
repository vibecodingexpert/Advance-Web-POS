export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "employee";
  avatar?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  priority: "low" | "medium" | "high";
  progress: number;
  deadline: string;
  team: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  assignee: string;
  priority: "low" | "medium" | "high";
  deadline: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: "present" | "late" | "absent";
}

export const users: User[] = [
  { id: "1", name: "Amir", email: "amir", password: "amir!@26", role: "admin" },
  { id: "2", name: "Sara Khan", email: "sara@demo.com", password: "demo123", role: "manager" },
  { id: "3", name: "Ali Raza", email: "ali@demo.com", password: "demo123", role: "employee" },
];

export let projects: Project[] = [
  {
    id: "p1",
    title: "E-Commerce Website",
    description: "Full-stack e-commerce platform with Next.js",
    status: "active",
    priority: "high",
    progress: 65,
    deadline: "2026-09-15",
    team: ["Amir", "Sara Khan", "Ali Raza"],
    createdAt: "2026-06-01",
  },
  {
    id: "p2",
    title: "Mobile App - Fitness Tracker",
    description: "React Native fitness tracking application",
    status: "active",
    priority: "medium",
    progress: 30,
    deadline: "2026-11-20",
    team: ["Sara Khan", "Ali Raza"],
    createdAt: "2026-07-10",
  },
  {
    id: "p3",
    title: "HR Management System",
    description: "Internal HR portal for employee management",
    status: "completed",
    priority: "medium",
    progress: 100,
    deadline: "2026-08-01",
    team: ["Amir", "Sara Khan"],
    createdAt: "2026-04-15",
  },
  {
    id: "p4",
    title: "AI Chatbot Integration",
    description: "Customer support chatbot using OpenAI API",
    status: "on-hold",
    priority: "low",
    progress: 15,
    deadline: "2026-12-31",
    team: ["Ali Raza"],
    createdAt: "2026-08-01",
  },
];

export let tasks: Task[] = [
  { id: "t1", projectId: "p1", title: "Setup Next.js project", description: "Initialize with TypeScript and Tailwind", status: "done", assignee: "Amir", priority: "high", deadline: "2026-06-10", createdAt: "2026-06-01" },
  { id: "t2", projectId: "p1", title: "User authentication", description: "Implement login/signup with NextAuth", status: "done", assignee: "Amir", priority: "high", deadline: "2026-06-25", createdAt: "2026-06-05" },
  { id: "t3", projectId: "p1", title: "Product catalog page", description: "Grid view with search and filters", status: "in-progress", assignee: "Sara Khan", priority: "high", deadline: "2026-07-30", createdAt: "2026-06-15" },
  { id: "t4", projectId: "p1", title: "Shopping cart", description: "Cart with add/remove/quantity", status: "todo", assignee: "Ali Raza", priority: "medium", deadline: "2026-08-20", createdAt: "2026-06-20" },
  { id: "t5", projectId: "p2", title: "Design UI screens", description: "Figma designs for all screens", status: "in-progress", assignee: "Sara Khan", priority: "high", deadline: "2026-08-15", createdAt: "2026-07-10" },
  { id: "t6", projectId: "p2", title: "Set up React Native project", description: "Initialize with Expo", status: "done", assignee: "Ali Raza", priority: "medium", deadline: "2026-07-25", createdAt: "2026-07-10" },
  { id: "t7", projectId: "p3", title: "Employee CRUD", description: "Add/edit/delete employee records", status: "done", assignee: "Amir", priority: "high", deadline: "2026-05-20", createdAt: "2026-04-15" },
  { id: "t8", projectId: "p3", title: "Leave management", description: "Leave request and approval flow", status: "done", assignee: "Sara Khan", priority: "medium", deadline: "2026-06-15", createdAt: "2026-05-01" },
  { id: "t9", projectId: "p4", title: "Research OpenAI API", description: "Test API and pricing", status: "done", assignee: "Ali Raza", priority: "low", deadline: "2026-08-20", createdAt: "2026-08-01" },
];

export let attendance: Attendance[] = [
  { id: "a1", userId: "1", date: "2026-07-21", checkIn: "09:00", checkOut: "18:00", status: "present" },
  { id: "a2", userId: "2", date: "2026-07-21", checkIn: "09:15", checkOut: "18:30", status: "present" },
  { id: "a3", userId: "3", date: "2026-07-21", checkIn: "09:45", checkOut: null, status: "late" },
  { id: "a4", userId: "1", date: "2026-07-20", checkIn: "08:55", checkOut: "17:45", status: "present" },
  { id: "a5", userId: "2", date: "2026-07-20", checkIn: "09:05", checkOut: "17:30", status: "present" },
  { id: "a6", userId: "3", date: "2026-07-20", checkIn: "10:00", checkOut: "18:00", status: "late" },
];

export const teamMembers = [
  { id: "1", name: "Amir", role: "Admin", email: "amir@demo.com", projects: 2, status: "active" },
  { id: "2", name: "Sara Khan", role: "Manager", email: "sara@demo.com", projects: 3, status: "active" },
  { id: "3", name: "Ali Raza", role: "Developer", email: "ali@demo.com", projects: 2, status: "active" },
  { id: "4", name: "Fatima Ahmed", role: "Designer", email: "fatima@demo.com", projects: 1, status: "active" },
  { id: "5", name: "Usman Malik", role: "Developer", email: "usman@demo.com", projects: 1, status: "inactive" },
];
