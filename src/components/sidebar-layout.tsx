"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Projects", href: "/projects", icon: "📁" },
  { label: "Attendance", href: "/attendance", icon: "📋" },
  { label: "Team", href: "/team", icon: "👥" },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/login");
    router.push("/login");
  }

  return (
    <div className="flex h-screen">
      <aside className={`bg-zinc-900 text-white w-64 flex flex-col fixed h-full z-30 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 border-b border-zinc-700">
          <div className="flex items-center gap-2 text-lg font-bold">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12h6" /><path d="M12 9v6" />
            </svg>
            POS
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></svg>
          </button>
          <div className="text-sm text-muted-foreground hidden sm:block">Point of Sale System</div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6c5ce7] rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted">{children}</main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
