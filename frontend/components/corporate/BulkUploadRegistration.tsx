import React, { useState, useEffect } from 'react';
import { corporateRegistrationService } from "@/lib/services/corporateRegistration.service";
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { CreateCorporateRegistrationDto } from "@/lib/types";
import { BulkUploadDropzone } from "./bulk/BulkUploadDropzone";
import { BulkReviewTable } from "./bulk/BulkReviewTable";
import { BulkSuccessSummary } from "./bulk/BulkSuccessSummary";
import { ArrowRightWithoutLineIcon } from "@/components/icons";

interface BulkUploadRegistrationProps {
    onCancel: () => void;
    corporateUserId: string; // Pass the corporate user ID for context if needed, though service likely handles it via token/API
}

const BulkUploadRegistration: React.FC<BulkUploadRegistrationProps> = ({ onCancel, corporateUserId }) => {
    const [view, setView] = useState<'upload' | 'review' | 'processing' | 'success'>('upload');
    const [importId, setImportId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [groups, setGroups] = useState<any[]>([]);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Review State
    const [validRows, setValidRows] = useState<any[]>([]);
    const [invalidRows, setInvalidRows] = useState<any[]>([]);

    // Success State
    const [summary, setSummary] = useState({ total: 0, success: 0, skipped: 0 });

    useEffect(() => {
        // Fetch groups on mount - needed for group matching override in UI
        // corporateRegistrationService.getGroups(corporateUserId).then(setGroups).catch(console.error);
        // Assuming we implement getGroups in corporateRegistrationService
    }, [corporateUserId]);

    // Polling Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (view === 'processing' && importId) {
            interval = setInterval(async () => {
                try {
                    const status = await corporateRegistrationService.getBulkJobStatus(importId);
                    if (status.status === 'COMPLETED') {
                        if (status.failed > 0) {
                            // Job finished with errors. Fetch updated rows to show them in Review table.
                            const rows = await corporateRegistrationService.getBulkJobRows(importId);
                            setValidRows(rows.filter((r: any) => r.status === 'SUCCESS' || r.status === 'READY'));
                            setInvalidRows(rows.filter((r: any) => r.status === 'FAILED' || r.status === 'INVALID'));

                            setView('review');
                        } else {
                            setSummary({
                                total: status.total,
                                success: status.success,
                                skipped: status.total - status.success
                            });
                            setView('success');
                        }
                    }
                } catch (e) {
                    console.error("Polling failed", e);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [view, importId]);

    const handleFileSelected = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);
        setFileName(file.name);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        try {
            // Using corporateRegistrationService instead of regular registrationService
            const data = await corporateRegistrationService.bulkPreview(file, corporateUserId);
            clearInterval(progressInterval);
            setUploadProgress(100);

            setImportId(data.importId);
            // Split rows based on status
            const rows = data.rows || [];
            setValidRows(rows.filter((r: any) => r.status === 'READY'));
            setInvalidRows(rows.filter((r: any) => r.status !== 'READY'));

            setUploadComplete(true);
        } catch (err: any) {
            clearInterval(progressInterval);
            setIsUploading(false);
            setError(err.message || 'Upload failed');
        }
    };

    // Confirm State
    const [isConfirming, setIsConfirming] = useState(false);

    // ... (keep polling effect)

    // ... (keep handleFileSelected)

    const handleReviewClick = () => {
        setView('review');
    };

    const handleConfirm = async (overrides: any[]) => {
        if (!importId) return;
        setIsConfirming(true);
        try {
            await corporateRegistrationService.bulkExecute(importId, overrides);
            setView('processing');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleReset = () => {
        setView('upload');
        setImportId(null);
        setFileName(null);
        setValidRows([]);
        setInvalidRows([]);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadComplete(false);
        setError(null);
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-[#FAFAFA] dark:bg-brand-dark-primary transition-colors duration-300">
            {/* GLOBAL BACKGROUND LAYERS (Full Screen) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('/Background_Light_Theme.svg')] bg-cover bg-center bg-no-repeat opacity-100 dark:hidden" />
                {/* Dark Theme SVG removed as per request to match Employee List style - relying on base color + gradients */}

                {/* Gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-green/5 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-normal" />
            </div>

            <div className="relative z-10 w-full p-6 pt-9 flex flex-col min-h-screen">
                <div className="flex-1">
                    <div className="mb-6">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-normal flex-wrap font-sans">
                            <span>Dashboard</span>
                            <span className="mx-2 text-gray-400 dark:text-gray-600">
                                <ArrowRightWithoutLineIcon className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                            </span>
                            <button
                                onClick={onCancel}
                                className="hover:text-gray-900 dark:hover:text-white hover:underline transition-colors"
                            >
                                My Employees
                            </button>
                            <span className="mx-2 text-gray-400 dark:text-gray-600">
                                <ArrowRightWithoutLineIcon className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                            </span>
                            <span className={`${view === 'upload' ? 'text-brand-green font-semibold' : 'hover:text-gray-900 dark:hover:text-white hover:underline cursor-pointer'} transition - colors`} onClick={() => { if (view !== 'upload') handleReset() }}>
                                Bulk Upload
                            </span>
                            {view === 'review' && (
                                <>
                                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                                    </span>
                                    <span className="text-brand-green font-semibold">Review Bulk Upload</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-sans tracking-tight">Bulk Upload Registration {view === 'review' ? '– Review & Confirm' : ''}</h1>
                    </div>

                    {/* Content Card Wrapper */}
                    <div className="bg-white dark:bg-white/[0.08] border border-gray-200 dark:border-white/10 rounded-3xl p-1.5 shadow-sm overflow-hidden">
                        {view === 'upload' && (
                            <BulkUploadDropzone
                                onFileSelected={handleFileSelected}
                                onReviewClick={handleReviewClick}
                                isUploading={isUploading}
                                uploadProgress={uploadProgress}
                                uploadComplete={uploadComplete}
                                fileName={fileName}
                                error={error}
                                onReset={handleReset}
                            />
                        )}

                        {view === 'review' && (
                            <div className="p-4 sm:p-6">
                                <BulkReviewTable
                                    validRows={validRows}
                                    invalidRows={invalidRows}
                                    onConfirm={handleConfirm}
                                    onCancel={handleReset}
                                    groups={groups}
                                    isSubmitting={isConfirming}
                                />
                            </div>
                        )}

                        {view === 'processing' && (
                            <div className="flex flex-col items-center justify-center p-12 h-[400px]">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1ED36A] mb-4"></div>
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Processing Registrations...</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">This may take a few moments.</p>
                            </div>
                        )}

                        {view === 'success' && (
                            <div className="p-4 sm:p-6">
                                <BulkSuccessSummary
                                    total={summary.total}
                                    success={summary.success}
                                    skipped={summary.skipped}
                                    onUploadAgain={handleReset}
                                    onViewAll={onCancel} // Redirect back to list
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="w-full flex flex-col-reverse sm:flex-row items-center justify-between text-[clamp(11px,0.8vw,14px)] font-medium leading-none tracking-[0px] text-brand-green gap-4 py-4 border-t border-gray-200 dark:border-white/10 mt-auto">
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-brand-green/80 transition-colors text-right underline decoration-solid decoration-0 underline-offset-2">Privacy Policy</a>
                        <span className="border-r border-gray-300 dark:border-white/20 h-3 hidden sm:block"></span>
                        <a href="#" className="hover:text-brand-green/80 transition-colors text-right underline decoration-solid decoration-0 underline-offset-2">Terms & Conditions</a>
                    </div>
                    <span className="opacity-100 text-gray-500 dark:text-gray-400">&copy; OriginBI {new Date().getFullYear()}</span>
                </footer>
            </div>
        </div>
    );
};

export default BulkUploadRegistration;
