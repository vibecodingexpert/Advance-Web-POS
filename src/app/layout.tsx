import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMS - Project Management System",
  description: "Manage projects, tasks, and team attendance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
