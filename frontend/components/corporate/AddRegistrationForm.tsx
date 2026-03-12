"use client";

import React, { useState, useEffect } from "react";
import { BulkUploadIcon, ArrowRightWithoutLineIcon, EyeIcon, EyeOffIcon } from '../icons';
import { toast } from 'react-hot-toast';
import MobileInput from '../ui/MobileInput';
import CustomSelect from '../ui/CustomSelect';
import CustomDatePicker from '../ui/CustomDatePicker';
import { corporateRegistrationService } from '../../lib/services/corporateRegistration.service';
import { registrationService, CreateRegistrationDto } from '../../lib/services/registration.service';
import { BulkUploadModal } from '../ui/BulkUploadModal';
import { Program, Department } from '../../lib/types';

interface AddRegistrationFormProps {
  onCancel: () => void;
  onRegister: () => void;
  corporateUserId: string;
}

// Hardcoded programs for Corporate - initially used before dynamic fetch
// const CORPORATE_PROGRAMS = [
//   { label: "Employee", value: "Employee" },
//   { label: "CXO General", value: "CXO General" },
// ];

const AddRegistrationForm: React.FC<AddRegistrationFormProps> = ({
  onCancel,
  onRegister,
  corporateUserId,
}) => {
  // --- State ---
  const [formData, setFormData] = useState<CreateRegistrationDto>({
    full_name: "",
    gender: "MALE",
    email: "",
    country_code: "+91",
    mobile_number: "",
    program_id: "Employee", // Default
    group_name: "",
    send_email: true, // Default true
    // Unused but kept for type compatibility if needed, though DTO allows optionals
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [progRes, deptRes] = await Promise.all([
          registrationService.getPrograms(),
          registrationService.getDepartmentDegrees()
        ]);
        setPrograms(progRes);
        setDepartments(deptRes);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    fetchInitialData();
  }, []);

  // Filter programs for corporate
  const corporateProgramOptions = programs
    .filter(p => ["EMPLOYEE", "CXO_GENERAL", "COLLEGE_STUDENT"].includes(p.code))
    .map(p => ({ label: p.name, value: p.id }));

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const selectedProgram = programs.find((p) => p.id === formData.program_id);
  const isCollegeProgram = selectedProgram?.code === "COLLEGE_STUDENT";

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

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange("password", password);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.full_name.trim()) errors.full_name = "Required";
    if (!formData.email.trim()) errors.email = "Required";
    if (!formData.mobile_number.trim()) errors.mobile_number = "Required";
    if (!formData.program_id) errors.program_id = "Required";
    if (!formData.password?.trim()) errors.password = "Required";
    if (!formData.exam_start) errors.exam_start = "Required";

    if (isCollegeProgram) {
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
    setError(null);
    try {
      await corporateRegistrationService.registerCandidate(formData, corporateUserId);
      toast.success("Registration successful!");
      onRegister();
    } catch (err: any) {
      setError(err.message || "Failed to create registration.");
    } finally {
      setIsLoading(false);
    }
  };

  // === Styles ===
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
    <div className="w-full font-sans animate-fade-in pb-12 p-4 sm:p-6 lg:p-8">
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
              Add Employees
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white tracking-tight">
            Add Employees
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

        {/* Basic Information */}
        <div className="mb-8">
          <h2 className={baseSectionTitleClasses}>Candidate Information</h2>
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
                className={`${baseInputClasses} ${formErrors.full_name ? "border-red-500/50" : ""}`}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2 z-0">
              <label className={baseLabelClasses}>
                Gender <span className="text-red-500">*</span>
              </label>
              <div className={toggleWrapperClasses}>
                {["MALE", "FEMALE", "OTHER"].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleInputChange("gender", gender)}
                    className={`${toggleButtonBase} ${formData.gender === gender ? activeToggleClasses : inactiveToggleClasses}`}
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
                className={`${baseInputClasses} ${formErrors.email ? "border-red-500/50" : ""}`}
              />
            </div>

            {/* Mobile */}
            <div
              className={`space-y-2 relative ${activeField === "mobile" ? "z-50" : "z-0"}`}
              onMouseEnter={() => setActiveField("mobile")}
              onMouseLeave={() => setActiveField(null)}
            >
              <MobileInput
                countryCode={formData.country_code}
                phoneNumber={formData.mobile_number}
                onCountryChange={(code) => handleInputChange("country_code", code)}
                onPhoneChange={(num) => handleInputChange("mobile_number", num)}
                label="Mobile Number"
                required
                error={formErrors.mobile_number}
              />
            </div>

            {/* Password */}
            <div className="space-y-2 relative z-0">
              <div className="flex justify-between items-center">
                <label className={baseLabelClasses}>
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-xs text-brand-green hover:underline font-medium"
                >
                  Generate Password
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ""}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Set login password"
                  className={`${baseInputClasses} ${formErrors.password ? "border-red-500/50" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-red-500 ml-1 mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Enrollment Details */}
        <div className="mb-4">
          <h2 className={baseSectionTitleClasses}>Registration Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">

            {/* Program Type */}
            <div
              className={`relative ${activeField === "program" ? "z-50" : "z-auto"}`}
              onMouseEnter={() => setActiveField("program")}
              onMouseLeave={() => setActiveField(null)}
            >
              <CustomSelect
                label="Program Type"
                required
                options={corporateProgramOptions}
                value={formData.program_id}
                onChange={(val) => {
                  handleInputChange("program_id", val);
                  // Reset college fields if program changes
                  handleInputChange("department_degree_id", "");
                  handleInputChange("current_year", "");
                }}
                placeholder="Select Program"
              />
              {formErrors.program_id && (
                <p className="text-xs text-red-500 ml-1 mt-1">
                  {formErrors.program_id}
                </p>
              )}
            </div>

            {/* Department (College Students) */}
            {isCollegeProgram && (
              <div
                className={`relative animate-fade-in ${activeField === "dept" ? "z-50" : "z-auto"}`}
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
                  value={formData.current_year || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "current_year",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter Year (1–4)"
                  className={`${baseInputClasses} ${formErrors.current_year ? "border-red-500/50" : ""}`}
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
                onChange={(e) => handleInputChange("group_name", e.target.value)}
                placeholder="Batch-2024 (Optional)"
                className={baseInputClasses}
              />
            </div>

            {/* Send Email Toggle */}
            <div className="space-y-2 relative z-0">
              <label className={baseLabelClasses}>
                Send Email Notification <span className="text-red-500">*</span>
              </label>
              <div className={toggleWrapperClasses}>
                <button
                  type="button"
                  onClick={() => handleInputChange("send_email", true)}
                  className={`${toggleButtonBase} ${formData.send_email ? activeToggleClasses : inactiveToggleClasses}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("send_email", false)}
                  className={`${toggleButtonBase} ${!formData.send_email ? activeToggleClasses : inactiveToggleClasses}`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Schedule Exam */}
            <div
              className={`space-y-2 relative lg:col-span-2 ${activeField === "exam" ? "z-50" : "z-auto"}`}
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
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Processing...
            </>
          ) : "Register"}
        </button>
      </div>
    </div>
  );
};

export default AddRegistrationForm;
