"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface AffiliateDocument {
    key: string;
    url: string;
    fileName: string;
}

interface AffiliateDetailsViewProps {
    data: any;
    onBack: () => void;
}

const AffiliateDetailsView: React.FC<AffiliateDetailsViewProps> = ({ data, onBack }) => {
    const [previewDoc, setPreviewDoc] = useState<AffiliateDocument | null>(null);

    const aadharDocs: AffiliateDocument[] = data.aadhar_documents || [];
    const panDocs: AffiliateDocument[] = data.pan_documents || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();

        if (ext === 'pdf') {
            return (
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    <text x="50%" y="17" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle">PDF</text>
                </svg>
            );
        }

        if (['jpg', 'jpeg'].includes(ext || '')) {
            return (
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    <text x="50%" y="17" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle">JPG</text>
                </svg>
            );
        }

        if (ext === 'png') {
            return (
                <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    <text x="50%" y="17" fontSize="6" fill="currentColor" fontWeight="bold" textAnchor="middle">PNG</text>
                </svg>
            );
        }

        return (
            <svg className="w-8 h-8 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                <text x="50%" y="17" fontSize="5" fill="currentColor" fontWeight="bold" textAnchor="middle" className="uppercase">
                    {ext?.substring(0, 3) || 'DOC'}
                </text>
            </svg>
        );
    };

    const isImage = (fileName: string) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-light-tertiary dark:border-brand-dark-tertiary">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                        <Link href="/admin/dashboard" className="hover:underline hover:text-brand-green transition-colors">
                            Dashboard
                        </Link>
                        <span className="mx-2 text-gray-400 dark:text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                        <button
                            onClick={onBack}
                            className="hover:underline hover:text-brand-green transition-colors focus:outline-none"
                        >
                            Affiliates
                        </button>
                        <span className="mx-2 text-gray-400 dark:text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                        <span className="text-brand-green font-semibold">Preview</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-brand-light-secondary dark:hover:bg-brand-dark-secondary rounded-lg transition-colors"
                            title="Back to List"
                        >
                            <svg className="w-5 h-5 text-brand-text-light-secondary dark:text-brand-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h2 className="text-2xl font-bold text-brand-text-light-primary dark:text-white">
                            Affiliate Profile Preview
                        </h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${data.is_active
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        {data.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </div>
            </div>

            {/* Top Row: Avatar card + Registration Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Avatar & Quick Stats */}
                <div className="lg:col-span-1">
                    <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary flex flex-col items-center text-center h-full">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=random&size=128`}
                            alt="Profile"
                            className="w-32 h-32 rounded-full mb-4 border-4 border-brand-light-tertiary dark:border-brand-dark-tertiary"
                        />
                        <h3 className="text-xl font-bold text-brand-text-light-primary dark:text-white mb-1">
                            {data.name}
                        </h3>
                        <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mb-2">
                            Affiliate Partner
                        </p>
                        <span className="px-3 py-1 rounded-md bg-brand-green/10 text-brand-green text-xs font-semibold border border-brand-green/20 mb-4">
                            {data.referral_code}
                        </span>

                        <div className="w-full pt-4 border-t border-brand-light-tertiary dark:border-brand-dark-tertiary grid grid-cols-2 gap-4 mt-auto">
                            <div className="text-center">
                                <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-1">Referrals</p>
                                <p className="text-lg font-bold text-brand-green">{data.referral_count ?? 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-1">Commission</p>
                                <p className="text-lg font-bold text-brand-text-light-primary dark:text-white">{data.commission_percentage ?? 0}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Registration Details */}
                <div className="lg:col-span-2">
                    <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary h-full">
                        <h4 className="text-lg font-semibold text-brand-text-light-primary dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Personal Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailItem label="Full Name" value={data.name} />
                            <DetailItem label="Email Address" value={data.email} />
                            <DetailItem label="Mobile Number" value={`${data.country_code || '+91'} ${data.mobile_number}`} />
                            <DetailItem label="Referral Code" value={data.referral_code} />

                            {data.address && (
                                <div className="md:col-span-2">
                                    <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1 font-medium uppercase tracking-wide opacity-70">
                                        Address
                                    </label>
                                    <p className="text-sm font-medium text-brand-text-light-primary dark:text-white whitespace-pre-wrap">
                                        {data.address}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Commission Overview */}
            <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                <h4 className="text-lg font-semibold text-brand-text-light-primary dark:text-white mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Commission Overview
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary p-5 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary text-center">
                        <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-2 uppercase tracking-wide font-medium">Total Earned</p>
                        <p className="text-2xl font-bold text-brand-green">{formatCurrency(data.total_earned_commission)}</p>
                    </div>
                    <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary p-5 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary text-center">
                        <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-2 uppercase tracking-wide font-medium">Total Settled</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.total_settled_commission)}</p>
                    </div>
                    <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary p-5 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary text-center">
                        <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-2 uppercase tracking-wide font-medium">Total Pending</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(data.total_pending_commission)}</p>
                    </div>
                </div>
            </div>

            {/* Payment Details */}
            <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                <h4 className="text-lg font-semibold text-brand-text-light-primary dark:text-white mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Payment Details
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* UPI Details */}
                    <div>
                        <h5 className="text-sm font-semibold text-brand-text-light-primary dark:text-white mb-4 flex items-center gap-2">
                            UPI Details
                        </h5>
                        <div className="space-y-4 pl-4">
                            <DetailItem label="UPI ID" value={data.upi_id} />
                            <DetailItem label="UPI Number" value={data.upi_number} />
                        </div>
                    </div>
                    {/* Bank Details */}
                    <div>
                        <h5 className="text-sm font-semibold text-brand-text-light-primary dark:text-white mb-4 flex items-center gap-2">
                            Bank Account Details
                        </h5>
                        <div className="space-y-4 pl-4">
                            <DetailItem label="Account Holder Name" value={data.banking_name} />
                            <DetailItem label="Account Number" value={data.account_number} />
                            <DetailItem label="IFSC Code" value={data.ifsc_code} />
                            <DetailItem label="Branch Name" value={data.branch_name} />
                        </div>
                    </div>
                </div>
            </div>

            {/* KYC Documents Section */}
            <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                <h4 className="text-lg font-semibold text-brand-text-light-primary dark:text-white mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    KYC Documents
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Aadhar Documents */}
                    <div>
                        <h5 className="text-sm font-semibold text-brand-text-light-primary dark:text-white mb-4 flex items-center gap-2">
                            Aadhar Card Documents
                            <span className="text-xs font-normal text-brand-text-light-secondary dark:text-brand-text-secondary">
                                ({aadharDocs.length} file{aadharDocs.length !== 1 ? 's' : ''})
                            </span>
                        </h5>
                        {aadharDocs.length > 0 ? (
                            <div className="space-y-3">
                                {aadharDocs.map((doc, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 p-3 rounded-xl bg-brand-light-secondary dark:bg-brand-dark-secondary border border-brand-light-tertiary dark:border-brand-dark-tertiary hover:border-brand-green/40 transition-colors group"
                                    >
                                        {/* Thumbnail / Icon */}
                                        <div
                                            className="w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-[#2a2a2a] flex items-center justify-center shrink-0 border border-brand-light-tertiary dark:border-brand-dark-tertiary cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] transition-colors"
                                            onClick={() => isImage(doc.fileName) && setPreviewDoc(doc)}
                                        >
                                            {getFileIcon(doc.fileName)}
                                        </div>
                                        {/* File info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-brand-text-light-primary dark:text-white truncate" title={doc.fileName}>
                                                {doc.fileName}
                                            </p>
                                            <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mt-0.5">
                                                Aadhar Document {index + 1}
                                            </p>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isImage(doc.fileName) && (
                                                <button
                                                    onClick={() => setPreviewDoc(doc)}
                                                    className="p-2 text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                                                    title="Preview"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center rounded-xl bg-brand-light-secondary dark:bg-brand-dark-secondary border border-dashed border-brand-light-tertiary dark:border-brand-dark-tertiary">
                                <svg className="w-10 h-10 mx-auto text-brand-text-light-secondary dark:text-brand-text-secondary opacity-40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
                                    No Aadhar documents uploaded
                                </p>
                            </div>
                        )}
                    </div>

                    {/* PAN Documents */}
                    <div>
                        <h5 className="text-sm font-semibold text-brand-text-light-primary dark:text-white mb-4 flex items-center gap-2">
                            PAN Card Documents
                            <span className="text-xs font-normal text-brand-text-light-secondary dark:text-brand-text-secondary">
                                ({panDocs.length} file{panDocs.length !== 1 ? 's' : ''})
                            </span>
                        </h5>
                        {panDocs.length > 0 ? (
                            <div className="space-y-3">
                                {panDocs.map((doc, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 p-3 rounded-xl bg-brand-light-secondary dark:bg-brand-dark-secondary border border-brand-light-tertiary dark:border-brand-dark-tertiary hover:border-brand-green/40 transition-colors group"
                                    >
                                        {/* Thumbnail / Icon */}
                                        <div
                                            className="w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-[#2a2a2a] flex items-center justify-center shrink-0 border border-brand-light-tertiary dark:border-brand-dark-tertiary cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] transition-colors"
                                            onClick={() => isImage(doc.fileName) && setPreviewDoc(doc)}
                                        >
                                            {getFileIcon(doc.fileName)}
                                        </div>
                                        {/* File info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-brand-text-light-primary dark:text-white truncate" title={doc.fileName}>
                                                {doc.fileName}
                                            </p>
                                            <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mt-0.5">
                                                PAN Document {index + 1}
                                            </p>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isImage(doc.fileName) && (
                                                <button
                                                    onClick={() => setPreviewDoc(doc)}
                                                    className="p-2 text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                                                    title="Preview"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center rounded-xl bg-brand-light-secondary dark:bg-brand-dark-secondary border border-dashed border-brand-light-tertiary dark:border-brand-dark-tertiary">
                                <svg className="w-10 h-10 mx-auto text-brand-text-light-secondary dark:text-brand-text-secondary opacity-40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
                                    No PAN documents uploaded
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setPreviewDoc(null)}
                    />
                    <div className="relative w-full max-w-3xl bg-white dark:bg-[#1A1F23] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-semibold text-brand-text-light-primary dark:text-white">
                                    Document Preview
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md">
                                    {previewDoc.fileName}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewDoc(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-500 dark:text-gray-400"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Image Body */}
                        <div className="p-6 flex items-center justify-center bg-gray-50 dark:bg-[#111] min-h-[300px] max-h-[70vh]">
                            <img
                                src={previewDoc.url}
                                alt={previewDoc.fileName}
                                className="max-w-full max-h-[60vh] object-contain rounded-lg"
                            />
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <a
                                href={previewDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-text-light-primary dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open in New Tab
                            </a>
                            <button
                                onClick={() => setPreviewDoc(null)}
                                className="px-6 py-2 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors cursor-pointer shadow-md shadow-brand-green/20"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div>
        <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1 font-medium uppercase tracking-wide opacity-70">
            {label}
        </label>
        <p className="text-base font-medium text-brand-text-light-primary dark:text-white">
            {value || '-'}
        </p>
    </div>
);

export default AffiliateDetailsView;
