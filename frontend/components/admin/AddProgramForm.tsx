"use client";

import React, { useState } from "react";
import { ArrowRightWithoutLineIcon } from "@/components/icons";
import { Program } from "@/lib/types";
import { programService } from "@/lib/services";

interface AddProgramFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  initialData?: Program | null; // For editing
}

const AddProgramForm: React.FC<AddProgramFormProps> = ({
  onCancel,
  onSuccess,
  initialData,
}) => {
  const [formData, setFormData] = useState<Omit<Program, "id" | "created_at" | "updated_at">>({
    code: initialData?.code || "",
    name: initialData?.name || "",
    is_active: initialData?.is_active ?? true,
    description: initialData?.description || "",
    assessment_title: initialData?.assessment_title || "",
    report_title: initialData?.report_title || "",
    is_demo: initialData?.is_demo || false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = <K extends keyof Omit<Program, "id" | "created_at" | "updated_at">>(
    field: K,
    value: Omit<Program, "id" | "created_at" | "updated_at">[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as string]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
    }
    setError(null);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) errors.code = "Required";
    if (!formData.name.trim()) errors.name = "Required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      if (initialData?.id) {
        await programService.updateProgram(initialData.id, formData);
      } else {
        await programService.createProgram(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save program");
    } finally {
      setIsLoading(false);
    }
  };

  // === Shared style tokens (aligned with AddRegistrationForm / Corporate) ===
  const baseInputClasses =
    "w-full h-[50px] bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-black dark:text-white placeholder-black/40 dark:placeholder-white/60 focus:border-brand-green focus:outline-none transition-all";

  const baseTextAreaClasses =
    "w-full h-[120px] bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder-black/40 dark:placeholder-white/60 focus:border-brand-green focus:outline-none transition-all resize-none";

  const baseLabelClasses =
    "text-xs text-black/70 dark:text-white font-semibold ml-1";

  const toggleWrapperClasses =
    "flex w-full h-[50px] bg-gray-100 dark:bg-white/10 rounded-full p-1 border border-transparent dark:border-transparent";

  const toggleButtonBase =
    "flex-1 text-sm font-bold rounded-full transition-all duration-300 cursor-pointer";

  const activeToggleClasses =
    "bg-brand-green text-white shadow-lg shadow-green-900/20";
  const inactiveToggleClasses =
    "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white";

  return (
    <div className="w-full font-sans animate-fade-in pb-12">
      {/* Header / Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
          <span>Dashboard</span>
          <span className="mx-2 text-gray-400 dark:text-gray-600">
            <ArrowRightWithoutLineIcon className="w-3 h-3 dark:text-white text-black" />
          </span>
          <button
            onClick={onCancel}
            className="hover:text-brand-text-light-primary dark:hover:text-white hover:underline"
          >
            Programs
          </button>
          <span className="mx-2 text-gray-400 dark:text-gray-600">
            <ArrowRightWithoutLineIcon className="w-3 h-3 dark:text-white text-black" />
          </span>
          <span className="text-brand-green font-semibold">
            {initialData ? "Edit Program" : "Add Program"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white tracking-tight">
          {initialData ? "Edit Program" : "Add New Program"}
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-[#24272B] rounded-3xl p-5 sm:p-8 shadow-sm dark:shadow-xl transition-colors duration-300">
        {error && (
          <div className="mb-6 text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Program Code */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>
              Program Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="e.g. SCHOOL_STUDENT"
              className={`${baseInputClasses} ${formErrors.code ? "border-red-500/50" : ""
                }`}
            />
          </div>

          {/* Program Name */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>
              Program Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter Program Name"
              className={`${baseInputClasses} ${formErrors.name ? "border-red-500/50" : ""
                }`}
            />
          </div>

          {/* Assessment Title */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>Assessment Title</label>
            <input
              type="text"
              value={formData.assessment_title ?? ""}
              onChange={(e) => handleChange("assessment_title", e.target.value)}
              placeholder="Enter Assessment Title"
              className={baseInputClasses}
            />
          </div>

          {/* Report Title */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>Report Title</label>
            <input
              type="text"
              value={formData.report_title ?? ""}
              onChange={(e) => handleChange("report_title", e.target.value)}
              placeholder="Enter Report Title"
              className={baseInputClasses}
            />
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <label className={baseLabelClasses}>Description</label>
            <textarea
              value={formData.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Short description for this program"
              className={baseTextAreaClasses}
            />
          </div>

          {/* Toggles Section */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Status Toggle */}
            <div className="space-y-2">
              <label className={baseLabelClasses}>
                Status <span className="text-red-500">*</span>
              </label>
              <div className={toggleWrapperClasses}>
                <button
                  type="button" // Use is_active
                  onClick={() => handleChange("is_active", true)}
                  className={`${toggleButtonBase} ${formData.is_active
                    ? activeToggleClasses
                    : inactiveToggleClasses
                    }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("is_active", false)}
                  className={`${toggleButtonBase} ${!formData.is_active
                    ? activeToggleClasses
                    : inactiveToggleClasses
                    }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            {/* Demo Program Toggle */}
            <div className="space-y-2">
              <label className={baseLabelClasses}>Demo Program?</label>
              <div className={toggleWrapperClasses}>
                <button
                  type="button"
                  onClick={() => handleChange("is_demo", true)}
                  className={`${toggleButtonBase} ${formData.is_demo
                    ? activeToggleClasses
                    : inactiveToggleClasses
                    }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("is_demo", false)}
                  className={`${toggleButtonBase} ${!formData.is_demo
                    ? activeToggleClasses
                    : inactiveToggleClasses
                    }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto px-10 py-3.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full sm:w-auto px-12 py-3.5 rounded-full bg-brand-green text-white font-bold hover:bg-brand-green/90 shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 text-sm flex justify-center items-center"
        >
          {isLoading ? "Saving..." : "Save Program"}
        </button>
      </div>
    </div>
  );
};

export default AddProgramForm;
