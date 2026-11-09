import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JahePasti - Verifikasi Mutu & Keaslian Jahe Merah (Solana Devnet)",
  description: "Sistem verifikasi mutu per batch rimpang jahe merah dari kebun hingga pabrik dengan AI dan Solana Devnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 min-h-screen text-slate-900">
        {children}
      </body>
    </html>
  );
}
