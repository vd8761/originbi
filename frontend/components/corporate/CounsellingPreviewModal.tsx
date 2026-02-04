
import React, { useState } from 'react';
import { X, FileText, User } from 'lucide-react';

interface CounsellingPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: any; // Type should be defined strictly but any for now to facilitate speed
}

const CounsellingPreviewModal: React.FC<CounsellingPreviewModalProps> = ({ isOpen, onClose, session }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'report'>('details');

    if (!isOpen || !session) return null;

    const studentDetails = session.studentDetails || {}; // Assuming snake_case from storage might be converted or raw
    // The API response earlier showed `student_details` (snake_case) in the DB, but frontend service usually returns camelCase if transformed?
    // Let's assume raw JSON from DB is passed or check network response.
    // The verify query showed `student_details` jsonb column.
    // Frontend `getAssessmentSessions` usually maps things.
    // Let's be safe and check both.
    const details = studentDetails;
    const contactInfo = details.contact_information || {};

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-fade-in overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Student Preview
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {contactInfo.first_name} {contactInfo.last_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-white/10">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'details'
                            ? 'text-brand-green border-b-2 border-brand-green bg-brand-green/5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-green hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                    >
                        Student Details
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'report'
                            ? 'text-brand-green border-b-2 border-brand-green bg-brand-green/5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-green hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                    >
                        Report / Analysis
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-transparent">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Contact Info Section */}
                            <section className="bg-white dark:bg-brand-dark-secondary rounded-xl p-5 border border-gray-100 dark:border-white/5 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-brand-green rounded-full"></span>
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Full Name</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1">{contactInfo.first_name} {contactInfo.last_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Email</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1">{contactInfo.email || session.email || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Mobile</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1">{contactInfo.mobile_number || session.mobileNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Source</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1">{details.other_details?.source || 'N/A'}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Raw JSON View (for development/debugging or deep dive) */}
                            <section className="bg-white dark:bg-brand-dark-secondary rounded-xl p-5 border border-gray-100 dark:border-white/5 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                    Full Data Payload
                                </h3>
                                <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                                    <pre>{JSON.stringify(details, null, 2)}</pre>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand-green">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Report Generation</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                The comprehensive report and analysis for this student is currently being processed or is not yet integrated into the preview mode.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-brand-dark-secondary flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        Close
                    </button>
                    {/* Placeholder for future export button */}
                    {/* <button className="px-5 py-2.5 rounded-lg bg-brand-green text-white text-sm font-bold hover:bg-brand-green/90 transition-colors">
                        Download Report
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default CounsellingPreviewModal;
