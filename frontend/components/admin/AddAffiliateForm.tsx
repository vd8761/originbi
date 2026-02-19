"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    ArrowRightWithoutLineIcon,
    EyeVisibleIcon,
    EyeOffIcon,
    XIcon,
    WarningIcon,
} from '../icons';
import MobileInput from '../ui/MobileInput';

interface AddAffiliateFormProps {
    onCancel: () => void;
    onSubmit: () => void;
    initialData?: any;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES_PER_TYPE = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

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

    // Multi-file states: arrays of File objects
    const [aadharFiles, setAadharFiles] = useState<File[]>([]);
    const [panFiles, setPanFiles] = useState<File[]>([]);

    // Existing uploaded documents (from edit mode)
    const [existingAadharDocs, setExistingAadharDocs] = useState<Array<{ key: string; url: string; fileName: string }>>(
        initialData?.aadhar_documents || []
    );
    const [existingPanDocs, setExistingPanDocs] = useState<Array<{ key: string; url: string; fileName: string }>>(
        initialData?.pan_documents || []
    );

    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [createdReferralCode, setCreatedReferralCode] = useState<string | null>(null);

    // Delete confirmation modal state
    const [confirmDelete, setConfirmDelete] = useState<{
        show: boolean;
        type: "aadhar" | "pan" | null;
        index: number | null;
    }>({ show: false, type: null, index: null });

    const aadharInputRef = useRef<HTMLInputElement>(null);
    const panInputRef = useRef<HTMLInputElement>(null);

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

    // ----- Multi-file handling -----
    const handleMultiFileChange = (
        type: "aadhar" | "pan",
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFiles = Array.from(e.target.files || []);
        addFiles(type, selectedFiles);
        // Reset input so same file can be re-selected
        e.target.value = "";
    };

    const addFiles = (type: "aadhar" | "pan", newFiles: File[]) => {
        const currentFiles = type === "aadhar" ? aadharFiles : panFiles;
        const existingCount = type === "aadhar" ? existingAadharDocs.length : existingPanDocs.length;
        const availableSlots = MAX_FILES_PER_TYPE - currentFiles.length - existingCount;

        if (availableSlots <= 0) {
            setFormErrors((prev) => ({
                ...prev,
                [type]: `Maximum ${MAX_FILES_PER_TYPE} files allowed`,
            }));
            return;
        }

        const filesToAdd = newFiles.slice(0, availableSlots);
        const errors: string[] = [];

        const validFiles = filesToAdd.filter((file) => {
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`"${file.name}" exceeds 5MB limit`);
                return false;
            }
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`"${file.name}" has an unsupported format`);
                return false;
            }
            return true;
        });

        if (errors.length > 0) {
            setFormErrors((prev) => ({
                ...prev,
                [type]: errors.join("; "),
            }));
        } else {
            setFormErrors((prev) => {
                const copy = { ...prev };
                delete copy[type];
                return copy;
            });
        }

        if (validFiles.length > 0) {
            if (type === "aadhar") {
                setAadharFiles((prev) => [...prev, ...validFiles]);
            } else {
                setPanFiles((prev) => [...prev, ...validFiles]);
            }
        }
    };

    const removeFile = (type: "aadhar" | "pan", index: number) => {
        if (type === "aadhar") {
            setAadharFiles((prev) => prev.filter((_, i) => i !== index));
        } else {
            setPanFiles((prev) => prev.filter((_, i) => i !== index));
        }
        setFormErrors((prev) => {
            const copy = { ...prev };
            delete copy[type];
            return copy;
        });
    };

    const removeExistingDoc = (type: "aadhar" | "pan", index: number) => {
        setConfirmDelete({ show: true, type, index });
    };

    const handleConfirmDelete = () => {
        const { type, index } = confirmDelete;
        if (type && index !== null) {
            if (type === "aadhar") {
                setExistingAadharDocs((prev) => prev.filter((_, i) => i !== index));
            } else {
                setExistingPanDocs((prev) => prev.filter((_, i) => i !== index));
            }
        }
        setConfirmDelete({ show: false, type: null, index: null });
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (type: "aadhar" | "pan", e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(type, droppedFiles);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (file: File) => {
        if (file.type === 'application/pdf') {
            return (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
        );
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

        if (!formData.upiNumber.trim()) errors.upiNumber = "Required";
        if (!formData.bankingName.trim()) errors.bankingName = "Required";
        if (!formData.accountNumber.trim()) errors.accountNumber = "Required";
        if (!formData.ifscCode.trim()) errors.ifscCode = "Required";
        if (!formData.branchName.trim()) errors.branchName = "Required";

        // KYC Documents validation
        if (aadharFiles.length + existingAadharDocs.length === 0) {
            errors.aadhar = "Required";
        }
        if (panFiles.length + existingPanDocs.length === 0) {
            errors.pan = "Required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsLoading(true);
        setError(null);
        setUploadProgress(null);

        try {
            // Step 1: Create/Update affiliate
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
                ...(isEditMode ? {
                    aadharDocuments: existingAadharDocs,
                    panDocuments: existingPanDocs,
                } : {}),
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
            const affiliateId = isEditMode ? initialData.id : data.id;

            if (!isEditMode) setCreatedReferralCode(data.referralCode || null);

            // Step 2: Upload documents if any
            const hasNewFiles = aadharFiles.length > 0 || panFiles.length > 0;
            if (hasNewFiles && affiliateId) {
                setUploadProgress("Uploading documents to cloud...");

                const formDataUpload = new FormData();
                aadharFiles.forEach((file) => formDataUpload.append("aadhar", file));
                panFiles.forEach((file) => formDataUpload.append("pan", file));

                const uploadRes = await fetch(
                    `${API_BASE}/admin/affiliates/${affiliateId}/documents`,
                    {
                        method: "POST",
                        body: formDataUpload,
                    }
                );

                if (!uploadRes.ok) {
                    const uploadErr = await uploadRes.json().catch(() => ({}));
                    throw new Error(uploadErr.message || `Document upload failed (${uploadRes.status})`);
                }

                setUploadProgress("Documents uploaded successfully!");
            }

            onSubmit();
        } catch (err: any) {
            setError(err.message || `Failed to ${isEditMode ? "update" : "create"} affiliate`);
        } finally {
            setIsLoading(false);
            setUploadProgress(null);
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

    // ----- File upload UI component -----
    const renderFileUploadSection = (
        type: "aadhar" | "pan",
        label: string,
        files: File[],
        existingDocs: Array<{ key: string; url: string; fileName: string }>,
        inputRef: any,
    ) => {
        const totalCount = files.length + existingDocs.length;
        const canAddMore = totalCount < MAX_FILES_PER_TYPE;

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className={baseLabelClasses}>
                        {label} <span className="text-red-500">*</span>{" "}
                        <span className="text-xs font-normal text-gray-400">
                            (Max {MAX_FILES_PER_TYPE} files, 5MB each)
                        </span>
                    </label>
                    <span className="text-xs text-gray-400 mr-1">
                        {totalCount}/{MAX_FILES_PER_TYPE}
                    </span>
                </div>

                {/* Hidden file input */}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={(e) => handleMultiFileChange(type, e)}
                    className="hidden"
                />

                {/* Drag & Drop zone */}
                {canAddMore && (
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(type, e)}
                        className={`w-full min-h-[100px] bg-gray-50 dark:bg-white/5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-brand-green/50 hover:bg-gray-100 dark:hover:bg-white/10 ${formErrors[type]
                            ? "border-red-500/50"
                            : "border-gray-200 dark:border-white/10"
                            } py-4`}
                    >
                        <svg
                            className="w-7 h-7 text-gray-400 dark:text-gray-500 mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Click or drag & drop files here
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            JPEG, PNG, WebP, GIF, PDF
                        </p>
                    </div>
                )}

                {/* Existing uploaded documents */}
                {existingDocs.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider ml-1">
                            Previously Uploaded
                        </p>
                        {existingDocs.map((doc, idx) => (
                            <div
                                key={`existing-${type}-${idx}`}
                                className="flex items-center gap-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg px-3 py-2.5"
                            >
                                <svg className="w-5 h-5 text-brand-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-black dark:text-white truncate">
                                        {doc.fileName}
                                    </p>
                                    <p className="text-[10px] text-gray-400">Uploaded</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeExistingDoc(type, idx)}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                                    title="Remove"
                                >
                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Newly selected files */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        {existingDocs.length > 0 && (
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider ml-1">
                                New Files
                            </p>
                        )}
                        {files.map((file, idx) => (
                            <div
                                key={`new-${type}-${idx}`}
                                className="flex items-center gap-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg px-3 py-2.5"
                            >
                                {getFileIcon(file)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-black dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(type, idx)}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                                    title="Remove"
                                >
                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {formErrors[type] && (
                    <p className="text-xs text-red-500 ml-1">{formErrors[type]}</p>
                )}
            </div>
        );
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

                {uploadProgress && (
                    <div className="mb-6 text-blue-600 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border border-blue-100 dark:border-blue-500/20 flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>
                        {uploadProgress}
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

                {/* Section 2 – Payment & Banking Details */}
                <div className="mb-8 pt-6 border-t border-gray-100 dark:border-white/5">
                    <h3 className={sectionHeadingClasses}>Payment & Banking Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* UPI ID */}
                        <div className="space-y-2">
                            <label className={baseLabelClasses}>UPI ID</label>
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

                {/* Section 3 – KYC Document Uploads */}
                <div className="mb-8 pt-6 border-t border-gray-100 dark:border-white/5">
                    <h3 className={sectionHeadingClasses}>KYC Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderFileUploadSection(
                            "aadhar",
                            "Aadhar Document",
                            aadharFiles,
                            existingAadharDocs,
                            aadharInputRef,
                        )}
                        {renderFileUploadSection(
                            "pan",
                            "PAN Document",
                            panFiles,
                            existingPanDocs,
                            panInputRef,
                        )}
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
                            {uploadProgress ? "Uploading..." : "Processing..."}
                        </>
                    ) : isEditMode ? (
                        "Update Affiliate"
                    ) : (
                        "Create Affiliate"
                    )}
                </button>
            </div>

            {/* Document Delete Confirmation Modal - Rendered via Portal */}
            {confirmDelete.show && (typeof document !== 'undefined') && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setConfirmDelete({ show: false, type: null, index: null })}
                    />
                    <div className="relative w-full max-w-[320px] bg-white dark:bg-[#1A1F23] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden transform scale-100 opacity-100 translate-y-0">
                        {/* Header/Icon */}
                        <div className="pt-8 pb-4 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                <WarningIcon className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Remove Document?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-6 leading-relaxed">
                                Are you sure you want to delete this file?
                            </p>
                        </div>

                        {/* Footer Actions */}
                        <div className="grid grid-cols-2 border-t border-gray-100 dark:border-white/5 mt-4">
                            <button
                                onClick={() => setConfirmDelete({ show: false, type: null, index: null })}
                                className="px-4 py-3.5 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 border-r border-gray-100 dark:border-white/5 transition-all outline-none focus:bg-gray-50 dark:focus:bg-white/5 uppercase tracking-wide"
                            >
                                No, Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-3.5 text-xs font-bold text-red-500 hover:bg-red-500/5 transition-all outline-none focus:bg-red-50 dark:focus:bg-red-900/10 uppercase tracking-wide"
                            >
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AddAffiliateForm;
