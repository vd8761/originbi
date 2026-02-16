"use client";

import React, { useState } from "react";

// --- Section Card Wrapper ---
const SettingsSection = ({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) => (
    <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 font-['Haskoy'] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#150089]/10 dark:bg-[#1ED36A]/10 flex items-center justify-center">
                {icon}
            </div>
            <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white leading-none">{title}</h3>
        </div>
        {children}
    </div>
);

// --- Form Input (Corporate Style) ---
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
    // Profile
    const [fullName, setFullName] = useState('Jaya Krishna');
    const [email] = useState('jayakrishna@example.com');
    const [phone, setPhone] = useState('+91 98765 43210');
    const [company, setCompany] = useState('OriginBI Partner');

    // Payout
    const [bankName, setBankName] = useState('HDFC Bank');
    const [accountNumber, setAccountNumber] = useState('•••• •••• 4521');
    const [ifsc, setIfsc] = useState('HDFC0001234');
    const [upiId, setUpiId] = useState('affiliate@upi');
    const [payoutMethod, setPayoutMethod] = useState<'bank' | 'upi'>('bank');

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [saveMessage, setSaveMessage] = useState('');

    const handleSave = (section: string) => {
        setSaveMessage(`${section} saved successfully!`);
        setTimeout(() => setSaveMessage(''), 3000);
    };

    return (
        <div className="relative min-h-screen bg-transparent font-['Haskoy'] transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-8">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Profile Section */}
                <SettingsSection
                    title="Profile Information"
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=150089&color=fff&size=80`}
                                alt="Avatar"
                                className="w-16 h-16 rounded-2xl border-2 border-[#E0E0E0] dark:border-white/10"
                            />
                            <div>
                                <p className="font-semibold text-[clamp(16px,1.1vw,20px)] text-[#19211C] dark:text-white">{fullName}</p>
                                <p className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white opacity-60 font-normal">Affiliate ID: AFF_001</p>
                            </div>
                        </div>
                        <FormField label="Full Name" value={fullName} onChange={setFullName} />
                        <FormField label="Email Address" value={email} onChange={() => { }} type="email" disabled={true} />
                        <FormField label="Phone Number" value={phone} onChange={setPhone} type="tel" />
                        <FormField label="Company / Organization" value={company} onChange={setCompany} />
                        <button onClick={() => handleSave('Profile')} className="mt-4 px-10 py-3 rounded-full font-medium text-[clamp(14px,1vw,16px)] bg-[#1ED36A] hover:bg-[#16b058] text-white shadow-lg shadow-[#1ED36A]/20 transition-all">
                            Save Changes
                        </button>
                    </div>
                </SettingsSection>

                {/* Payout Settings */}
                <SettingsSection
                    title="Payout Settings"
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>}
                >
                    <div className="space-y-4">
                        {/* Method Toggle */}
                        <div className="flex gap-2 p-1 bg-[#FAFAFA] dark:bg-white/5 rounded-xl border border-[#E0E0E0] dark:border-white/10">
                            <button onClick={() => setPayoutMethod('bank')} className={`flex-1 py-2.5 rounded-lg text-[clamp(14px,1vw,16px)] font-medium transition-all ${payoutMethod === 'bank' ? 'bg-[#150089] text-white shadow-md' : 'text-[#19211C] dark:text-white opacity-60 hover:opacity-100'}`}>
                                Bank Transfer
                            </button>
                            <button onClick={() => setPayoutMethod('upi')} className={`flex-1 py-2.5 rounded-lg text-[clamp(14px,1vw,16px)] font-medium transition-all ${payoutMethod === 'upi' ? 'bg-[#150089] text-white shadow-md' : 'text-[#19211C] dark:text-white opacity-60 hover:opacity-100'}`}>
                                UPI
                            </button>
                        </div>

                        {payoutMethod === 'bank' ? (
                            <>
                                <FormField label="Bank Name" value={bankName} onChange={setBankName} />
                                <FormField label="Account Number" value={accountNumber} onChange={setAccountNumber} />
                                <FormField label="IFSC Code" value={ifsc} onChange={setIfsc} />
                            </>
                        ) : (
                            <FormField label="UPI ID" value={upiId} onChange={setUpiId} placeholder="yourname@upi" />
                        )}
                        <button onClick={() => handleSave('Payout settings')} className="mt-4 px-10 py-3 rounded-full font-medium text-[clamp(14px,1vw,16px)] bg-[#1ED36A] hover:bg-[#16b058] text-white shadow-lg shadow-[#1ED36A]/20 transition-all">
                            Save Payout Details
                        </button>
                    </div>
                </SettingsSection>

                {/* Security */}
                <SettingsSection
                    title="Security"
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
                >
                    <div className="space-y-4">
                        <FormField label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Enter current password" />
                        <FormField label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Enter new password" />
                        <FormField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm new password" />
                        <button onClick={() => handleSave('Password')} className="mt-4 px-10 py-3 rounded-full font-medium text-[clamp(14px,1vw,16px)] bg-[#1ED36A] hover:bg-[#16b058] text-white shadow-lg shadow-[#1ED36A]/20 transition-all">
                            Update Password
                        </button>
                    </div>
                </SettingsSection>
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
