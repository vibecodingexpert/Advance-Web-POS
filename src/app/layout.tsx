import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS - Advanced Web POS",
  description: "Point of Sale system for managing sales, inventory, and team",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
