"use client";

import React, { useState, useRef } from "react";
import {
    ArrowRightWithoutLineIcon,
    EyeVisibleIcon,
    EyeOffIcon,
} from '../icons';
import MobileInput from '../ui/MobileInput';

interface AddAffiliateFormProps {
    onCancel: () => void;
    onSubmit: () => void;
    initialData?: any;
}



const AddAffiliateForm: React.FC<AddAffiliateFormProps> = ({
    onCancel,
    onSubmit,
    initialData,
}) => {
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        email: initialData?.email || "",
        password: initialData?.password || "",
        countryCode: initialData?.country_code || "+91",
        mobileNumber: initialData?.mobile_number || "",
        address: initialData?.address || "",
        upiId: initialData?.upi_id || "",
        upiNumber: initialData?.upi_number || "",
        bankingName: initialData?.banking_name || "",
        accountNumber: initialData?.account_number || "",
        ifscCode: initialData?.ifsc_code || "",
        branchName: initialData?.branch_name || "",
        commissionPercentage: initialData?.commission_percentage || "",
    });

    const [showPassword, setShowPassword] = useState(false);

    const [aadharFile, setAadharFile] = useState<File | null>(null);
    const [panFile, setPanFile] = useState<File | null>(null);
    const [aadharPreview, setAadharPreview] = useState<string | null>(initialData?.aadhar_url || null);
    const [panPreview, setPanPreview] = useState<string | null>(initialData?.pan_url || null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [createdReferralCode, setCreatedReferralCode] = useState<string | null>(null);

    const aadharInputRef = useRef<HTMLInputElement>(null);
    const panInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE = 500 * 1024; // 500 KB

    const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "";

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => {
                const copy = { ...prev };
                delete copy[field];
                return copy;
            });
        }
        setError(null);
    };

    const handleCommissionChange = (value: string) => {
        const numVal = parseFloat(value);
        if (value === "" || value === ".") {
            handleInputChange("commissionPercentage", value);
            return;
        }
        if (isNaN(numVal)) return;
        if (numVal > 100) {
            handleInputChange("commissionPercentage", "100");
            return;
        }
        if (numVal < 0) {
            handleInputChange("commissionPercentage", "0");
            return;
        }
        handleInputChange("commissionPercentage", value);
    };

    const handleFileChange = (
        type: "aadhar" | "pan",
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setFormErrors((prev) => ({
                ...prev,
                [type]: `File size exceeds 500 KB limit (${(file.size / 1024).toFixed(0)} KB)`,
            }));
            return;
        }

        setFormErrors((prev) => {
            const copy = { ...prev };
            delete copy[type];
            return copy;
        });

        if (type === "aadhar") {
            setAadharFile(file);
            setAadharPreview(URL.createObjectURL(file));
        } else {
            setPanFile(file);
            setPanPreview(URL.createObjectURL(file));
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Required";
        if (!formData.email.trim()) errors.email = "Required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email";
        if (!isEditMode) {
            if (!formData.password.trim()) errors.password = "Required";
            else if (formData.password.length < 8) errors.password = "Min 8 characters";
        }
        if (!formData.mobileNumber.trim()) errors.mobileNumber = "Required";
        if (!formData.commissionPercentage) errors.commissionPercentage = "Required";

        const commNum = parseFloat(formData.commissionPercentage);
        if (formData.commissionPercentage && (commNum < 0 || commNum > 100)) {
            errors.commissionPercentage = "Must be between 0 and 100";
        }
        if (!formData.address.trim()) errors.address = "Required";
        if (!formData.upiId.trim()) errors.upiId = "Required";
        if (!formData.upiNumber.trim()) errors.upiNumber = "Required";
        if (!formData.bankingName.trim()) errors.bankingName = "Required";
        if (!formData.accountNumber.trim()) errors.accountNumber = "Required";
        if (!formData.ifscCode.trim()) errors.ifscCode = "Required";
        if (!formData.branchName.trim()) errors.branchName = "Required";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsLoading(true);
        setError(null);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                ...(isEditMode ? {} : { password: formData.password }),
                countryCode: formData.countryCode,
                mobileNumber: formData.mobileNumber,
                address: formData.address || undefined,
                commissionPercentage: parseFloat(formData.commissionPercentage) || 0,
                upiId: formData.upiId || undefined,
                upiNumber: formData.upiNumber || undefined,
                bankingName: formData.bankingName || undefined,
                accountNumber: formData.accountNumber || undefined,
                ifscCode: formData.ifscCode || undefined,
                branchName: formData.branchName || undefined,
            };

            const url = isEditMode
                ? `${API_BASE}/admin/affiliates/${initialData.id}`
                : `${API_BASE}/admin/affiliates`;

            const res = await fetch(url, {
                method: isEditMode ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to ${isEditMode ? "update" : "create"} affiliate (${res.status})`);
            }

            const data = await res.json();
            if (!isEditMode) setCreatedReferralCode(data.referralCode || null);
            onSubmit();
        } catch (err: any) {
            setError(err.message || `Failed to ${isEditMode ? "update" : "create"} affiliate`);
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

    const sectionHeadingClasses =
        "text-sm font-bold text-black dark:text-white mb-4";

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
                        Affiliates
                    </button>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 dark:text-white text-black" />
                    </span>
                    <span className="text-brand-green font-semibold">
                        {isEditMode ? "Update Affiliate" : "Add Affiliate"}
                    </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-light-primary dark:text-white tracking-tight">
                    {isEditMode ? "Update Affiliate" : "Add New Affiliate"}
                </h1>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-[#24272B] rounded-3xl p-5 sm:p-8 shadow-sm dark:shadow-xl transition-colors duration-300">
                {error && (
                    <div className="mb-6 text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
                        {error}
                    </div>
                )}

                {/* Section 1 – Personal Details */}
                <div className="mb-8">
                    <h3 className={sectionHeadingClasses}>Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="Affiliate full name"
                                className={`${baseInputClasses} ${formErrors.name ? "border-red-500/50" : ""}`}
                            />
                            {formErrors.name && <p className="text-xs text-red-500 ml-1">{formErrors.name}</p>}
                        </div>

                        {/* Mobile */}
                        <MobileInput
                            countryCode={formData.countryCode}
                            phoneNumber={formData.mobileNumber}
                            onCountryChange={(code) => handleInputChange("countryCode", code)}
                            onPhoneChange={(num) => handleInputChange("mobileNumber", num)}
                            label="Mobile Number"
                            required
                            error={formErrors.mobileNumber}
                        />

                        {/* Email */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                Email ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                placeholder="affiliate@example.com"
                                disabled={isEditMode}
                                className={`${baseInputClasses} ${formErrors.email ? "border-red-500/50" : ""} ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                            {formErrors.email && <p className="text-xs text-red-500 ml-1">{formErrors.email}</p>}
                        </div>

                        {!isEditMode && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className={baseLabelClasses}>
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="text-[11px] font-bold text-brand-green hover:text-brand-green/80 cursor-pointer transition-colors"
                                    >
                                        Generate Password
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        placeholder="Min 8 characters"
                                        className={`${baseInputClasses} pr-10 ${formErrors.password ? "border-red-500/50" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon className="w-4 h-4 text-brand-green" />
                                        ) : (
                                            <EyeVisibleIcon className="w-4 h-4 text-brand-green" />
                                        )}
                                    </button>
                                </div>
                                {formErrors.password && <p className="text-xs text-red-500 ml-1">{formErrors.password}</p>}
                            </div>
                        )}

                        {/* Address */}
                        <div className="space-y-2 lg:col-span-3">
                            <label className={baseLabelClasses}>
                                Address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                                placeholder="Full address"
                                className={`${baseTextAreaClasses} ${formErrors.address ? "border-red-500/50" : ""}`}
                            />
                            {formErrors.address && <p className="text-xs text-red-500 ml-1">{formErrors.address}</p>}
                        </div>
                    </div>
                </div>

                {/* Section 2 – Payment & Banking Details (UPI + Account merged) */}
                <div className="mb-8 pt-6 border-t border-gray-100 dark:border-white/5">
                    <h3 className={sectionHeadingClasses}>Payment & Banking Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* UPI ID */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                UPI ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.upiId}
                                onChange={(e) => handleInputChange("upiId", e.target.value)}
                                placeholder="e.g. name@upi"
                                className={`${baseInputClasses} ${formErrors.upiId ? "border-red-500/50" : ""}`}
                            />
                            {formErrors.upiId && <p className="text-xs text-red-500 ml-1">{formErrors.upiId}</p>}
                        </div>

                        {/* UPI Number */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                UPI Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.upiNumber}
                                onChange={(e) => handleInputChange("upiNumber", e.target.value)}
                                placeholder="UPI linked mobile number"
                                maxLength={10}
                                className={`${baseInputClasses} ${formErrors.upiNumber ? "border-red-500/50" : ""}`}
                            />
                            {formErrors.upiNumber && <p className="text-xs text-red-500 ml-1">{formErrors.upiNumber}</p>}
                        </div>

                        {/* Banking Name */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                Banking Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.bankingName}
                                onChange={(e) => handleInputChange("bankingName", e.target.value)}
                                placeholder="Bank name"
                                className={`${baseInputClasses} ${formErrors.bankingName ? "border-red-500/50" : ""}`}
                            />
                            {formErrors.bankingName && <p className="text-xs text-red-500 ml-1">{formErrors.bankingName}</p>}
                        </div>

                        {/* Account Number */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                                placeholder="Account number"
                                className={`${baseInputClasses} ${formErrors.accountNumber ? "border-red-500/50" : ""}`}
                            />
                            {formErrors.accountNumber && <p className="text-xs text-red-500 ml-1">{formErrors.accountNumber}</p>}
                        </div>

                        {/* IFSC Code */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                IFSC Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.ifscCode}
                                onChange={(e) => handleInputChange("ifscCode", e.target.value.toUpperCase())}
                                placeholder="e.g. SBIN0001234"
                                maxLength={11}
                                className={`${baseInputClasses} ${formErrors.ifscCode ? "border-red-500/50" : ""}`}
                            />
                            {formErrors.ifscCode && <p className="text-xs text-red-500 ml-1">{formErrors.ifscCode}</p>}
                        </div>

                        {/* Branch Name */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                Branch Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.branchName}
                                onChange={(e) => handleInputChange("branchName", e.target.value)}
                                placeholder="Branch location"
                                className={`${baseInputClasses} ${formErrors.branchName ? "border-red-500/50" : ""}`}
                            />
                            {formErrors.branchName && <p className="text-xs text-red-500 ml-1">{formErrors.branchName}</p>}
                        </div>
                    </div>
                </div>

                {/* Section 3 – Document Uploads */}
                <div className="mb-8 pt-6 border-t border-gray-100 dark:border-white/5">
                    <h3 className={sectionHeadingClasses}>Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Aadhar Document */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                Aadhar Document <span className="text-xs font-normal text-gray-400">(Max 500 KB)</span>
                            </label>
                            <input
                                ref={aadharInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileChange("aadhar", e)}
                                className="hidden"
                            />
                            <div
                                onClick={() => aadharInputRef.current?.click()}
                                className={`w-full h-[120px] bg-gray-50 dark:bg-white/10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-brand-green/50 ${formErrors.aadhar
                                    ? "border-red-500/50"
                                    : aadharPreview
                                        ? "border-brand-green/30"
                                        : "border-gray-200 dark:border-white/10"
                                    }`}
                            >
                                {aadharPreview ? (
                                    <div className="flex items-center gap-3">
                                        <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-brand-green">
                                                {aadharFile?.name || "Uploaded"}
                                            </p>
                                            <p className="text-xs text-gray-400">Click to change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Click to upload Aadhar
                                        </p>
                                    </>
                                )}
                            </div>
                            {formErrors.aadhar && <p className="text-xs text-red-500 ml-1">{formErrors.aadhar}</p>}
                        </div>

                        {/* PAN Document */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                PAN Document <span className="text-xs font-normal text-gray-400">(Max 500 KB)</span>
                            </label>
                            <input
                                ref={panInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileChange("pan", e)}
                                className="hidden"
                            />
                            <div
                                onClick={() => panInputRef.current?.click()}
                                className={`w-full h-[120px] bg-gray-50 dark:bg-white/10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-brand-green/50 ${formErrors.pan
                                    ? "border-red-500/50"
                                    : panPreview
                                        ? "border-brand-green/30"
                                        : "border-gray-200 dark:border-white/10"
                                    }`}
                            >
                                {panPreview ? (
                                    <div className="flex items-center gap-3">
                                        <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-brand-green">
                                                {panFile?.name || "Uploaded"}
                                            </p>
                                            <p className="text-xs text-gray-400">Click to change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Click to upload PAN
                                        </p>
                                    </>
                                )}
                            </div>
                            {formErrors.pan && <p className="text-xs text-red-500 ml-1">{formErrors.pan}</p>}
                        </div>
                    </div>
                </div>

                {/* Section 4 – Commission */}
                <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                    <h3 className={sectionHeadingClasses}>Commission</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Commission Percentage */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>
                                Commission Percentage <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    value={formData.commissionPercentage}
                                    onChange={(e) => handleCommissionChange(e.target.value)}
                                    onBlur={() => {
                                        const val = parseFloat(formData.commissionPercentage);
                                        if (!isNaN(val) && val > 100) handleInputChange("commissionPercentage", "100");
                                    }}
                                    placeholder="e.g. 10"
                                    className={`${baseInputClasses} pr-10 ${formErrors.commissionPercentage ? "border-red-500/50" : ""}`}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">%</span>
                            </div>
                            {formErrors.commissionPercentage && <p className="text-xs text-red-500 ml-1">{formErrors.commissionPercentage}</p>}
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
                    ) : isEditMode ? (
                        "Update Affiliate"
                    ) : (
                        "Create Affiliate"
                    )}
                </button>
            </div>
        </div>
    );
};

export default AddAffiliateForm;
