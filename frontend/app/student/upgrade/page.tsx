'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentService } from '../../../lib/services/student.service';
import CustomSelect from '../../../components/ui/CustomSelect';

interface StreamInfo {
    id: number;
    name: string;
}

interface DepartmentInfo {
    id: number;
    name: string;
}

export default function UpgradePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // User details loaded from backend
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [amount, setAmount] = useState(999);
    const [programCode, setProgramCode] = useState('COLLEGE_STUDENT');
    const [programName, setProgramName] = useState('College Student');

    // Form inputs prefilled from backend
    const [schoolLevel, setSchoolLevel] = useState('12th');
    const [schoolStream, setSchoolStream] = useState('Science');
    const [studentBoard, setStudentBoard] = useState('CBSE');
    const [departmentDegreeId, setDepartmentDegreeId] = useState<string>('');
    const [currentYear, setCurrentYear] = useState('1st Year');
    const [currentRole, setCurrentRole] = useState('');
    const [roleDescription, setRoleDescription] = useState('');

    // Lists loaded from backend
    const [streams, setStreams] = useState<StreamInfo[]>([]);
    const [departments, setDepartments] = useState<DepartmentInfo[]>([]);

    useEffect(() => {
        const emailVal = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
        if (!emailVal) {
            router.push('/student/login');
            return;
        }
        setEmail(emailVal);

        const loadData = async () => {
            try {
                const info = await studentService.getUpgradeInfo(emailVal);
                if (!info) {
                    setError('Unable to load upgrade details. Please try again.');
                    setLoading(false);
                    return;
                }

                if (info.alreadyUpgraded) {
                    router.push('/student/dashboard');
                    return;
                }

                setFullName(info.user.fullName || '');
                setAmount(info.amount || 999);
                setProgramCode(info.program.code);
                setProgramName(info.program.assessmentTitle || info.program.name || 'College Student');

                // Prefill details from backend
                if (info.details) {
                    if (info.details.schoolLevel) setSchoolLevel(info.details.schoolLevel);
                    if (info.details.schoolStream) setSchoolStream(info.details.schoolStream);
                    if (info.details.studentBoard) setStudentBoard(info.details.studentBoard);
                    if (info.details.departmentDegreeId) setDepartmentDegreeId(String(info.details.departmentDegreeId));
                    if (info.details.currentYear) setCurrentYear(info.details.currentYear);
                    if (info.details.currentRole) setCurrentRole(info.details.currentRole);
                    if (info.details.roleDescription) setRoleDescription(info.details.roleDescription);
                }

                setStreams(info.streams || []);
                setDepartments(info.departments || []);
                if (!info.details?.departmentDegreeId && info.departments && info.departments.length > 0) {
                    setDepartmentDegreeId(String(info.departments[0].id));
                }
            } catch (err: any) {
                console.error(err);
                setError('Failed to fetch upgrade information.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    const handleUpgradeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const order = await studentService.createUpgradeOrder(email);

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                const options = {
                    key: order.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'OriginBI',
                    description: 'OriginBI Premium Student Upgrade',
                    order_id: order.orderId,
                    handler: async (response: any) => {
                        try {
                            setSubmitting(true);
                            const result = await studentService.verifyUpgradePayment({
                                email,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                program_code: programCode,
                            });

                            if (result.success) {
                                setSuccess(true);
                                setTimeout(() => {
                                    router.push('/student/assessment');
                                }, 3000);
                            } else {
                                setError(result.message || 'Verification failed. Please contact support.');
                            }
                        } catch (err: any) {
                            setError('Failed to verify payment. Please contact support.');
                            console.error(err);
                        } finally {
                            setSubmitting(false);
                        }
                    },
                    prefill: {
                        name: fullName,
                        email: email,
                    },
                    theme: { color: '#1ED36A' },
                    modal: {
                        ondismiss: () => setSubmitting(false),
                    },
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            };
            script.onerror = () => {
                setError('Failed to load Razorpay payment window. Check your internet connection.');
                setSubmitting(false);
            };
            document.body.appendChild(script);
        } catch (err: any) {
            setError(err.message || 'Failed to start payment process.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
                    <p className="text-black dark:text-white text-sm font-medium animate-pulse">
                        Setting up your upgrade page...
                    </p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-[85vh] flex items-center justify-center p-4 animate-fade-in">
                <div className="relative z-10 w-full max-w-[480px] bg-white dark:bg-[#19211C] border border-black/10 dark:border-white/10 rounded-3xl shadow-xl p-8 md:p-10 flex flex-col items-center text-center space-y-8">
                    <div className="relative">
                        <div className="relative w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-black dark:text-white tracking-tight">
                            Upgrade Successful!
                        </h2>
                        <p className="text-black dark:text-white text-base font-medium">
                            Welcome to OriginBI Premium. Your assessment is being scheduled.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-green uppercase tracking-widest animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-green"></span>
                        Redirecting to Assessment...
                    </div>
                </div>
            </div>
        );
    }

    // Dropdown options mappings
    const classOptions = ['8th', '9th', '10th', '11th', '12th'].map(lvl => ({ value: lvl, label: lvl }));
    const streamOptions = streams.map(s => ({ value: s.name, label: s.name }));
    const boardOptions = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'].map(b => ({ value: b, label: b }));
    const deptOptions = departments.map(d => ({ value: String(d.id), label: d.name }));
    const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map(y => ({ value: y, label: y }));

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 md:p-8 relative">
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#19211C] border border-black/10 dark:border-white/10 shadow-xl rounded-3xl overflow-hidden transition-all duration-300">
                <div className="px-6 py-8 md:p-10 border-b border-black/10 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-brand-light-secondary/20 dark:bg-black/10">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black dark:text-white font-sans">
                            Upgrade to OriginBI Behavioral Analysis
                        </h1>
                        <p className="text-sm font-medium text-black dark:text-white">
                            Verify your program details to unlock complete access
                        </p>
                    </div>
                </div>

                <form onSubmit={handleUpgradeSubmit} className="p-6 md:p-10 space-y-8">
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium animate-fade-in">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-black dark:text-white mb-2.5">
                                Program Assessment
                            </label>
                            <div className="p-4 rounded-2xl border border-brand-green bg-brand-green/10">
                                <span className="text-lg font-bold text-brand-green">
                                    {programName}
                                </span>
                            </div>
                        </div>

                        {/* Read-Only Prefilled Form Fields with custom Select theme styling */}
                        {programCode === 'SCHOOL_STUDENT' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        Class Level
                                    </label>
                                    <CustomSelect
                                        options={classOptions}
                                        value={schoolLevel}
                                        disabled={true}
                                        onChange={() => {}}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        Stream / Group
                                    </label>
                                    <CustomSelect
                                        options={streamOptions}
                                        value={schoolStream}
                                        disabled={true}
                                        onChange={() => {}}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        Education Board
                                    </label>
                                    <CustomSelect
                                        options={boardOptions}
                                        value={studentBoard}
                                        disabled={true}
                                        onChange={() => {}}
                                    />
                                </div>
                            </div>
                        )}

                        {programCode === 'COLLEGE_STUDENT' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        Department & Degree
                                    </label>
                                    <CustomSelect
                                        options={deptOptions}
                                        value={departmentDegreeId}
                                        disabled={true}
                                        onChange={() => {}}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        Academic Year
                                    </label>
                                    <CustomSelect
                                        options={yearOptions}
                                        value={currentYear}
                                        disabled={true}
                                        onChange={() => {}}
                                    />
                                </div>
                            </div>
                        )}

                        {programCode === 'EMPLOYEE' && (
                            <div className="space-y-4 pt-3 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        Current Role / Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={currentRole}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-brand-light-secondary dark:bg-brand-dark-tertiary text-black dark:text-white font-medium outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        Role Description
                                    </label>
                                    <textarea
                                        value={roleDescription}
                                        readOnly
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-brand-dark-tertiary text-black dark:text-white font-medium outline-none transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary and Pay CTA */}
                    <div className="pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-black dark:text-white text-sm font-semibold">Total Price:</span>
                            <span className="text-3xl font-extrabold text-black dark:text-white">₹{amount}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-green/90 text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-white"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <span>Pay</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
