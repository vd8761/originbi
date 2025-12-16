import React from 'react';
import { CorporateAccount } from '@/lib/types';

interface ExtendedCorporateAccount extends Omit<CorporateAccount, 'is_blocked'> {
    full_name?: string;
    email?: string;
    is_blocked?: boolean;
}

interface CorporateDetailsViewProps {
    data: ExtendedCorporateAccount;
    onBack: () => void;
}

const CorporateDetailsView: React.FC<CorporateDetailsViewProps> = ({ data, onBack }) => {
    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-light-tertiary dark:border-brand-dark-tertiary">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-brand-light-secondary dark:hover:bg-brand-dark-secondary rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-brand-text-light-secondary dark:text-brand-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-brand-text-light-primary dark:text-white">
                        Registration Details
                    </h2>
                </div>
                <div className="flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${data.is_active
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        {data.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    {data.is_blocked && (
                        <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                            BANNED
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary flex flex-col items-center text-center">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || 'User')}&background=random&size=128`}
                            alt="Profile"
                            className="w-32 h-32 rounded-full mb-4 border-4 border-brand-light-tertiary dark:border-brand-dark-tertiary"
                        />
                        <h3 className="text-xl font-bold text-brand-text-light-primary dark:text-white mb-1">
                            {data.full_name}
                        </h3>
                        <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mb-4">
                            {data.job_title || 'No Job Title'}
                        </p>

                        <div className="w-full pt-4 border-t border-brand-light-tertiary dark:border-brand-dark-tertiary grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-1">Credits</p>
                                <p className="text-lg font-bold text-brand-green">{data.available_credits ?? 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-1">Total Allocated</p>
                                <p className="text-lg font-bold text-brand-text-light-primary dark:text-white">{data.total_credits ?? 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                        <h4 className="font-semibold text-brand-text-light-primary dark:text-white mb-4">Contact Information</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1">Email Address</label>
                                <p className="text-sm font-medium text-brand-text-light-primary dark:text-white break-all">{data.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1">Mobile Number</label>
                                <p className="text-sm font-medium text-brand-text-light-primary dark:text-white">
                                    {data.country_code} {data.mobile_number}
                                </p>
                            </div>
                            {data.linkedin_url && (
                                <div>
                                    <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1">LinkedIn Profile</label>
                                    <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-500 hover:underline break-all">
                                        {data.linkedin_url}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Company & Other Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                        <h4 className="text-lg font-semibold text-brand-text-light-primary dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Company Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailItem label="Company Name" value={data.company_name} />
                            <DetailItem label="Sector" value={data.sector_code} />
                            <DetailItem label="Employee Ref / Code" value={data.employee_ref_id} />
                            <DetailItem label="Job Title" value={data.job_title} />
                            <DetailItem label="Gender" value={data.gender} />

                            <div className="md:col-span-2">
                                <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1">Business Locations</label>
                                <div className="flex flex-wrap gap-2">
                                    {data.business_locations?.split(',').map((loc, idx) => (
                                        <span key={idx} className="px-3 py-1 rounded-md bg-brand-light-secondary dark:bg-brand-dark-secondary text-xs text-brand-text-light-primary dark:text-white border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                                            {loc.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                        <h4 className="text-lg font-semibold text-brand-text-light-primary dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            System Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailItem label="Registration ID" value={data.id?.toString()} />
                            <DetailItem label="Created At" value={data.created_at ? new Date(data.created_at).toLocaleString() : '-'} />
                            <DetailItem label="Last Updated" value={data.updated_at ? new Date(data.updated_at).toLocaleString() : '-'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value }: { label: string, value?: string | number }) => (
    <div>
        <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1 font-medium uppercase tracking-wide opacity-70">
            {label}
        </label>
        <p className="text-base font-medium text-brand-text-light-primary dark:text-white">
            {value || '-'}
        </p>
    </div>
);

export default CorporateDetailsView;
