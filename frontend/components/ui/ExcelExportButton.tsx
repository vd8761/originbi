import React from "react";
import { ExcelIcon } from "@/components/icons";

interface ExcelExportButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
  onClick,
  isLoading,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm disabled:opacity-50 cursor-pointer ${className}`}
    >
      <span>{isLoading ? "Exporting..." : "Excel Export"}</span>
      <div className="flex items-center justify-center">
        <ExcelIcon className="w-5 h-5 text-green-600" />
      </div>
    </button>
  );
};

export default ExcelExportButton;
