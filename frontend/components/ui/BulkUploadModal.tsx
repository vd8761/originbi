
import React, { useState, useRef } from 'react';
import { BulkUploadIcon, ExcelIcon } from '@/components/icons';
import { registrationService } from '@/lib/services';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        setIsUploading(true);
        try {
            await registrationService.bulkUpload(file);
            setFile(null);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to upload file.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-[#1A1D21] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BulkUploadIcon className="w-5 h-5 text-brand-green" />
                        Bulk Registration
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-4">
                        Upload an Excel or CSV file containing user details. Please ensure your file follows the standard template format.
                    </p>
                    <a href="#" className="inline-flex items-center gap-2 text-brand-green text-sm font-medium hover:underline mb-6">
                        <ExcelIcon className="w-4 h-4" /> Download Template
                    </a>

                    <div
                        className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-brand-green/50 hover:bg-white/5 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <div className="text-center">
                                <ExcelIcon className="w-10 h-10 mx-auto mb-2 text-brand-green" />
                                <p className="text-white font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <BulkUploadIcon className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                                <p className="text-gray-300 font-medium">Click to upload or drag & drop</p>
                                <p className="text-xs text-gray-500 mt-1">XLSX, CSV up to 10MB</p>
                            </div>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-white/10 text-white text-sm hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !file}
                        className="px-5 py-2.5 rounded-lg bg-brand-green text-white text-sm font-bold hover:bg-brand-green/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isUploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Upload Users
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadIcon; // Re-exporting icon just in case of dependency mix-up, but mainly export modal
export { BulkUploadModal };
