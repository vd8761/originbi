"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";

// --- Form Input ---
const FormField = ({ label, value, onChange, type = "text", placeholder, disabled = false }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean;
}) => (
    <div className="space-y-2">
        <label className="text-[clamp(11px,0.73vw,13px)] text-[#19211C] dark:text-white font-normal block opacity-70">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] dark:bg-white/5 border border-[#E0E0E0] dark:border-white/10 text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white font-medium placeholder:text-[#19211C]/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#1ED36A]/30 focus:border-[#1ED36A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
    </div>
);

// --- Main Component ---
const AffiliateSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'payout' | 'security'>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [affiliateId, setAffiliateId] = useState<string | null>(null);

    // Profile
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [address, setAddress] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [commissionPercentage, setCommissionPercentage] = useState(0);

    // Payout
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [branchName, setBranchName] = useState('');
    const [upiId, setUpiId] = useState('');
    const [upiNumber, setUpiNumber] = useState('');

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [saveMessage, setSaveMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('affiliate_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                // user.id IS the affiliate_accounts.id (stored by LoginForm)
                const affId = user.id;
                if (affId) {
                    setAffiliateId(affId);
                    loadProfile(affId);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch {
            setLoading(false);
        }
    }, []);

    const loadProfile = async (affId: string) => {
        setLoading(true);
        try {
            const res = await api.get('/affiliates/portal/profile', { params: { affiliateId: affId } });
            const d = res.data;
            setFullName(d.name || '');
            setEmail(d.email || '');
            setPhone(d.mobile_number || '');
            setCountryCode(d.country_code || '+91');
            setAddress(d.address || '');
            setReferralCode(d.referral_code || '');
            setCommissionPercentage(d.commission_percentage || 0);

            // Payout
            setBankName(d.banking_name || '');
            setAccountNumber(d.account_number || '');
            setIfsc(d.ifsc_code || '');
            setBranchName(d.branch_name || '');
            setUpiId(d.upi_id || '');
            setUpiNumber(d.upi_number || '');
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (msg: string) => {
        setSaveMessage(msg);
        setErrorMessage('');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setSaveMessage('');
        setTimeout(() => setErrorMessage(''), 4000);
    };

    const handleSaveProfile = async () => {
        if (!affiliateId) return;
        setSaving(true);
        try {
            await api.put('/affiliates/portal/profile', {
                name: fullName,
                mobileNumber: phone,
                countryCode,
                address,
            }, { params: { affiliateId } });
            showSuccess('Profile saved successfully!');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePayout = async () => {
        if (!affiliateId) return;
        setSaving(true);
        try {
            await api.put('/affiliates/portal/payout', {
                bankingName: bankName,
                accountNumber,
                ifscCode: ifsc,
                branchName,
                upiId,
                upiNumber,
            }, { params: { affiliateId } });
            showSuccess('Payout settings saved successfully!');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to save payout settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!affiliateId) return;
        if (newPassword !== confirmPassword) {
            showError('New passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }
        setSaving(true);
        try {
            await api.post('/affiliates/portal/change-password', {
                currentPassword,
                newPassword,
            }, { params: { affiliateId } });
            showSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen font-['Haskoy']">
                <div className="text-[#19211C] dark:text-white opacity-60 text-lg">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-transparent font-['Haskoy'] transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-[clamp(24px,2vw,36px)] font-bold text-[#150089] dark:text-white leading-tight">Settings</h1>
                <p className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white opacity-80 mt-1 font-normal">Manage your account preferences</p>
            </div>

            {/* Success Toast */}
            {saveMessage && (
                <div className="fixed top-24 right-6 z-50 bg-[#1ED36A] text-white px-6 py-3 rounded-2xl shadow-xl font-semibold text-[clamp(14px,1vw,16px)] flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {saveMessage}
                </div>
            )}

            {/* Error Toast */}
            {errorMessage && (
                <div className="fixed top-24 right-6 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl font-semibold text-[clamp(14px,1vw,16px)] flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    {errorMessage}
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center border-b border-[#E0E0E0] dark:border-white/10 mb-8 overflow-x-auto scrollbar-hide">
                <button onClick={() => setActiveTab('profile')}
                    className={`px-4 py-3 mr-4 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap font-medium ${activeTab === 'profile'
                        ? "border-[#1ED36A] text-[#150089] dark:text-[#1ED36A]"
                        : "border-transparent text-[#19211C] dark:text-white opacity-60 hover:opacity-100"
                        }`}>
                    Profile Information
                </button>
                <button onClick={() => setActiveTab('payout')}
                    className={`px-4 py-3 mr-4 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap font-medium ${activeTab === 'payout'
                        ? "border-[#1ED36A] text-[#150089] dark:text-[#1ED36A]"
                        : "border-transparent text-[#19211C] dark:text-white opacity-60 hover:opacity-100"
                        }`}>
                    Payout Settings
                </button>
                <button onClick={() => setActiveTab('security')}
                    className={`px-4 py-3 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap font-medium ${activeTab === 'security'
                        ? "border-[#1ED36A] text-[#150089] dark:text-[#1ED36A]"
                        : "border-transparent text-[#19211C] dark:text-white opacity-60 hover:opacity-100"
                        }`}>
                    Security
                </button>
            </div>

            {/* Content */}
            <div className="max-w-3xl">
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center gap-6 mb-8">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'A')}&background=150089&color=fff&size=128`}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-[#19211C] shadow-lg"
                            />
                            <div>
                                <h3 className="font-bold text-[clamp(20px,1.5vw,24px)] text-[#19211C] dark:text-white">{fullName || 'Affiliate'}</h3>
                                <p className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white opacity-60 font-normal">
                                    Affiliate Code: {referralCode || 'N/A'} • Commission: {commissionPercentage}%
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Full Name" value={fullName} onChange={setFullName} />
                            <FormField label="Email Address" value={email} onChange={() => { }} type="email" disabled={true} />
                            <FormField label="Phone Number" value={phone} onChange={setPhone} type="tel" />
                            <FormField label="Address" value={address} onChange={setAddress} />
                        </div>

                        <div className="pt-4">
                            <button onClick={handleSaveProfile} disabled={saving}
                                className="px-10 py-3 rounded-full font-medium text-[clamp(14px,1vw,16px)] bg-[#1ED36A] hover:bg-[#16b058] text-white shadow-lg shadow-[#1ED36A]/20 transition-all disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'payout' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Bank Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#150089] dark:text-white mb-4 border-b border-[#E0E0E0] dark:border-white/10 pb-2">
                                Bank Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="Bank Name" value={bankName} onChange={setBankName} />
                                <FormField label="Account Number" value={accountNumber} onChange={setAccountNumber} />
                                <FormField label="IFSC Code" value={ifsc} onChange={setIfsc} />
                                <FormField label="Branch Name" value={branchName} onChange={setBranchName} />
                            </div>
                        </div>

                        {/* UPI Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#150089] dark:text-white mb-4 border-b border-[#E0E0E0] dark:border-white/10 pb-2">
                                UPI Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="UPI ID" value={upiId} onChange={setUpiId} placeholder="yourname@upi" />
                                <FormField label="UPI Number" value={upiNumber} onChange={setUpiNumber} placeholder="Linked mobile number" />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button onClick={handleSavePayout} disabled={saving}
                                className="px-10 py-3 rounded-full font-medium text-[clamp(14px,1vw,16px)] bg-[#1ED36A] hover:bg-[#16b058] text-white shadow-lg shadow-[#1ED36A]/20 transition-all disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Payout Details'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="max-w-md space-y-6">
                            <FormField label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Enter current password" />
                            <FormField label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Enter new password" />
                            <FormField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm new password" />
                        </div>

                        <div className="pt-4">
                            <button onClick={handleChangePassword} disabled={saving}
                                className="px-10 py-3 rounded-full font-medium text-[clamp(14px,1vw,16px)] bg-[#1ED36A] hover:bg-[#16b058] text-white shadow-lg shadow-[#1ED36A]/20 transition-all disabled:opacity-50">
                                {saving ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-12 border-t border-gray-200 dark:border-white/5 pt-6 flex flex-col sm:flex-row justify-between text-[clamp(13px,1vw,15px)] font-medium items-center gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Privacy Policy</span>
                    <span className="h-4 w-px bg-gray-300 dark:bg-white/20"></span>
                    <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Terms &amp; Conditions</span>
                </div>
                <div className="text-[#19211C] dark:text-white">
                    © 2026 Origin BI, Made with ❤️ by <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Touchmark Descience Pvt. Ltd.</span>
                </div>
            </div>
        </div>
    );
};

export default AffiliateSettings;
