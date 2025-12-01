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
      className={`flex items-center gap-2 px-4 py-2.5 bg-brand-light-tertiary dark:bg-brand-dark-tertiary rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:opacity-90 transition-opacity disabled:opacity-50 ${className}`}
    >
      <span>{isLoading ? "Exporting..." : "Excel Export"}</span>
      <div className="p-0.5 rounded text-white flex items-center justify-center">
        <ExcelIcon className="w-3 h-3" />
      </div>
    </button>
  );
};

export default ExcelExportButton;
