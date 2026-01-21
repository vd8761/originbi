import React, { useCallback, useState } from 'react';

interface BulkUploadDropzoneProps {
    onFileSelected: (file: File) => void;
    onReviewClick: () => void;
    isUploading: boolean;
    uploadProgress: number; // 0-100
    uploadComplete: boolean;
    fileName: string | null;
    error: string | null;
    onReset: () => void;
}

export const BulkUploadDropzone: React.FC<BulkUploadDropzoneProps> = ({
    onFileSelected, onReviewClick, isUploading, uploadProgress, uploadComplete, fileName, error, onReset
}) => {
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        if (isUploading || uploadComplete) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.toLowerCase().endsWith('.csv')) {
                onFileSelected(file);
            } else {
                alert("Invalid file format. Only CSV files are allowed.");
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.name.toLowerCase().endsWith('.csv')) {
                onFileSelected(file);
            } else {
                alert("Invalid file format. Only CSV files are allowed.");
                // Clear input so user can try again
                e.target.value = '';
            }
        }
    };

    if (uploadComplete) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-gray-200 dark:border-[#FFFFFF1F] rounded-xl bg-white dark:bg-[#15171A] h-[400px]">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-[#1ED36A]/10 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#1ED36A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-[#1ED36A] text-lg font-medium mb-1">Upload complete</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Your file is ready for review</p>

                <div className="bg-gray-50 dark:bg-[#FFFFFF0A] border border-gray-200 dark:border-transparent rounded-lg p-3 w-2/3 max-w-md flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#1ED36A]/20 rounded flex items-center justify-center text-[#1ED36A] font-medium text-sm">CSV</div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm text-gray-900 dark:text-white truncate">{fileName}</div>
                        <div className="text-xs text-gray-500">100%</div>
                        <div className="h-1 bg-gray-200 dark:bg-[#FFFFFF1F] mt-1 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1ED36A] w-full"></div>
                        </div>
                    </div>
                    <button onClick={onReset} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex gap-4">
                    <button onClick={onReset} className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">Back</button>
                    <button onClick={onReviewClick} className="px-6 py-2 rounded-lg bg-[#1ED36A] text-white hover:bg-[#1ED36A]/90 font-medium flex items-center gap-2">
                        Review Upload
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    if (isUploading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-gray-200 dark:border-[#FFFFFF1F] rounded-xl bg-white dark:bg-[#15171A] h-[400px]">
                <div className="mb-6 flex justify-center animate-bounce">
                    <svg className="w-16 h-16 text-[#1ED36A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-[#1ED36A] text-lg font-medium mb-1">Uploading your file...</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Please wait while the file is being processed</p>

                <div className="bg-gray-50 dark:bg-[#FFFFFF0A] border border-gray-200 dark:border-transparent rounded-lg p-3 w-2/3 max-w-md flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#1ED36A]/20 rounded flex items-center justify-center text-[#1ED36A] font-medium text-sm">CSV</div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm text-gray-900 dark:text-white truncate">{fileName}</div>
                        <div className="text-xs text-gray-500">{uploadProgress}% - {Math.max(0, 3 - Math.floor(uploadProgress / 30))} Seconds Remaining</div>
                        <div className="h-1 bg-gray-200 dark:bg-[#FFFFFF1F] mt-1 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1ED36A] transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                    <button onClick={onReset} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    const BulkUploadIcon = () => (
        <svg viewBox="0 0 73 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[clamp(48px,5vw,73px)] h-auto mb-6">
            <path d="M41.6309 16.4041H50.462L36.9453 2.18457V11.7001C36.9453 14.2776 39.0357 16.4041 41.6309 16.4041Z" fill="#1ED36A" />
            <path d="M26.979 52.2645H11.3176C10.5248 52.2645 9.87598 51.6163 9.87598 50.8228C9.87598 50.0299 10.5248 49.3811 11.3176 49.3811H27.9342C28.8528 47.0386 30.0784 45.0555 31.5926 43.0731H11.3176C10.5248 43.0731 9.87598 42.4249 9.87598 41.6314C9.87598 40.8385 10.5248 40.1897 11.3176 40.1897H34.3319C38.6568 36.4049 44.3879 33.9903 50.6415 33.9903C51.236 33.9903 51.723 34.044 52.4438 34.0983V19.2837H41.6304C37.4495 19.2837 34.0615 15.8596 34.0615 11.6963V0H6.41594C2.84726 0 0 2.91935 0 6.50582V61.5102C0 65.0967 2.84726 67.944 6.41594 67.944H28.132C26.8887 65.0607 26.2039 61.8166 26.2039 58.4285C26.1856 56.302 26.4743 54.2469 26.979 52.2645ZM11.3176 31.1784H29.5742C30.3671 31.1784 31.0159 31.8272 31.0159 32.6207C31.0159 33.4135 30.3671 34.0623 29.5742 34.0623H11.3176C10.5248 34.0623 9.87598 33.4135 9.87598 32.6207C9.87598 31.8272 10.5248 31.1784 11.3176 31.1784Z" fill="#1ED36A" />
            <path d="M50.6258 36.9269C38.7498 36.9269 29.0898 46.5864 29.0898 58.4634C29.0898 70.3398 38.7498 79.9999 50.6258 79.9999C62.5025 79.9999 72.1624 70.3398 72.1624 58.4634C72.1624 46.5864 62.5025 36.9269 50.6258 36.9269ZM62.1424 58.7875C61.872 59.0402 61.5113 59.1665 61.1689 59.1665C60.7905 59.1665 60.4121 59.0042 60.1234 58.7155L52.0858 50.0649V70.6462C52.0858 71.4397 51.437 72.0885 50.6441 72.0885C49.8513 72.0885 49.2025 71.4397 49.2025 70.6462V50.0472L41.1289 58.6978C40.5881 59.2746 39.6506 59.3106 39.0739 58.7698C38.4977 58.229 38.4611 57.3098 39.0018 56.733L49.5626 45.3968C49.833 45.1087 50.2114 44.9464 50.6258 44.9464C51.0409 44.9464 51.401 45.1087 51.6897 45.3968L62.2505 56.733C62.7552 57.3281 62.7186 58.2473 62.1424 58.7875Z" fill="#1ED36A" />
        </svg>
    );

    const DownloadIcon = () => (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 18H3.99999C2.93162 18 1.92714 17.5839 1.17159 16.8284C0.416078 16.0729 0 15.0684 0 14V12.9999C0 12.4476 0.447692 11.9999 1.00001 11.9999C1.55232 11.9999 2.00001 12.4476 2.00001 12.9999V14C2.00001 14.5342 2.20807 15.0364 2.58576 15.4141C2.96355 15.7919 3.46577 16 3.99999 16H14C14.5342 16 15.0364 15.7919 15.4141 15.4141C15.7919 15.0363 16 14.5341 16 14V12.9999C16 12.4476 16.4477 11.9999 17 11.9999C17.5522 11.9999 18 12.4476 18 12.9999V14C18 15.0683 17.5839 16.0728 16.8284 16.8284C16.0728 17.5839 15.0683 18 14 18ZM8.99998 13.9999C8.86165 13.9999 8.72996 13.9719 8.61014 13.9211C8.49835 13.8739 8.39331 13.8053 8.30141 13.7155C8.30137 13.7155 8.30137 13.7155 8.30134 13.7155C8.30067 13.7148 8.30001 13.7142 8.29935 13.7135C8.29917 13.7134 8.29896 13.7131 8.29879 13.7129C8.29823 13.7124 8.29774 13.7119 8.29721 13.7114C8.29687 13.7111 8.29655 13.7108 8.2962 13.7104C8.29585 13.71 8.2954 13.7096 8.29508 13.7093C8.29439 13.7086 8.29362 13.7078 8.29292 13.7071L4.2929 9.70708C3.90239 9.31657 3.90239 8.68339 4.2929 8.29285C4.6834 7.90234 5.31662 7.90231 5.70713 8.29285L8.00001 10.5857V1.00001C7.99998 0.447692 8.44767 0 8.99998 0C9.5523 0 10 0.447692 10 1.00001V10.5857L12.2929 8.29285C12.6833 7.90234 13.3166 7.90234 13.7071 8.29285C14.0976 8.68336 14.0976 9.31657 13.7071 9.70708L9.70708 13.7071C9.70638 13.7078 9.70561 13.7085 9.70492 13.7092C9.70453 13.7096 9.70411 13.71 9.7038 13.7103C9.70345 13.7107 9.70313 13.711 9.70278 13.7113C9.7023 13.7119 9.70174 13.7124 9.70125 13.7129C9.70107 13.713 9.70083 13.7133 9.70065 13.7134C9.70002 13.7141 9.69936 13.7148 9.6987 13.7154C9.69866 13.7154 9.69866 13.7154 9.69863 13.7155C9.68762 13.7262 9.67648 13.7366 9.66509 13.7467C9.58136 13.8214 9.48809 13.8796 9.38948 13.9212C9.38913 13.9213 9.38885 13.9215 9.3885 13.9216C9.38811 13.9218 9.3878 13.922 9.38742 13.9221C9.26823 13.9723 9.13737 13.9999 8.99998 13.9999Z" fill="#1ED36A" />
        </svg>
    );

    return (
        <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-[400px] block
                ${isDragActive ? 'border-[#1ED36A] bg-[#1ED36A]/5' : 'border-gray-300 dark:border-[#FFFFFF1F] hover:border-[#1ED36A]/50 hover:bg-gray-50 dark:hover:bg-[#FFFFFF05]'}
                ${error ? 'border-red-500 bg-red-500/5' : ''}
                bg-white dark:bg-transparent
            `}
        >
            <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
                disabled={isUploading || uploadComplete}
            />

            <BulkUploadIcon />

            <h3 className="font-sans font-normal text-[clamp(16px,1vw+12px,20px)] leading-[100%] text-gray-900 dark:text-white mb-2">
                Drag your file here or <span className="font-medium text-[#1ED36A]">Click to Upload</span>
            </h3>

            <p className="font-sans font-normal text-[clamp(14px,1vw+10px,16px)] leading-[100%] text-gray-600 dark:text-white/80 mb-8">
                Supported formats: <span className="font-semibold text-gray-900 dark:text-white">CSV,</span> Maximum file size: 2 MB
            </p>

            {error && (
                <div className="text-red-400 text-sm mb-4 bg-red-500/10 px-4 py-2 rounded">
                    {error}
                </div>
            )}

            <div className="mt-4">
                <a
                    href="/sample_bulk_registration.csv"
                    onClick={(e) => e.stopPropagation()}
                    download
                    className="
                        flex items-center gap-2 px-6 py-3 rounded-lg 
                        bg-gray-100 hover:bg-gray-200 dark:bg-[#FFFFFF0D] dark:hover:bg-[#FFFFFF1A]
                        font-sans font-medium text-[16px] leading-[100%]
                        text-gray-900 dark:text-white 
                        transition-colors
                    "
                >
                    <DownloadIcon />
                    Download Sample CSV
                </a>
            </div>
        </label>
    );
};
