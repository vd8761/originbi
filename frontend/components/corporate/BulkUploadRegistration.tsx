import React, { useState, useEffect } from 'react';
import { corporateRegistrationService } from "@/lib/services/corporateRegistration.service";
import { BulkUploadDropzone } from "./bulk/BulkUploadDropzone";
import { BulkReviewTable } from "./bulk/BulkReviewTable";
import { BulkSuccessSummary } from "./bulk/BulkSuccessSummary";

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

    const handleReviewClick = () => {
        setView('review');
    };

    const handleConfirm = async (overrides: any[]) => {
        if (!importId) return;
        try {
            await corporateRegistrationService.bulkExecute(importId, overrides);
            setView('processing');
        } catch (err: any) {
            setError(err.message);
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
        <div className="p-6 bg-[#0B0D0F] min-h-screen">
            <div className="mb-8">
                <nav className="text-sm text-gray-500 mb-2">
                    Dashboard &gt; <button onClick={onCancel} className="hover:text-white transition-colors">My Employees</button> &gt; <span className="text-[#1ED36A]">Bulk Upload</span>
                    {view === 'review' && " > Review Bulk Upload"}
                </nav>
                <h1 className="text-3xl font-bold text-white mb-2">Bulk Upload Registration {view === 'review' ? '– Review & Confirm' : ''}</h1>
            </div>

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
                <BulkReviewTable
                    validRows={validRows}
                    invalidRows={invalidRows}
                    onConfirm={handleConfirm}
                    onCancel={handleReset}
                    groups={groups}
                />
            )}

            {view === 'processing' && (
                <div className="flex flex-col items-center justify-center p-12 h-[400px]">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1ED36A] mb-4"></div>
                    <h3 className="text-xl font-medium text-white">Processing Registrations...</h3>
                    <p className="text-gray-400 mt-2">This may take a few moments.</p>
                </div>
            )}

            {view === 'success' && (
                <BulkSuccessSummary
                    total={summary.total}
                    success={summary.success}
                    skipped={summary.skipped}
                    onUploadAgain={handleReset}
                    onViewAll={onCancel} // Redirect back to list
                />
            )}
        </div>
    );
};

export default BulkUploadRegistration;
