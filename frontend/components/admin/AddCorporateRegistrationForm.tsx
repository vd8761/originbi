"use client";

import React, { useState, useEffect, useRef } from "react";
import MobileInput from "@/components/ui/MobileInput";
import {
  ArrowRightWithoutLineIcon,
  EyeVisibleIcon,
  EyeOffIcon,
} from "@/components/icons";
import { corporateRegistrationService } from "@/lib/services";
import type { CreateCorporateRegistrationDto } from "@/lib/types";
import { SECTOR_OPTIONS, SectorCode } from "@/lib/sectors";

interface AddCorporateRegistrationFormProps {
  onCancel: () => void;
  onRegister: () => void;
}

const AddCorporateRegistrationForm: React.FC<
  AddCorporateRegistrationFormProps
> = ({ onCancel, onRegister }) => {
  // Note: extend DTO with optional avatar so we can store it locally if needed
  const [formData, setFormData] = useState<
    CreateCorporateRegistrationDto & { avatar?: string }
  >({
    name: "",
    gender: "Female",
    avatar: "",
    email: "",
    countryCode: "+91",
    mobile: "",
    companyName: "",
    jobTitle: "",
    employeeCode: "",
    linkedinUrl: "",
    sector: "IT_SOFTWARE",
    password: "",
    credits: undefined,
    status: true,
    notes: "",
    sendEmail: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // New states
  const [showPassword, setShowPassword] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [sectorSearch, setSectorSearch] = useState("");

  // Ref for click-outside on sector dropdown
  const sectorDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close sector dropdown on outside click
  useEffect(() => {
    if (!isSectorOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        sectorDropdownRef.current &&
        !sectorDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSectorOpen]);

  const handleInputChange = <K extends keyof CreateCorporateRegistrationDto>(
    field: K,
    value: CreateCorporateRegistrationDto[K]
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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Required";
    if (!formData.email.trim()) errors.email = "Required";
    if (!formData.mobile.trim()) errors.mobile = "Required";
    if (!formData.companyName.trim()) errors.companyName = "Required";
    if (!formData.password.trim()) errors.password = "Required";
    if (!formData.sector) errors.sector = "Required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      // strip avatar when sending, backend usually doesn’t need it
      const { avatar, ...payload } = formData;
      await corporateRegistrationService.createRegistration(
        payload as CreateCorporateRegistrationDto
      );
      onRegister();
    } catch (err: any) {
      setError(err.message || "Failed to create corporate registration");
    } finally {
      setIsLoading(false);
    }
  };

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

  const baseInputClasses =
    "w-full h-[50px] bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-black dark:text-white placeholder-black/40 dark:placeholder-white/60 focus:border-brand-green focus:outline-none transition-all";

  const baseTextAreaClasses =
    "w-full h-[120px] bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder-black/40 dark:placeholder-white/60 focus:border-brand-green focus:outline-none transition-all resize-none";

  const baseLabelClasses =
    "text-xs text-black/70 dark:text-white font-semibold ml-1";

  const toggleWrapperClasses =
    "flex w-full h-[50px] bg-gray-100 dark:bg-white/10 rounded-full p-1 border border-transparent dark:border-transparent";

  const toggleButtonBase =
    "flex-1 text-sm rounded-full transition-all duration-300 cursor-pointer";

  const activeToggleClasses =
    "bg-brand-green text-white shadow-lg shadow-green-900/20";
  const inactiveToggleClasses =
    "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white";

  const filteredSectors = SECTOR_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(sectorSearch.toLowerCase())
  );

  const getSectorLabel = (value: SectorCode) => {
    const item = SECTOR_OPTIONS.find((s) => s.value === value);
    return item?.label ?? value;
  };

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
            Corporate Access
          </button>
          <span className="mx-2 text-gray-400 dark:text-gray-600">
            <ArrowRightWithoutLineIcon className="w-3 h-3 dark:text-white text-black" />
          </span>
          <span className="text-brand-green font-semibold">
            Add Corporate Registration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white tracking-tight">
          Add Corporate Registration
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-[#24272B] rounded-3xl p-5 sm:p-8 shadow-sm dark:shadow-xl transition-colors duration-300">
        {error && (
          <div className="mb-6 text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}

        {/* Row 1 – Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Contact Person Name"
              className={`${baseInputClasses} ${
                formErrors.name ? "border-red-500/50" : ""
              }`}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>Gender</label>
            <div className={toggleWrapperClasses}>
              {["Male", "Female", "Other"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    handleInputChange(
                      "gender",
                      g as "Male" | "Female" | "Other"
                    )
                  }
                  className={`${toggleButtonBase} ${
                    formData.gender === g
                      ? activeToggleClasses
                      : inactiveToggleClasses
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="contact@company.com"
              className={`${baseInputClasses} ${
                formErrors.email ? "border-red-500/50" : ""
              }`}
            />
          </div>

          {/* Mobile */}
          <MobileInput
            countryCode={formData.countryCode}
            phoneNumber={formData.mobile}
            onCountryChange={(code) => handleInputChange("countryCode", code)}
            onPhoneChange={(num) => handleInputChange("mobile", num)}
            label="Mobile Number"
            required
          />
        </div>

        {/* Row 2 – Company + Sector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {/* Company Name */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              placeholder="Company / Organization"
              className={`${baseInputClasses} ${
                formErrors.companyName ? "border-red-500/50" : ""
              }`}
            />
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>Job Title / Role</label>
            <input
              type="text"
              value={formData.jobTitle || ""}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              placeholder="HR Manager, L&D Head..."
              className={baseInputClasses}
            />
          </div>

          {/* Employee Code */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>Employee Code / Ref ID</label>
            <input
              type="text"
              value={formData.employeeCode || ""}
              onChange={(e) =>
                handleInputChange("employeeCode", e.target.value)
              }
              placeholder="Optional internal reference"
              className={baseInputClasses}
            />
          </div>

          {/* Sector – Searchable dropdown */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>
              Sector <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={sectorDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSectorOpen((prev) => !prev)}
                className={`${baseInputClasses} flex items-center justify-between !h-[50px] ${
                  formErrors.sector ? "border-red-500/50" : ""
                }`}
              >
                <span className="truncate text-left">
                  {getSectorLabel(formData.sector as SectorCode)}
                </span>
                <span className="ml-2 text-xs text-gray-500">▼</span>
              </button>

              {isSectorOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg p-2">
                  <input
                    type="text"
                    value={sectorSearch}
                    onChange={(e) => setSectorSearch(e.target.value)}
                    placeholder="Search sector..."
                    className="w-full mb-2 px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-white/10 text-black dark:text-white outline-none"
                  />
                  <div className="max-h-52 overflow-y-auto custom-scroll">
                    {filteredSectors.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          handleInputChange("sector", opt.value as SectorCode);
                          setIsSectorOpen(false);
                          setSectorSearch("");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-white/10 ${
                          formData.sector === opt.value
                            ? "bg-gray-100 dark:bg-white/10 font-semibold"
                            : ""
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {filteredSectors.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        No sectors found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3 – LinkedIn + Password + Credits + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {/* LinkedIn URL */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>LinkedIn URL (Optional)</label>
            <input
              type="url"
              value={formData.linkedinUrl || ""}
              onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
              placeholder="https://www.linkedin.com/in/username"
              className={baseInputClasses}
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
                onChange={(e) => handleInputChange("password", e.target.value)}
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
                  <EyeOffIcon className="w-4 h-4 text-brand-green" />
                ) : (
                  <EyeVisibleIcon className="w-4 h-4 text-brand-green" />
                )}
              </button>
            </div>
          </div>

          {/* Credits */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>Credits (Optional)</label>
            <input
              type="number"
              min={0}
              value={formData.credits ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "credits",
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              placeholder="0"
              className={baseInputClasses}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className={baseLabelClasses}>Status</label>
            <div className={toggleWrapperClasses}>
              <button
                type="button"
                onClick={() => handleInputChange("status", true)}
                className={`${toggleButtonBase} ${
                  formData.status ? activeToggleClasses : inactiveToggleClasses
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => handleInputChange("status", false)}
                className={`${toggleButtonBase} ${
                  !formData.status ? activeToggleClasses : inactiveToggleClasses
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Row 4 – Business Locations */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="space-y-2 md:col-span-4">
            <label className={baseLabelClasses}>Business Locations <span className="text-red-500">*</span></label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="List key cities / countries where the business operates..."
              className={baseTextAreaClasses}
              required
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto px-10 py-3.5 rounded-full border border-gray-300 dark:border_WHITE/10 text-brand-text-light-primary dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full sm:w-auto px-12 py-3.5 rounded-full bg-brand-green text-white font-bold hover:bg-brand-green/90 shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 text-sm flex justify-center items-center"
        >
          {isLoading ? "Saving..." : "Save Registration"}
        </button>
      </div>
    </div>
  );
};

export default AddCorporateRegistrationForm;
