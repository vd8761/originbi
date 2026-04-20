"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { api } from "../../lib/api";
import { 
    CheckCircleIcon,
    SettingsIcon,
    EmailIcon,
    ProfileIcon,
    EyeIcon,
    EyeOffIcon,
} from "../icons";

// Type definitions matching backend OriginbiSetting
interface SettingItem {
    id: number;
    category: string;
    key: string;
    valueType: 'string' | 'boolean' | 'json' | 'number';
    value: any;
    label: string;
    description: string;
    isSensitive: boolean;
    isReadonly: boolean;
    displayOrder: number;
    updatedBy: string;
    updatedAt: string;
}

export default function SettingsManagement() {
    const [settingsGrouped, setSettingsGrouped] = useState<Record<string, SettingItem[]>>({});
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Track modifications to only save what changed
    const [modifiedSettings, setModifiedSettings] = useState<Record<string, any>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    // Modal state for feature-specific overrides
    const [activeOverrideKey, setActiveOverrideKey] = useState<string | null>(null);
    const [visibleSensitiveFields, setVisibleSensitiveFields] = useState<Record<string, boolean>>({});

    const toggleToConfigMap: Record<string, string> = {
        'send_registration_email': 'registration_email_config',
        'send_report_email': 'report_email_config',
        'send_corporate_welcome_email': 'corporate_welcome_email_config',
        'send_affiliate_email': 'affiliate_email_config',
    };

    // Setup initial fetch
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const { data } = await api.get('/settings');
            
            // "2 way option" implementation for Affiliate Email configuration
            if (!data['affiliate']) data['affiliate'] = [];
            const affiliateEmailSetting = data['email']?.find((s: SettingItem) => s.key === 'send_affiliate_email');
            
            if (affiliateEmailSetting) {
                // Ensure the exact original category is retained to save correctly to backend
                data['affiliate'].push({ ...affiliateEmailSetting, originalCategory: 'email' });
                
                // If there's an override config modal button, copy it too
                const overrideKey = toggleToConfigMap['send_affiliate_email'];
                const overrideSetting = overrideKey ? data['email']?.find((s: SettingItem) => s.key === overrideKey) : null;
                if (overrideSetting) {
                    data['affiliate'].push({ ...overrideSetting, originalCategory: 'email' });
                }
            }

            // "2 way option" implementation for Report Email settings
            // Show "Send Report Emails" toggle and "Manual Report Email Config" in the Report tab too
            if (!data['report']) data['report'] = [];

            // 1. Send Report Emails toggle + its override config
            const reportEmailToggle = data['email']?.find((s: SettingItem) => s.key === 'send_report_email');
            if (reportEmailToggle) {
                data['report'].push({ ...reportEmailToggle, originalCategory: 'email' });
                const reportOverrideKey = toggleToConfigMap['send_report_email'];
                const reportOverrideSetting = reportOverrideKey ? data['email']?.find((s: SettingItem) => s.key === reportOverrideKey) : null;
                if (reportOverrideSetting) {
                    data['report'].push({ ...reportOverrideSetting, originalCategory: 'email' });
                }
            }

            // 2. Manual Report Email Config (standalone override)
            const manualReportConfig = data['email']?.find((s: SettingItem) => s.key === 'manual_report_email_config');
            if (manualReportConfig) {
                data['report'].push({ ...manualReportConfig, originalCategory: 'email' });
            }
            
            setSettingsGrouped(data);
            
            // Set first category as active by default
            if (Object.keys(data).length > 0 && !activeCategory) {
                setActiveCategory(Object.keys(data)[0]);
            }
            setModifiedSettings({}); // Reset modifications
        } catch (error) {
            console.error("Failed to load settings", error);
            setErrorMessage("Failed to load settings from server.");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const hasModifications = Object.keys(modifiedSettings).length > 0;

    // 1. Prevent Browser Refresh / Close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasModifications) {
                e.preventDefault();
                e.returnValue = ''; // Triggers the browser's default warning dialog
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasModifications]);

    // 2. Prevent Next.js or generic in-app navigation 
    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            if (!hasModifications) return;

            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.href && anchor.target !== '_blank') {
                // Determine if it's actually navigating away from the current path
                const currentUrl = new URL(window.location.href);
                const targetUrl = new URL(anchor.href);

                if (currentUrl.pathname !== targetUrl.pathname) {
                    if (!window.confirm("You have unsaved changes! Are you sure you want to leave this page?")) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            }
        };

        // Use capture phase to intercept the click before Next.js Link handles it
        document.addEventListener('click', handleLinkClick, { capture: true });
        return () => document.removeEventListener('click', handleLinkClick, { capture: true });
    }, [hasModifications]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).hasUnsavedAdminChanges = hasModifications;
        }
        return () => {
             if (typeof window !== 'undefined') {
                 (window as any).hasUnsavedAdminChanges = false;
             }
        }
    }, [hasModifications]);

    const handleSave = async () => {
        const updates = Object.keys(modifiedSettings).map(compoundKey => {
            const [category, key] = compoundKey.split("::");
            return {
                category,
                key,
                value: modifiedSettings[compoundKey]
            };
        });

        if (updates.length === 0) return;

        try {
            setSaving(true);
            setSaveStatus('idle');
            
            await api.patch('/settings/bulk', { updates });
            
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
            
            // Re-fetch to sync exact DB states and reset modifications without flashing UI
            await fetchSettings(false);
        } catch (error: any) {
            console.error("Failed to save settings", error);
            setErrorMessage(error.response?.data?.message || "Failed to save settings.");
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleValueChange = (category: string, key: string, newValue: any) => {
        // If the item had an originalCategory (from our 2-way option logic), use it to save properly!
        let saveCategory = category;
        const currentItem = settingsGrouped[category]?.find(s => s.key === key);
        if (currentItem && (currentItem as any).originalCategory) {
            saveCategory = (currentItem as any).originalCategory;
        }

        const compoundKey = `${saveCategory}::${key}`;
        
        // Update local modified state
        setModifiedSettings(prev => ({
            ...prev,
            [compoundKey]: newValue
        }));
        
        // Update displayed grouped state for real-time UI reflection across any tabs it exists in
        setSettingsGrouped(prev => {
            const newGrouped = { ...prev };
            Object.keys(newGrouped).forEach(cat => {
                const index = newGrouped[cat].findIndex(s => s.key === key);
                if (index !== -1) {
                    newGrouped[cat][index].value = newValue;
                }
            });
            return newGrouped;
        });
    };

    // Helper for category icons
    const getCategoryIcon = (catName: string) => {
        const lowerCat = catName.toLowerCase();
        if (lowerCat.includes("email")) return <EmailIcon className="w-5 h-5 flex-shrink-0" />;
        if (lowerCat.includes("report")) return <ProfileIcon className="w-5 h-5 flex-shrink-0" />;
        if (lowerCat.includes("system")) return <SettingsIcon className="w-5 h-5 flex-shrink-0" />;
        return <ProfileIcon className="w-5 h-5 flex-shrink-0" />;
    };

    // Render exact input type based on valueType
    const renderInput = (item: SettingItem) => {
        if (item.valueType === 'boolean') {
            return (
                <button
                    disabled={item.isReadonly}
                    onClick={() => handleValueChange(item.category, item.key, !item.value)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 ${
                        item.value ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'
                    } ${item.isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            item.value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            );
        }

        if (item.valueType === 'string' || item.valueType === 'number') {
            const fieldId = `${item.category}:${item.key}`;
            const isSensitiveTextField = item.isSensitive && item.valueType === 'string';
            const isVisible = visibleSensitiveFields[fieldId];
            const inputType = item.valueType === 'number'
                ? 'number'
                : isSensitiveTextField && !isVisible
                    ? 'password'
                    : 'text';

            return (
                <div className="relative">
                    <input
                        id={item.key}
                        type={inputType}
                        disabled={item.isReadonly}
                        value={item.value || ''}
                        onChange={(e) => {
                            const val = item.valueType === 'number' ? Number(e.target.value) : e.target.value;
                            handleValueChange(item.category, item.key, val);
                        }}
                        className={`block w-full max-w-lg rounded-xl border-0 py-2.5 px-4 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 transition-all ${isSensitiveTextField ? 'pr-11' : ''} ${item.isReadonly ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-black/20' : 'hover:ring-gray-300 dark:hover:ring-white/20'}`}
                    />
                    {isSensitiveTextField && (
                        <button
                            type="button"
                            onClick={() => setVisibleSensitiveFields((prev) => ({
                                ...prev,
                                [fieldId]: !prev[fieldId],
                            }))}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-brand-green dark:text-gray-500 dark:hover:text-brand-green"
                            aria-label={isVisible ? 'Hide password' : 'Show password'}
                            title={isVisible ? 'Hide password' : 'Show password'}
                        >
                            {isVisible ? (
                                <EyeIcon className="h-5 w-5" />
                            ) : (
                                <EyeOffIcon className="h-5 w-5" />
                            )}
                        </button>
                    )}
                </div>
            );
        }

        if (item.valueType === 'json') {
            if (item.key.endsWith('_config')) {
                const isLocal = item.value && typeof item.value === 'object' && item.value.mode === 'local';
                return (
                    <button 
                        onClick={() => setActiveOverrideKey(item.key)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white dark:bg-white/5 border rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50 ${
                            isLocal 
                                ? 'text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30' 
                                : 'text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10'
                        }`}
                    >
                        <SettingsIcon className={`w-4 h-4 ${isLocal ? 'text-yellow-500 dark:text-yellow-400' : 'text-brand-green'}`} />
                        Configure Overrides
                    </button>
                );
            }

            // For JSON arrays (like cc_addresses)
            const isArray = Array.isArray(item.value);
            
            // Simple Array-Chip editor approach
            return (
                <ArrayChipInput 
                    values={isArray ? item.value : []}
                    isReadonly={item.isReadonly}
                    onChange={(newArr) => handleValueChange(item.category, item.key, newArr)}
                />
            );
        }

        return <span className="text-sm text-gray-500">Unsupported type</span>;
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center min-h-[500px]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green border-t-transparent shadow-[0_0_15px_rgba(30,211,106,0.5)]"></div>
            </div>
        );
    }

    const categories = Object.keys(settingsGrouped);

    return (
        <div className="flex flex-col h-full rounded-2xl w-full max-w-[1600px] mx-auto pt-4 animate-fade-in custom-scrollbar">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-brand-green to-emerald-600 rounded-xl shadow-lg shadow-brand-green/20">
                            <SettingsIcon className="w-6 h-6 text-white" />
                        </div>
                        Global Settings
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                        Manage central platform configurations dynamically. Settings prefixed with a lock are read-only and automatically managed by the system.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Status Feedback */}
                    {saveStatus === 'success' && (
                        <span className="flex items-center text-sm font-medium text-brand-green animate-pulse">
                            <CheckCircleIcon className="w-5 h-5 mr-1.5" />
                            Saved successfully
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-sm font-medium text-red-500">
                            {errorMessage}
                        </span>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={!hasModifications || saving}
                        className={`inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green ${
                            hasModifications && !saving 
                                ? 'bg-brand-green hover:bg-emerald-500 hover:shadow-lg hover:shadow-brand-green/30 hover:-translate-y-0.5' 
                                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-80'
                        }`}
                    >
                        {saving ? (
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : null}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 pb-12 w-full h-full min-h-[600px]">
                {/* Left Sidebar Layout */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 hide-scrollbar" aria-label="Settings Categories">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    if (hasModifications && activeCategory !== category) {
                                        if (!window.confirm("You have unsaved changes in the current tab. Switching tabs will discard them. Proceed?")) {
                                            return;
                                        }
                                        setModifiedSettings({}); // Clear them so they aren't accidentally saved later
                                    }
                                    setActiveCategory(category);
                                }}
                                className={`group flex items-center px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-200 cursor-pointer min-w-max lg:min-w-0 ${
                                    activeCategory === category
                                        ? 'bg-white dark:bg-white/10 text-brand-green dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-white/10'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <span className={`mr-3 transition-colors ${activeCategory === category ? 'text-brand-green' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`}>
                                    {getCategoryIcon(category)}
                                </span>
                                <span className="capitalize text-[15px] font-semibold tracking-wide">
                                    {category}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right Pane (Fields) */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white/60 dark:bg-[#1f2823]/80 backdrop-blur-xl rounded-3xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/5 overflow-hidden border border-white dark:border-white/[0.05]">
                        <div className="px-6 py-8 sm:p-10">
                            <h2 className="text-xl font-bold leading-7 text-gray-900 dark:text-white capitalize mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
                                {activeCategory} Settings
                            </h2>
                            
                            <div className="space-y-10">
                                {settingsGrouped[activeCategory]
                                    ?.filter(item => !Object.values(toggleToConfigMap).includes(item.key))
                                    .map((item) => {
                                        const overrideKey = toggleToConfigMap[item.key];
                                        const overrideItem = overrideKey 
                                            ? settingsGrouped[activeCategory]?.find(s => s.key === overrideKey) 
                                            : null;

                                        // Conditional visibility: dim report_admin_password when report_password_enabled is OFF
                                        const isReportPasswordField = item.key === 'report_admin_password';
                                        const reportPasswordEnabled = isReportPasswordField
                                            ? settingsGrouped[activeCategory]?.find(s => s.key === 'report_password_enabled')?.value
                                            : true;
                                        const isDimmed = isReportPasswordField && !reportPasswordEnabled;

                                        return (
                                        <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-gray-50 dark:border-white/[0.02] last:border-0 last:pb-0 transition-opacity duration-200 ${isDimmed ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="sm:max-w-md">
                                                <label htmlFor={item.key} className="flex items-center text-[15px] font-semibold leading-6 text-gray-900 dark:text-white">
                                                    {item.label}
                                                    {overrideItem && (
                                                        <button 
                                                            onClick={() => setActiveOverrideKey(overrideKey)}
                                                            className={`ml-3 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${
                                                                overrideItem.value && typeof overrideItem.value === 'object' && overrideItem.value.mode === 'local'
                                                                    ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300' 
                                                                    : 'text-gray-400 hover:text-brand-green'
                                                            }`}
                                                            title="Configure specific email overrides"
                                                        >
                                                            <SettingsIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {item.isReadonly && (
                                                        <span className="ml-2 inline-flex items-center rounded-md bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10 dark:ring-white/10">
                                                            Read-only
                                                        </span>
                                                    )}
                                                {item.isSensitive && (
                                                    <span className="ml-2 inline-flex items-center rounded-md bg-red-50 dark:bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10 dark:ring-red-500/20">
                                                        Secret
                                                    </span>
                                                )}
                                            </label>
                                            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                                                {item.description}
                                                {isDimmed && (
                                                    <span className="block mt-1 text-xs text-yellow-600 dark:text-yellow-400">Enable "Report Password Protection" above to configure this.</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="mt-2 sm:mt-0 flex-shrink-0 w-full sm:w-auto sm:max-w-[300px]">
                                            {renderInput(item)}
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for email overrides */}
            {activeOverrideKey && (
                <EmailOverrideModal 
                    isOpen={!!activeOverrideKey}
                    onClose={() => setActiveOverrideKey(null)}
                    configItem={settingsGrouped['email']?.find(s => s.key === activeOverrideKey)}
                    onChange={(newVal: any) => handleValueChange('email', activeOverrideKey as string, newVal)}
                />
            )}
        </div>
    );
}

function EmailOverrideModal({ isOpen, onClose, configItem, onChange }: any) {
    if (!isOpen || !configItem) return null;
    
    // Default safe parsing
    const defaultVal = { mode: 'global', from_address: '', from_name: '', cc_addresses: [], bcc_addresses: [], reply_to_address: '' };
    const value = typeof configItem.value === 'object' && configItem.value ? { ...defaultVal, ...configItem.value } : defaultVal;

    const isLocal = value.mode === 'local';

    const updateField = (field: string, val: any) => {
        onChange({ ...value, [field]: val });
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#1f2823] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-white/10 max-h-[90vh] flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-brand-green" />
                        Custom Specific Configuration
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Configuration Mode</p>
                            <p className="text-xs text-gray-500 mt-1">{isLocal ? 'Using specific local overrides' : 'Using global settings'}</p>
                        </div>
                        <button
                            onClick={() => updateField('mode', isLocal ? 'global' : 'local')}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isLocal ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isLocal ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className={`space-y-4 transition-opacity duration-200 ${!isLocal ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">From Address</label>
                            <input 
                                type="text"
                                placeholder="Leave blank to fallback to global" 
                                value={value.from_address || ''}
                                onChange={(e) => updateField('from_address', e.target.value)}
                                className="block w-full rounded-xl border-0 py-2 px-3 text-sm bg-white dark:bg-white/5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-brand-green"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">From Display Name</label>
                            <input 
                                type="text"
                                placeholder="Leave blank to fallback to global" 
                                value={value.from_name || ''}
                                onChange={(e) => updateField('from_name', e.target.value)}
                                className="block w-full rounded-xl border-0 py-2 px-3 text-sm bg-white dark:bg-white/5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-brand-green"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CC Addresses</label>
                            <p className="text-xs text-gray-500 mb-2">Leave blank to send to 0 CCs. Will entirely overwrite global CCs.</p>
                            <ArrayChipInput 
                                values={Array.isArray(value.cc_addresses) ? value.cc_addresses : []} 
                                isReadonly={!isLocal} 
                                onChange={(arr) => updateField('cc_addresses', arr)} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">BCC Addresses</label>
                            <p className="text-xs text-gray-500 mb-2">Hidden recipients. Leave blank for no BCCs. Will entirely overwrite global BCCs.</p>
                            <ArrayChipInput 
                                values={Array.isArray(value.bcc_addresses) ? value.bcc_addresses : []} 
                                isReadonly={!isLocal} 
                                onChange={(arr) => updateField('bcc_addresses', arr)} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reply-To Address</label>
                            <p className="text-xs text-gray-500 mb-2">Replies will go to this address instead of the From address. Leave blank to use From address.</p>
                            <input 
                                type="text"
                                placeholder="Leave blank to fallback to global" 
                                value={value.reply_to_address || ''}
                                onChange={(e) => updateField('reply_to_address', e.target.value)}
                                className="block w-full rounded-xl border-0 py-2 px-3 text-sm bg-white dark:bg-white/5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-brand-green"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-brand-green hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ------------------------------------------------------------------
// Internal helper component for JSON array of strings (e.g., CC list)
// ------------------------------------------------------------------
function ArrayChipInput({ values, isReadonly, onChange }: { values: string[], isReadonly: boolean, onChange: (arr: string[]) => void }) {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addCurrentValue();
        } else if (e.key === 'Backspace' && inputValue === '' && values.length > 0) {
            // Remove last item on backspace if input is empty
            const newArr = [...values];
            newArr.pop();
            onChange(newArr);
        }
    };

    const addCurrentValue = () => {
        const val = inputValue.trim();
        if (val && !values.includes(val)) {
            onChange([...values, val]);
        }
        setInputValue("");
    };

    const handleRemove = (itemToRemove: string) => {
        if (isReadonly) return;
        onChange(values.filter(v => v !== itemToRemove));
    };

    return (
        <div className={`flex flex-wrap items-center gap-2 p-2 min-h-[44px] w-full max-w-lg rounded-xl border-0 bg-gray-50 dark:bg-white/5 shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 transition-all focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-green ${isReadonly ? 'opacity-60 bg-gray-100 dark:bg-black/20 cursor-not-allowed' : 'hover:ring-gray-300 dark:hover:ring-white/20'}`}>
            {values.map((val, idx) => (
                <span key={idx} className="inline-flex items-center gap-x-1.5 rounded-lg bg-white dark:bg-white/10 px-2.5 py-1 text-sm font-medium text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 transition-all hover:bg-gray-50 dark:hover:bg-white/20">
                    {val}
                    {!isReadonly && (
                        <button
                            type="button"
                            onClick={() => handleRemove(val)}
                            className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-gray-200 dark:hover:bg-white/20 focus:outline-none cursor-pointer"
                        >
                            <span className="sr-only">Remove</span>
                            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 stroke-gray-600 dark:stroke-gray-300 group-hover:stroke-gray-900 dark:group-hover:stroke-white">
                                <path d="M4 4l6 6m0-6l-6 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </span>
            ))}
            {!isReadonly && (
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addCurrentValue}
                    placeholder={values.length === 0 ? "Add email, press Enter" : "Add more..."}
                    className="flex-1 min-w-[120px] border-0 bg-transparent py-1 px-1 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0"
                />
            )}
        </div>
    );
}
