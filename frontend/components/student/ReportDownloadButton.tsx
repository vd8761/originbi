import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { reportService } from '../../lib/services/report.service';
import { studentService } from '../../lib/services/student.service';

interface ReportDownloadButtonProps {
    className?: string;
}

const ReportDownloadButton: React.FC<ReportDownloadButtonProps> = ({ className }) => {
    const [status, setStatus] = useState<'IDLE' | 'STARTING' | 'POLLING' | 'DOWNLOADING' | 'COMPLETED' | 'ERROR'>('IDLE');
    const [progress, setProgress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async () => {
        if (status !== 'IDLE' && status !== 'ERROR' && status !== 'COMPLETED') return;

        try {
            setStatus('STARTING');
            setError(null);
            setProgress('Initiating...');

            // 1. Get User ID
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            if (!email) {
                throw new Error("User email not found. Please login again.");
            }

            const profile = await studentService.getProfile(email);
            if (!profile || !profile.id) {
                throw new Error("User profile not found.");
            }
            const studentId = profile.id;

            // 2. Start Generation
            const { jobId } = await reportService.generateStudentReport(studentId);
            if (!jobId) throw new Error("Failed to start report generation.");

            setStatus('POLLING');
            setProgress('Generating Report...');

            // 3. Poll Status
            const pollInterval = setInterval(async () => {
                try {
                    const jobStatus = await reportService.checkStatus(jobId);

                    if (jobStatus.status === 'PROCESSING') {
                        setProgress(jobStatus.progress || 'Processing...');
                    } else if (jobStatus.status === 'COMPLETED') {
                        clearInterval(pollInterval);
                        setStatus('DOWNLOADING');
                        setProgress('Downloading...');

                        // 4. Download File
                        // Construct download URL relative to report service
                        // The statusUrl returned is relative, we need full path
                        // Assume same base URL as report service
                        const downloadUrl = jobStatus.downloadUrl; // e.g. /download/status/jobId?download=true
                        
                        // We can use window.location if absolute, but report service might be different domain/port
                        // Use fetch blob approach to be safe or window.open
                        
                        // Since we are inside the component, let's try direct download link creation
                        // Modify reportService to handle actual download or use window.location
                        // Given reportController handling:
                        // res.download sends file content.
                        
                        // Best approach: create a hidden link and click it
                        // But we need the full URL.
                        // Assuming report service URL is base.
                        const API_URL = process.env.NEXT_PUBLIC_REPORT_API_URL || "http://localhost:4006";
                        const fullDownloadUrl = `${API_URL}${downloadUrl}`;
                        
                        // Trigger download
                        const link = document.createElement('a');
                        link.href = fullDownloadUrl;
                        link.setAttribute('download', `Report_${studentId}.pdf`); // Optional renaming
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        setStatus('COMPLETED');
                        setTimeout(() => setStatus('IDLE'), 3000); // Reset after 3s
                    } else if (jobStatus.status === 'ERROR') {
                        clearInterval(pollInterval);
                        setStatus('ERROR');
                        setError(jobStatus.error || "Generation Failed");
                    }
                } catch (e) {
                    // Check status failure
                    // Continue polling? Or fail?
                    // Let's count failures or just log
                    console.error("Polling error", e);
                }
            }, 2000);

        } catch (err) {
            console.error("Download failed", err);
            setStatus('ERROR');
            setError((err as Error).message);
        }
    };

    return (
        <div className={`flex flex-col items-start ${className}`}>
            <button
                onClick={handleDownload}
                disabled={status === 'STARTING' || status === 'POLLING' || status === 'DOWNLOADING'}
                className={`
                    relative overflow-hidden group
                    px-6 py-3 rounded-xl
                    transition-all duration-300
                    flex items-center justify-center gap-3
                    ${status === 'ERROR' 
                        ? 'bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/30' 
                        : status === 'COMPLETED'
                        ? 'bg-green-500/20 text-green-200 border border-green-500/50 hover:bg-green-500/30'
                        : 'bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    }
                    disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:translate-y-0
                `}
            >
                {/* Status Icons & Text */}
                {status === 'IDLE' && (
                    <>
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium tracking-wide">Download Report</span>
                    </>
                )}

                {(status === 'STARTING' || status === 'POLLING') && (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                        <span className="font-medium tracking-wide">{progress || 'Processing...'}</span>
                    </>
                )}

                {status === 'DOWNLOADING' && (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                        <span className="font-medium tracking-wide">Downloading...</span>
                    </>
                )}
                
                {status === 'COMPLETED' && (
                    <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-medium tracking-wide text-green-100">Downloaded!</span>
                    </>
                )}

                {status === 'ERROR' && (
                    <>
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="font-medium tracking-wide text-red-100">Failed</span>
                    </>
                )}
                
                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none" />
            </button>
            
            {/* Error Message */}
            {error && (
                <p className="mt-2 text-xs text-red-300 bg-red-900/40 px-2 py-1 rounded backdrop-blur-sm border border-red-500/30 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};

export default ReportDownloadButton;
