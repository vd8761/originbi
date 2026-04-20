'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, updatePassword } from 'aws-amplify/auth';
import { configureAmplify } from '../../../lib/aws-amplify-config';
import RequireStudent from '../../../components/auth/RequireStudent';
import { studentService } from '../../../lib/services/student.service';
import { ArrowRightWithoutLineIcon, PhoneIcon, EmailIcon, LockIcon, EyeIcon, EyeOffIcon, XIcon, WarningIcon } from '../../../components/icons';
import { capitalizeWords, getAvatarColor, getInitials } from '../../../lib/utils';

configureAmplify();

interface PersonalityTrait {
    id: number;
    code: string;
    name: string;
    colorRgb: string;
}

interface UserProfile {
    name: string;
    email: string;
    personalityTrait?: PersonalityTrait;
    metadata?: {
        fullName?: string;
        name?: string;
    };
    mobile_number?: string;
    programCode?: string;
    academicDetails?: {
        schoolLevel?: string;
        schoolStream?: string;
        studentBoard?: string;
        departmentDegreeId?: number;
        departmentName?: string;
        currentYear?: string;
    };
}

export default function ProfileSettingsPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            
            if (email) {
                try {
                    const profile = await studentService.getProfile(email);
                    if (profile) {
                        setUser({
                            name: profile.metadata?.fullName || profile.metadata?.name || profile.email?.split('@')[0] || 'Student',
                            email: profile.email,
                            personalityTrait: profile.personalityTrait,
                            mobile_number: profile.mobile_number || profile.metadata?.phone || profile.phone,
                            programCode: profile.programCode,
                            academicDetails: profile.academicDetails
                        });
                    } else {
                        // Check cache
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                            const cachedUser = JSON.parse(userStr);
                            setUser({
                                name: cachedUser.name || cachedUser.email?.split('@')[0] || 'Student',
                                email: cachedUser.email,
                                personalityTrait: cachedUser.personalityTrait
                              });
                        }
                    }
                } catch (e) {
                    console.error("Error loading profile", e);
                }
            }
            setIsLoading(false);
        };

        fetchUserProfile();
    }, []);

    if (isLoading) {
        return (
            <RequireStudent>
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#19211C]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1ED36A]"></div>
                </div>
            </RequireStudent>
        );
    }

    return (
        <RequireStudent>
            <ProfileSettingsContent user={user} />
        </RequireStudent>
    );
}

function ProfileSettingsContent({ user }: { user: UserProfile | null }) {
    const router = useRouter();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const traitName = user?.personalityTrait?.name || 'Analytical Leader';

    return (
        <div className="w-full">
            {/* Breadcrumbs */}
            <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                <span onClick={() => router.push('/student/dashboard')} className="cursor-pointer hover:underline text-gray-500 dark:text-gray-400">Dashboard</span>
                <span className="mx-2 text-gray-400 dark:text-gray-600">
                    <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                </span>
                <span className="text-brand-green font-semibold">Profile</span>
            </div>

            {/* Page Title */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">My Profile and Settings</h1>
            </div>

            {/* Profile Details Card */}
            <div className="bg-white dark:bg-white/[0.08] rounded-2xl p-6 shadow-md dark:shadow-none border border-gray-200 dark:border-white/[0.08] mb-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar */}
                    <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: `#${getAvatarColor(user?.name || 'S')}` }}
                    >
                        {getInitials(user?.name)}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 w-full justify-center sm:justify-start">
                            <h2 className="text-xl sm:text-2xl font-semibold text-[#19211C] dark:text-white">
                                {capitalizeWords(user?.name) || 'Student'}
                            </h2>
                            <div className="flex justify-center sm:justify-start">
                                <div className="px-3 py-[3px] rounded-lg border border-[#FEF000] text-gray-900 dark:text-white text-xs sm:text-sm font-medium bg-[#FEF000]/5 whitespace-nowrap">
                                    Trait: {traitName}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-y-3 gap-x-6 sm:gap-x-8 mt-2">
                            <div className="flex items-center gap-2.5">
                                <PhoneIcon className="w-4 h-4 text-[#1ED36A]" />
                                <span className="text-sm sm:text-[15px] font-medium text-gray-700 dark:text-white">{user?.mobile_number || '99876543321'}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <EmailIcon className="w-[18px] h-[18px] text-[#1ED36A]" />
                                <span className="text-sm sm:text-[15px] font-medium text-gray-700 dark:text-white truncate max-w-[200px] sm:max-w-none">{user?.email || ''}</span>
                            </div>
                        </div>

                        {/* Change Password Button - Mobile version (Inside flow) */}
                        <div className="mt-6 sm:hidden w-full">
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1ED36A]/10 hover:bg-[#1ED36A]/20 text-[#1ED36A] rounded-xl transition-all text-sm font-semibold border border-[#1ED36A]/20"
                            >
                                <LockIcon className="w-4 h-4" />
                                <span>Change Password</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Change Password Button - Desktop version (Absolute) */}
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="hidden sm:flex absolute top-6 right-6 items-center gap-2 px-4 py-2 bg-[#1ED36A]/10 hover:bg-[#1ED36A]/20 text-[#1ED36A] rounded-xl transition-all text-sm font-semibold border border-[#1ED36A]/20 group"
                    >
                        <LockIcon className="w-4 h-4" />
                        <span>Change Password</span>
                    </button>
                </div>
            </div>

            {/* Academic Details Card - Hidden for employees */}
            {user?.programCode !== 'EMPLOYEE' && (
                <div className="bg-white dark:bg-white/[0.08] rounded-2xl p-6 shadow-md dark:shadow-none border border-gray-200 dark:border-white/[0.08] mb-6">
                    <h3 className="text-xl font-semibold text-[#19211C] dark:text-white mb-4">Academic Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* School Student Fields */}
                        {user?.programCode === 'SCHOOL_STUDENT' && (
                            <>
                                <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">School Level</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.academicDetails?.schoolLevel || 'Not specified'}
                                    </p>
                                </div>
                                {user?.academicDetails?.schoolLevel !== 'SSLC' && (
                                    <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Stream</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {user?.academicDetails?.schoolStream || 'Not specified'}
                                        </p>
                                    </div>
                                )}
                                <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Board</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.academicDetails?.studentBoard || 'Not specified'}
                                    </p>
                                </div>
                                {user?.academicDetails?.schoolLevel !== 'SSLC' && (
                                    <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Standard</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {user?.academicDetails?.currentYear || 'Not specified'}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                        {/* College Student Fields */}
                        {user?.programCode === 'COLLEGE_STUDENT' && (
                            <>
                                <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Department</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.academicDetails?.departmentName || 'Not specified'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Year</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.academicDetails?.currentYear || 'Not specified'}
                                    </p>
                                </div>
                            </>
                        )}
                        {/* Default/Fallback */}
                        {(!user?.programCode || user?.programCode === 'DEMO') && (
                            <>
                                <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">School Level</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.academicDetails?.schoolLevel || 'Not specified'}
                                    </p>
                                </div>
                                {user?.academicDetails?.schoolLevel !== 'SSLC' && (
                                    <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Stream/Department</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {user?.academicDetails?.departmentName || user?.academicDetails?.schoolStream || 'Not specified'}
                                        </p>
                                    </div>
                                )}
                                <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Board</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.academicDetails?.studentBoard || 'Not specified'}
                                    </p>
                                </div>
                                {user?.academicDetails?.schoolLevel !== 'SSLC' && (
                                    <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Year/Standard</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {user?.academicDetails?.currentYear || 'Not specified'}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            <ChangePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />
        </div>
    );
}

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showSecurityChecks, setShowSecurityChecks] = useState(false);
    const [currentPasswordError, setCurrentPasswordError] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setCurrentPasswordError(false);
            setShowSecurityChecks(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validatePassword = (password: string) => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
        return checks;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPasswordError(false);
        
        if (formData.newPassword !== formData.confirmPassword) {
            return;
        }

        const checks = validatePassword(formData.newPassword);
        if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number || !checks.special) {
            return;
        }

        setIsLoading(true);
        try {
            await updatePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });
            
            setIsSuccess(true);
            // Don't close immediately, show the success state
            // onClose();
            // setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            console.error("Change password error:", err);
            if (err.name === 'NotAuthorizedException' || err.code === 'NotAuthorizedException') {
                setCurrentPasswordError(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#19211C] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-[#150089] dark:text-white flex items-center gap-2">
                        <LockIcon className="w-5 h-5 text-[#1ED36A]" />
                        {isSuccess ? "Success!" : "Change Password"}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="p-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-[#1ED36A]/10 rounded-full flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#1ED36A] flex items-center justify-center shadow-lg shadow-[#1ED36A]/50">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Password Updated!</h4>
                            <p className="text-gray-500 dark:text-gray-400 max-w-[240px] mx-auto text-sm">
                                Your password has been changed successfully. You can now use your new password to log in.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-[#1ED36A] hover:bg-[#1bbd5e] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#1ED36A]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Back to Profile
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    required
                                    value={formData.oldPassword}
                                    onChange={(e) => {
                                        setFormData({ ...formData, oldPassword: e.target.value });
                                        setCurrentPasswordError(false);
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl border bg-transparent dark:text-white focus:outline-none focus:ring-2 transition-all pr-12 ${
                                        currentPasswordError 
                                            ? 'border-red-500 focus:ring-red-500/50' 
                                            : 'border-gray-200 dark:border-white/10 focus:ring-[#1ED36A]/50'
                                    }`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showOldPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            {currentPasswordError && (
                                <p className="text-[11px] text-red-500 font-medium mt-1 animate-in fade-in slide-in-from-top-1 duration-200">Wrong password</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    value={formData.newPassword}
                                    onChange={(e) => {
                                        setFormData({ ...formData, newPassword: e.target.value });
                                        if (e.target.value.length > 0) {
                                            setShowSecurityChecks(true);
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1ED36A]/50 transition-all pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1ED36A]/50 transition-all pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements Checklist */}
                        {showSecurityChecks && (
                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Security Requirements</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                {[
                                    { label: '8+ Characters', met: formData.newPassword.length >= 8 },
                                    { label: 'Uppercase', met: /[A-Z]/.test(formData.newPassword) },
                                    { label: 'Lowercase', met: /[a-z]/.test(formData.newPassword) },
                                    { label: 'Number', met: /[0-9]/.test(formData.newPassword) },
                                    { label: 'Special Char', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) },
                                    { label: 'Passwords Match', met: formData.newPassword === formData.confirmPassword && formData.newPassword !== '' },
                                ].map((req, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${req.met ? 'bg-[#1ED36A]' : 'bg-gray-300 dark:bg-white/10'}`}>
                                            {req.met && <div className="w-1.5 h-1.5 border-r border-b border-white rotate-45 -mt-0.5"></div>}
                                        </div>
                                        <span className={`text-[11px] ${req.met ? 'text-[#1ED36A] font-medium' : 'text-gray-500'}`}>{req.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !(
                                    formData.oldPassword.length > 0 &&
                                    formData.newPassword.length >= 8 &&
                                    /[A-Z]/.test(formData.newPassword) &&
                                    /[a-z]/.test(formData.newPassword) &&
                                    /[0-9]/.test(formData.newPassword) &&
                                    /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) &&
                                    formData.newPassword === formData.confirmPassword &&
                                    formData.newPassword !== ''
                                )}
                                className="flex-[2] bg-[#1ED36A] hover:bg-[#1bbd5e] disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Update Password"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
