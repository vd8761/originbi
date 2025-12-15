"use client";

import React, { useState, useEffect } from "react";
import { BulkUploadIcon, ArrowRightWithoutLineIcon } from "@/components/icons";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomSelect from "@/components/ui/CustomSelect";
import MobileInput from "@/components/ui/MobileInput";
import { registrationService } from "@/lib/services";
import { CreateRegistrationDto } from "@/lib/services/registration.service";
import { Program, Department } from "@/lib/types";
import { BulkUploadModal } from "@/components/ui/BulkUploadModal";

interface AddRegistrationFormProps {
  onCancel: () => void;
  onRegister: () => void;
}

const AddRegistrationForm: React.FC<AddRegistrationFormProps> = ({
  onCancel,
  onRegister,
}) => {
  // --- State ---
  const [formData, setFormData] = useState<CreateRegistrationDto>({
    full_name: "",
    gender: "Female",
    email: "",
    country_code: "+91",
    mobile_number: "",
    program_id: "",
    group_name: "",
    send_email: false,
    exam_start: "",
    exam_end: "",
    school_level: undefined,
    school_stream: undefined,
    current_year: "",
    department_degree_id: "",
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Track active field for Z-Index management
  const [activeField, setActiveField] = useState<string | null>(null);

  // Static Options
  const schoolLevels = [
    { value: "SSLC", label: "SSLC" },
    { value: "HSC", label: "HSC" },
  ];

  const schoolStreams = [
    { value: "Science", label: "Science" },
    { value: "Commerce", label: "Commerce" },
    { value: "Humanities", label: "Humanities" },
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [progRes, deptRes] = await Promise.all([
          registrationService.getPrograms(),
          registrationService.getDepartments(),
        ]);
        setPrograms(progRes);
        setDepartments(deptRes);
      } catch (err) {
        console.error("Failed to load form data", err);
      }
    };
    fetchInitialData();
  }, []);

  // --- Handlers ---
  const handleInputChange = (field: keyof CreateRegistrationDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setError(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.full_name.trim()) errors.full_name = "Required";
    if (!formData.email.trim()) errors.email = "Required";
    if (!formData.mobile_number.trim()) errors.mobile_number = "Required";
    if (!formData.program_id) errors.program_id = "Required";
    if (!formData.exam_start || !formData.exam_end)
      errors.exam_start = "Required";

    const selectedProgram = programs.find(
      (p) => p.id === formData.program_id
    );

    if (selectedProgram?.code === "SCHOOL") {
      if (!formData.school_level) errors.school_level = "Required";
      if (formData.school_level === "HSC") {
        if (!formData.school_stream) errors.school_stream = "Required";
        if (!formData.current_year) errors.current_year = "Required";
      }
    }

    if (selectedProgram?.code === "COLLEGE") {
      if (!formData.department_degree_id) errors.department_degree_id = "Required";
      if (!formData.current_year) errors.current_year = "Required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      await registrationService.createRegistration(formData);
      onRegister();
    } catch (err: any) {
      setError(err.message || "Failed to create registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentProgramCode = programs.find(
    (p) => p.id === formData.program_id
  )?.code;

  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));
  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  // === Shared style tokens (MATCH corporate form) ===
  const baseInputClasses =
    "w-full h-[50px] bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-black dark:text-white placeholder-black/40 dark:placeholder-white/60 focus:border-brand-green focus:outline-none transition-all";

  const baseLabelClasses =
    "text-xs text-black/70 dark:text-white font-semibold ml-1";

  const baseSectionTitleClasses =
    "text-base font-semibold text-brand-text-light-primary dark:text-white mb-6";

  const toggleWrapperClasses =
    "flex w-full h-[50px] bg-gray-100 dark:bg-white/10 rounded-full p-1 border border-transparent dark:border-transparent";

  const toggleButtonBase =
    "flex-1 text-sm font-normal rounded-full transition-all duration-300 cursor-pointer";

  const activeToggleClasses =
    "bg-brand-green text-white shadow-lg shadow-green-900/20";
  const inactiveToggleClasses =
    "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white";

  return (
    <div className="w-full font-sans animate-fade-in pb-12">
      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={onRegister}
      />

      {/* Header – aligned with Corporate form */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
            <span>Dashboard</span>
            <span className="mx-2 text-gray-400 dark:text-gray-600">
              <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
            </span>
            <button
              onClick={onCancel}
              className="hover:text-brand-text-light-primary dark:hover:text-white hover:underline"
            >
              My Employees
            </button>
            <span className="mx-2 text-gray-400 dark:text-gray-600">
              <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
            </span>
            <span className="text-brand-green font-semibold">
              Add Registrations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white tracking-tight">
            Add Registrations
          </h1>
        </div>

        {/* Bulk Registration button (same pattern as corporate action buttons) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-tertiary dark:bg-[#1A3A2C] border border-transparent dark:border-[#1A3A2C] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:opacity-90 transition-opacity"
          >
            <span>Bulk Registration</span>
            <BulkUploadIcon className="w-4 h-4 dark:text-white text-brand-green" />
          </button>
        </div>
      </div>

      {/* Form Card – same container style as corporate */}
      <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-[#24272B] rounded-3xl p-5 sm:p-8 shadow-sm dark:shadow-xl transition-colors duration-300 relative">
        {error && (
          <div className="mb-6 text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}

        {/* --- Section 1: Basic Information --- */}
        <div className="mb-8">
          <h2 className={baseSectionTitleClasses}>Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Full Name */}
            <div className="space-y-2 z-0">
              <label className={baseLabelClasses}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Example Name"
                className={`${baseInputClasses} ${formErrors.full_name ? "border-red-500/50" : ""
                  }`}
              />
            </div>

            {/* Gender Toggle */}
            <div className="space-y-2 z-0">
              <label className={baseLabelClasses}>
                Gender <span className="text-red-500">*</span>
              </label>
              <div className={toggleWrapperClasses}>
                {["Male", "Female", "Other"].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleInputChange("gender", gender)}
                    className={`${toggleButtonBase} ${formData.gender === gender
                      ? activeToggleClasses
                      : inactiveToggleClasses
                      }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2 z-0">
              <label className={baseLabelClasses}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="example@gmail.com"
                className={`${baseInputClasses} ${formErrors.email ? "border-red-500/50" : ""
                  }`}
              />
            </div>

            {/* Mobile Input - High Z-Index on Interaction */}
            <div
              className={`space-y-2 relative ${activeField === "mobile" ? "z-50" : "z-0"
                }`}
              onMouseEnter={() => setActiveField("mobile")}
              onMouseLeave={() => setActiveField(null)}
            >
              <MobileInput
                countryCode={formData.country_code}
                phoneNumber={formData.mobile_number}
                onCountryChange={(code) =>
                  handleInputChange("country_code", code)
                }
                onPhoneChange={(num) => handleInputChange("mobile_number", num)}
                label="Mobile Number (without +91)"
                required
                error={formErrors.mobile_number}
              />
            </div>
          </div>
        </div>

        {/* --- Section 2: Enrollment Details --- */}
        <div className="mb-4">
          <h2 className={baseSectionTitleClasses}>Enrollment Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Program Type */}
            <div
              className={`relative ${activeField === "program" ? "z-50" : "z-auto"
                }`}
              onMouseEnter={() => setActiveField("program")}
              onMouseLeave={() => setActiveField(null)}
            >
              <CustomSelect
                label="Program Type"
                required
                options={programOptions}
                value={formData.program_id}
                onChange={(val) => {
                  handleInputChange("program_id", val);
                  handleInputChange("school_level", "");
                  handleInputChange("school_stream", "");
                  handleInputChange("current_year", "");
                  handleInputChange("department_degree_id", "");
                }}
                placeholder="Choose Program Type"
              />
              {formErrors.program_id && (
                <p className="text-xs text-red-500 ml-1 mt-1">
                  {formErrors.program_id}
                </p>
              )}
            </div>

            {/* School Level (for SCHOOL) */}
            {currentProgramCode === "SCHOOL" && (
              <div
                className={`relative animate-fade-in ${activeField === "schoolLevel" ? "z-50" : "z-auto"
                  }`}
                onMouseEnter={() => setActiveField("schoolLevel")}
                onMouseLeave={() => setActiveField(null)}
              >
                <CustomSelect
                  label="School Level"
                  required
                  options={schoolLevels}
                  value={formData.school_level || ""}
                  onChange={(val) => handleInputChange("school_level", val)}
                  placeholder="Select Level"
                />
                {formErrors.school_level && (
                  <p className="text-xs text-red-500 ml-1 mt-1">
                    {formErrors.school_level}
                  </p>
                )}
              </div>
            )}

            {/* Stream (for SCHOOL + HSC) */}
            {currentProgramCode === "SCHOOL" &&
              formData.school_level === "HSC" && (
                <div
                  className={`relative animate-fade-in ${activeField === "stream" ? "z-50" : "z-auto"
                    }`}
                  onMouseEnter={() => setActiveField("stream")}
                  onMouseLeave={() => setActiveField(null)}
                >
                  <CustomSelect
                    label="Stream"
                    required
                    options={schoolStreams}
                    value={formData.school_stream || ""}
                    onChange={(val) =>
                      handleInputChange("school_stream", val)
                    }
                    placeholder="Select Stream"
                  />
                  {formErrors.school_stream && (
                    <p className="text-xs text-red-500 ml-1 mt-1">
                      {formErrors.school_stream}
                    </p>
                  )}
                </div>
              )}

            {/* Department (for COLLEGE) */}
            {currentProgramCode === "COLLEGE" && (
              <div
                className={`relative animate-fade-in ${activeField === "dept" ? "z-50" : "z-auto"
                  }`}
                onMouseEnter={() => setActiveField("dept")}
                onMouseLeave={() => setActiveField(null)}
              >
                <CustomSelect
                  label="Department"
                  required
                  options={departmentOptions}
                  value={formData.department_degree_id || ""}
                  onChange={(val) => handleInputChange("department_degree_id", val)}
                  placeholder="Select Department"
                />
                {formErrors.department_degree_id && (
                  <p className="text-xs text-red-500 ml-1 mt-1">
                    {formErrors.department_degree_id}
                  </p>
                )}
              </div>
            )}

            {/* Current Year – for (SCHOOL + HSC) or COLLEGE */}
            {((currentProgramCode === "SCHOOL" &&
              formData.school_level === "HSC") ||
              currentProgramCode === "COLLEGE") && (
                <div className="space-y-2 animate-fade-in relative z-0">
                  <label className={baseLabelClasses}>
                    Current Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={currentProgramCode === "SCHOOL" ? 2 : 4}
                    value={formData.current_year || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "current_year",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder={currentProgramCode === "SCHOOL" ? "12" : "2025"}
                    className={`${baseInputClasses} ${formErrors.current_year ? "border-red-500/50" : ""
                      }`}
                  />
                  {formErrors.current_year && (
                    <p className="text-xs text-red-500 ml-1 mt-1">
                      {formErrors.current_year}
                    </p>
                  )}
                </div>
              )}

            {/* Group Name */}
            <div className="space-y-2 relative z-0">
              <label className={baseLabelClasses}>Group Name</label>
              <input
                type="text"
                value={formData.group_name}
                onChange={(e) =>
                  handleInputChange("group_name", e.target.value)
                }
                placeholder="Enter the Group Name"
                className={baseInputClasses}
              />
            </div>

            {/* Send Email Notification Toggle */}
            <div className="space-y-2 relative z-0">
              <label className={baseLabelClasses}>
                Send Email Notification{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className={toggleWrapperClasses}>
                <button
                  type="button"
                  onClick={() => handleInputChange("send_email", true)}
                  className={`${toggleButtonBase} ${formData.send_email
                    ? activeToggleClasses
                    : inactiveToggleClasses
                    }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("send_email", false)}
                  className={`${toggleButtonBase} ${!formData.send_email
                    ? activeToggleClasses
                    : inactiveToggleClasses
                    }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Schedule Exam */}
            <div
              className={`space-y-2 relative lg:col-span-2 ${activeField === "exam" ? "z-50" : "z-auto"
                }`}
              onMouseEnter={() => setActiveField("exam")}
              onMouseLeave={() => setActiveField(null)}
            >
              <label className={baseLabelClasses}>
                Schedule Exam <span className="text-red-500">*</span>
              </label>
              <CustomDatePicker
                value={
                  formData.exam_start
                    ? { start: formData.exam_start, end: formData.exam_end || "" }
                    : undefined
                }
                onChange={(start, end) => {
                  handleInputChange("exam_start", start);
                  handleInputChange("exam_end", end);
                }}
              />
              {formErrors.exam_start && (
                <p className="text-xs text-red-500 ml-1 mt-1">
                  {formErrors.exam_start}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions – same buttons as corporate/program forms */}
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
          {isLoading ? "Processing..." : "Register"}
        </button>
      </div>
    </div>
  );
};

export default AddRegistrationForm;
