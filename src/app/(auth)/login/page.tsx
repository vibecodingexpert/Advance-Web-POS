"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError("Invalid username or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium text-xl">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12h6" /><path d="M12 9v6" />
          </svg>
          POS
        </a>
        <div className="flex flex-col gap-6">
          <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
            <div className="px-6 text-center">
              <div className="font-semibold text-xl">Welcome back</div>
              <div className="text-muted-foreground text-sm mt-1">Enter your username and password to login</div>
            </div>
            <div className="px-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Username</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#6c5ce7] hover:bg-[#5a4bd1] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
          </div>
          <p className="text-muted-foreground text-xs text-center">
            By clicking continue, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
