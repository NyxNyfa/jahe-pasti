import React from "react";
import { BatchStatus } from "@/lib/db";

interface StatusBadgeProps {
  status: BatchStatus;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "Registered":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Harvested":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "FieldVerified":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UnderReview":
        return "bg-purple-50 text-purple-700 border-purple-200 animate-pulse";
      case "LabApproved":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-300 font-semibold";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "Registered":
        return "Terdaftar (Lahan)";
      case "Harvested":
        return "Panen Dicatat";
      case "FieldVerified":
        return "Lolos Sortasi Lapangan";
      case "UnderReview":
        return "Perlu Tinjauan (Under Review)";
      case "LabApproved":
        return "Lolos Uji Lab CoA";
      case "Accepted":
        return "Diterima Pabrik (Accepted 2-of-3)";
      case "Rejected":
        return "Ditolak (Rejected)";
      default:
        return status;
    }
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs md:text-sm",
    lg: "px-3.5 py-1.5 text-sm md:text-base font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${getBadgeStyle()} ${sizeClasses[size]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {getLabel()}
    </span>
  );
};
