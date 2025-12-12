"use client";

import React, { useState, useEffect } from "react";
import {
  BulkUploadIcon,
  ArrowRightWithoutLineIcon,
  EyeVisibleIcon,
  EyeOffIcon,
} from "@/components/icons";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomSelect from "@/components/ui/CustomSelect";
import MobileInput from "@/components/ui/MobileInput";
import {
  registrationService,
  CreateRegistrationDto,
} from "@/lib/registrationService";
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
    name: "",
    gender: "Female",
    email: "",
    countryCode: "+91",
    mobile: "",
    programType: "",
    groupName: "",
    sendEmail: false,
    examStart: "",
    examEnd: "",
    schoolLevel: "",
    schoolStream: "",
    currentYear: "",
    departmentId: "",
    password: "",
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      // 1) Programs
      try {
        const progRes = await registrationService.getPrograms();
        //console.log("Programs in form:", progRes);
        setPrograms(progRes);
      } catch (err) {
        console.error("Failed to load programs", err);
      }

      // 2) Departments (optional)
      try {
        const deptRes = await registrationService.getDepartments();
        //console.log("Departments in form:", deptRes);
        setDepartments(deptRes);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };

    fetchInitialData();
  }, []);

  // ---- Helpers based on selected program ----
  const selectedProgram = programs.find((p) => p.id === formData.programType);
  const isSchoolProgram = selectedProgram?.code === "SCHOOL_STUDENT";
  const isCollegeProgram = selectedProgram?.code === "COLLEGE_STUDENT";

  // --- Handlers ---
  const handleInputChange = (
    field: keyof CreateRegistrationDto,
    value: any
  ) => {
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

    if (!formData.name.trim()) errors.name = "Required";
    if (!formData.email.trim()) errors.email = "Required";
    if (!formData.mobile.trim()) errors.mobile = "Required";
    if (!formData.programType) errors.programType = "Required";
    if (!formData.examStart || !formData.examEnd) errors.examStart = "Required";

    if (isSchoolProgram) {
      if (!formData.schoolLevel) errors.schoolLevel = "Required";
      if (formData.schoolLevel === "HSC") {
        if (!formData.schoolStream) errors.schoolStream = "Required";
        if (!formData.currentYear) errors.currentYear = "Required";
      }
    }

    if (isCollegeProgram) {
      if (!formData.departmentId) errors.departmentId = "Required";
      if (!formData.currentYear) errors.currentYear = "Required";
    }

    if (!formData.password?.trim()) {
      errors.password = "Required";
    } else {
      const pwd = formData.password;

      if (pwd.length < 8) errors.password = "Minimum 8 characters";
      else if (!/[A-Z]/.test(pwd))
        errors.password = "Must contain 1 uppercase letter";
      else if (!/[a-z]/.test(pwd))
        errors.password = "Must contain 1 lowercase letter";
      else if (!/[0-9]/.test(pwd)) errors.password = "Must contain 1 number";
      else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd))
        errors.password = "Must contain 1 special character";
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
      await registrationService.createUser(formData);
      onRegister();
    } catch (err: any) {
      setError(err.message || "Failed to create registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));
  //console.log("programOptions:", programOptions);

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    handleInputChange("password", pwd);
    setShowPassword(true);
  };

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

      {/* Header */}
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

      {/* Form Card */}
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
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Example Name"
                className={`${baseInputClasses} ${
                  formErrors.name ? "border-red-500/50" : ""
                }`}
              />
            </div>

            {/* Gender */}
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
                    className={`${toggleButtonBase} ${
                      formData.gender === gender
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
                className={`${baseInputClasses} ${
                  formErrors.email ? "border-red-500/50" : ""
                }`}
              />
            </div>

            {/* Mobile */}
            <div
              className={`space-y-2 relative ${
                activeField === "mobile" ? "z-50" : "z-0"
              }`}
              onMouseEnter={() => setActiveField("mobile")}
              onMouseLeave={() => setActiveField(null)}
            >
              <MobileInput
                countryCode={formData.countryCode}
                phoneNumber={formData.mobile}
                onCountryChange={(code) =>
                  handleInputChange("countryCode", code)
                }
                onPhoneChange={(num) => handleInputChange("mobile", num)}
                label="Mobile Number (without +91)"
                required
                error={formErrors.mobile}
              />
            </div>
            {/* Password + Generate + Eye Icon */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={baseLabelClasses}>
                  Password <span className="text-red-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] font-medium cursor-pointer text-brand-green hover:text-brand-green/80"
                >
                  Generate Password
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Set login password"
                  className={`${baseInputClasses} pr-12 ${
                    formErrors.password ? "border-red-500/50" : ""
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeVisibleIcon className="w-4 h-4 text-brand-green" />
                  ) : (
                    <EyeOffIcon className="w-4 h-4 text-brand-green" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Section 2: Enrollment Details --- */}
        <div className="mb-4">
          <h2 className={baseSectionTitleClasses}>Enrollment Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Program Type */}
            <div
              className={`relative ${
                activeField === "program" ? "z-50" : "z-auto"
              }`}
              onMouseEnter={() => setActiveField("program")}
              onMouseLeave={() => setActiveField(null)}
            >
              <CustomSelect
                label="Program Type"
                required
                options={programOptions}
                value={formData.programType}
                onChange={(val) => {
                  handleInputChange("programType", val);
                  handleInputChange("schoolLevel", "");
                  handleInputChange("schoolStream", "");
                  handleInputChange("currentYear", "");
                  handleInputChange("departmentId", "");
                }}
                placeholder="Choose Program Type"
              />
              {formErrors.programType && (
                <p className="text-xs text-red-500 ml-1 mt-1">
                  {formErrors.programType}
                </p>
              )}
            </div>

            {/* School Level (for School Students) */}
            {isSchoolProgram && (
              <div
                className={`relative animate-fade-in ${
                  activeField === "schoolLevel" ? "z-50" : "z-auto"
                }`}
                onMouseEnter={() => setActiveField("schoolLevel")}
                onMouseLeave={() => setActiveField(null)}
              >
                <CustomSelect
                  label="School Level"
                  required
                  options={schoolLevels}
                  value={formData.schoolLevel || ""}
                  onChange={(val) => {
                    handleInputChange("schoolLevel", val);
                    handleInputChange("schoolStream", "");
                    handleInputChange("currentYear", "");
                  }}
                  placeholder="Select Level"
                />
                {formErrors.schoolLevel && (
                  <p className="text-xs text-red-500 ml-1 mt-1">
                    {formErrors.schoolLevel}
                  </p>
                )}
              </div>
            )}

            {/* Stream (HSC only) */}
            {isSchoolProgram && formData.schoolLevel === "HSC" && (
              <div
                className={`relative animate-fade-in ${
                  activeField === "stream" ? "z-50" : "z-auto"
                }`}
                onMouseEnter={() => setActiveField("stream")}
                onMouseLeave={() => setActiveField(null)}
              >
                <CustomSelect
                  label="Stream"
                  required
                  options={schoolStreams}
                  value={formData.schoolStream || ""}
                  onChange={(val) => handleInputChange("schoolStream", val)}
                  placeholder="Select Stream"
                />
                {formErrors.schoolStream && (
                  <p className="text-xs text-red-500 ml-1 mt-1">
                    {formErrors.schoolStream}
                  </p>
                )}
              </div>
            )}

            {/* Current Level (HSC – 1 or 2) */}
            {isSchoolProgram && formData.schoolLevel === "HSC" && (
              <div className="space-y-2 animate-fade-in relative z-0">
                <label className={baseLabelClasses}>
                  Current Level <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={2}
                  value={formData.currentYear || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "currentYear",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="1 or 2"
                  className={`${baseInputClasses} ${
                    formErrors.currentYear ? "border-red-500/50" : ""
                  }`}
                />
                {formErrors.currentYear && (
                  <p className="text-xs text-red-500 ml-1 mt-1">
                    {formErrors.currentYear}
                  </p>
                )}
              </div>
            )}

            {/* Department (College Students) */}
            {isCollegeProgram && (
              <div
                className={`relative animate-fade-in ${
                  activeField === "dept" ? "z-50" : "z-auto"
                }`}
                onMouseEnter={() => setActiveField("dept")}
                onMouseLeave={() => setActiveField(null)}
              >
                <CustomSelect
                  label="Department"
                  required
                  options={departmentOptions}
                  value={formData.departmentId || ""}
                  onChange={(val) => handleInputChange("departmentId", val)}
                  placeholder="Select Department"
                />
                {formErrors.departmentId && (
                  <p className="text-xs text-red-500 ml-1 mt-1">
                    {formErrors.departmentId}
                  </p>
                )}
              </div>
            )}

            {/* Current Year (College Students) */}
            {isCollegeProgram && (
              <div className="space-y-2 animate-fade-in relative z-0">
                <label className={baseLabelClasses}>
                  Current Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={formData.currentYear || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "currentYear",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter Year (1–4)"
                  className={`${baseInputClasses} ${
                    formErrors.currentYear ? "border-red-500/50" : ""
                  }`}
                />
                {formErrors.currentYear && (
                  <p className="text-xs text-red-500 ml-1 mt-1">
                    {formErrors.currentYear}
                  </p>
                )}
              </div>
            )}

            {/* Group Name */}
            <div className="space-y-2 relative z-0">
              <label className={baseLabelClasses}>Group Name</label>
              <input
                type="text"
                value={formData.groupName}
                onChange={(e) => handleInputChange("groupName", e.target.value)}
                placeholder="Enter the Group Name"
                className={baseInputClasses}
              />
            </div>

            {/* Send Email Notification */}
            <div className="space-y-2 relative z-0">
              <label className={baseLabelClasses}>
                Send Email Notification <span className="text-red-500">*</span>
              </label>
              <div className={toggleWrapperClasses}>
                <button
                  type="button"
                  onClick={() => handleInputChange("sendEmail", true)}
                  className={`${toggleButtonBase} ${
                    formData.sendEmail
                      ? activeToggleClasses
                      : inactiveToggleClasses
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("sendEmail", false)}
                  className={`${toggleButtonBase} ${
                    !formData.sendEmail
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
              className={`space-y-2 relative lg:col-span-2 ${
                activeField === "exam" ? "z-50" : "z-auto"
              }`}
              onMouseEnter={() => setActiveField("exam")}
              onMouseLeave={() => setActiveField(null)}
            >
              <label className={baseLabelClasses}>
                Schedule Exam <span className="text-red-500">*</span>
              </label>
              <CustomDatePicker
                value={
                  formData.examStart
                    ? {
                        start: formData.examStart,
                        end: formData.examEnd || "",
                      }
                    : undefined
                }
                onChange={(start, end) => {
                  handleInputChange("examStart", start);
                  handleInputChange("examEnd", end);
                }}
              />
              {formErrors.examStart && (
                <p className="text-xs text-red-500 ml-1 mt-1">
                  {formErrors.examStart}
                </p>
              )}
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
          {isLoading ? "Processing..." : "Register"}
        </button>
      </div>
    </div>
  );
};

export default AddRegistrationForm;
