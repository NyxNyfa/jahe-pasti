"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, Sprout, Building2, FlaskConical, UserCircle } from "lucide-react";
import { UserSession } from "@/lib/auth";
import { WalletConnect } from "./WalletConnect";

interface NavbarProps {
  currentUser?: UserSession | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "FARMER":
        return <Sprout className="w-4 h-4 text-emerald-600" />;
      case "COOPERATIVE":
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case "QC":
        return <FlaskConical className="w-4 h-4 text-indigo-600" />;
      default:
        return <UserCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "FARMER":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "COOPERATIVE":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "QC":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              JP
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">JahePasti</span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                Solana Devnet
              </span>
            </div>
          </Link>

          {/* Right Actions: Solana Wallet + User Status + Logout */}
          <div className="flex items-center gap-3">
            {/* Phantom Wallet Connect Button */}
            <WalletConnect />

            {currentUser ? (
              <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-gray-200">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-gray-800">{currentUser.nama}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${getRoleBadge(
                      currentUser.role
                    )}`}
                  >
                    {getRoleIcon(currentUser.role)}
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout untuk berganti akun / peran"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Masuk (Login)
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
