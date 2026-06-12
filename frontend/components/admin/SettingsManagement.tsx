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
    WhatsappIcon,
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

interface GeminiModelOption {
    value: string;
    label: string;
    description?: string;
}

type ModelOption = GeminiModelOption;

interface SelectOption {
    value: string;
    label: string;
    description?: string;
}

interface IatRule {
    programIds?: string[];
    departmentDegreeIds?: string[];
    departmentIds?: string[];
    studentBoards?: string[];
    moduleSetId?: string;
}

// A named, reusable collection of IAT modules (iat.module_sets).
interface IatModuleSet {
    id: string;
    name?: string;
    moduleIds?: string[];
}

interface IatRuleConfig {
    rules?: IatRule[];
}

export default function SettingsManagement() {
    const [settingsGrouped, setSettingsGrouped] = useState<Record<string, SettingItem[]>>({});
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [programOptions, setProgramOptions] = useState<SelectOption[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<SelectOption[]>([]);
    const [departmentDegreeOptions, setDepartmentDegreeOptions] = useState<SelectOption[]>([]);
    const [iatModuleOptions, setIatModuleOptions] = useState<SelectOption[]>([]);
    const [iatOptionsLoading, setIatOptionsLoading] = useState(false);
    
    // Track modifications to only save what changed
    const [modifiedSettings, setModifiedSettings] = useState<Record<string, any>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    // Modal state for feature-specific overrides
    const [activeOverrideKey, setActiveOverrideKey] = useState<string | null>(null);
    const [activeMarkdownSkill, setActiveMarkdownSkill] = useState<SettingItem | null>(null);
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
        fetchIatReferenceOptions();
    }, []);

    const fetchIatReferenceOptions = async () => {
        try {
            setIatOptionsLoading(true);
            const [programsRes, departmentsRes, departmentDegreesRes, iatModulesRes] = await Promise.all([
                api.get('/admin/programs?is_active=true'),
                api.get('/admin/departments?is_active=true'),
                api.get('/admin/departments/degrees'),
                api.get('/admin/assessments/iat/modules').catch(() => ({ data: [] })),
            ]);
            const normalizeList = (body: any) => Array.isArray(body) ? body : (body?.data || []);
            const programs = normalizeList(programsRes.data);
            const departments = normalizeList(departmentsRes.data);
            const departmentDegrees = normalizeList(departmentDegreesRes.data);
            const iatModules = normalizeList(iatModulesRes.data);

            setIatModuleOptions(iatModules.map((m: any) => ({
                value: String(m.id),
                label: m.name || m.code || `Module ${m.id}`,
                description: m.code,
            })));

            setProgramOptions(programs.map((program: any) => ({
                value: String(program.id),
                label: program.name || program.code || `Program ${program.id}`,
                description: program.code,
            })));
            setDepartmentOptions(departments.map((department: any) => ({
                value: String(department.id),
                label: department.name || department.short_name || `Department ${department.id}`,
                description: department.short_name,
            })));
            setDepartmentDegreeOptions(departmentDegrees.map((degree: any) => {
                const departmentName = degree.department?.name || degree.department_name || degree.departmentName || degree.department?.shortName;
                const degreeName = degree.degree?.name || degree.degree_name || degree.degreeName || degree.name;
                return {
                    value: String(degree.id),
                    label: [departmentName, degreeName].filter(Boolean).join(' - ') || `Department Degree ${degree.id}`,
                    description: degree.degree?.short_name || degree.degree_short_name || degree.short_name,
                };
            }));
        } catch (error) {
            console.error("Failed to load IAT reference options", error);
        } finally {
            setIatOptionsLoading(false);
        }
    };

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
        if (lowerCat.includes("whatsapp")) return <WhatsappIcon className="w-5 h-5 flex-shrink-0" />;
        if (lowerCat.includes("email")) return <EmailIcon className="w-5 h-5 flex-shrink-0" />;
        if (lowerCat.includes("report")) return <ProfileIcon className="w-5 h-5 flex-shrink-0" />;
        if (lowerCat.includes("system")) return <SettingsIcon className="w-5 h-5 flex-shrink-0" />;
        return <ProfileIcon className="w-5 h-5 flex-shrink-0" />;
    };

    // Render exact input type based on valueType
    const renderInput = (item: SettingItem) => {
        if (item.valueType === 'boolean') {
            return (
                <div className="flex items-center gap-3">
                    <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                            item.value
                                ? 'text-brand-green'
                                : 'text-gray-400 dark:text-gray-500'
                        }`}
                    >
                        {item.value ? 'Enabled' : 'Disabled'}
                    </span>
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
                </div>
            );
        }

        if (item.valueType === 'string' || item.valueType === 'number') {
            if (item.category === 'metaphor' && item.key === 'question_selection_mode') {
                return (
                    <div className="block w-full max-w-lg">
                        <SettingsSelect
                            value={String(item.value || 'random_single_set')}
                            disabled={item.isReadonly}
                            options={[
                                { value: 'random_single_set', label: 'Pick random N questions from a random single set' },
                                { value: 'random_all_sets', label: 'Pick random N questions from all sets' },
                            ]}
                            onChange={(next) => handleValueChange(item.category, item.key, next)}
                        />
                    </div>
                );
            }

            if (item.category === 'metaphor' && item.key === 'gemini_model') {
                return (
                    <GeminiModelSelect
                        value={String(item.value || '')}
                        isReadonly={item.isReadonly}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }

            if ((item.category === 'metaphor' || item.category === 'iat') && item.key === 'claude_report_model') {
                return (
                    <ClaudeModelSelect
                        value={String(item.value || '')}
                        isReadonly={item.isReadonly}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }

            if ((item.category === 'metaphor' || item.category === 'iat') && item.key === 'report_skill_markdown') {
                return (
                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => setActiveMarkdownSkill(item)}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-green/10 px-4 py-2.5 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                        >
                            <ProfileIcon className="h-4 w-4" />
                            Edit / Preview
                        </button>
                    </div>
                );
            }

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
            // Dedicated editor for the open-question distribution setting
            // (array of {questionType, count, selection} rows).
            if (item.category === 'assessment' && item.key === 'open_question_distribution') {
                return (
                    <DistributionEditor
                        value={Array.isArray(item.value) ? item.value : []}
                        isReadonly={item.isReadonly}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }

            // Per-program main-question generation mode (object keyed by
            // program id -> { mode, count }).
            if (item.category === 'assessment' && item.key === 'question_generation_mode') {
                return (
                    <GenerationModeEditor
                        value={item.value && typeof item.value === 'object' && !Array.isArray(item.value) ? item.value : {}}
                        isReadonly={item.isReadonly}
                        programOptions={programOptions}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }

            // Level 3 metaphor: STT provider (object) + supported languages (array of objects)
            if (item.category === 'metaphor' && item.key === 'stt_provider') {
                return (
                    <SttProviderEditor
                        value={item.value && typeof item.value === 'object' ? item.value : { provider: 'web_speech', params: {} }}
                        isReadonly={item.isReadonly}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }
            if (item.category === 'metaphor' && item.key === 'supported_languages') {
                return (
                    <LanguagesEditor
                        value={Array.isArray(item.value) ? item.value : []}
                        isReadonly={item.isReadonly}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }

            if (item.category === 'iat' && item.key === 'level2_replacement_rules') {
                const value = item.value && typeof item.value === 'object' ? item.value : { rules: [] };
                return (
                    <ScopeRulesEditor
                        value={value}
                        isReadonly={item.isReadonly}
                        programOptions={programOptions}
                        departmentOptions={departmentOptions}
                        departmentDegreeOptions={departmentDegreeOptions}
                        loading={iatOptionsLoading}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }

            // IAT Module Sets: named, reusable collections of IAT modules.
            if (item.category === 'iat' && item.key === 'module_sets') {
                return (
                    <ModuleSetsEditor
                        value={Array.isArray(item.value) ? item.value : []}
                        isReadonly={item.isReadonly}
                        moduleOptions={iatModuleOptions}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }

            // Per-level scope rules (category 'levels', key like
            // 'level3_scope_rules'). Reuses the same program/department/board
            // rule editor. For Level 3 (IAT) each rule also picks the IAT
            // Module Set that scope receives — routing lives here, not in a
            // separate setting.
            if (item.category === 'levels' && item.key.endsWith('_scope_rules')) {
                const value = item.value && typeof item.value === 'object' ? item.value : { rules: [] };
                const eyebrow = item.label.replace(/\s*\(scope\)\s*$/i, '') || 'Level';
                const isLevel3 = item.key === 'level3_scope_rules';
                // If this level's enable toggle is OFF, the rules won't take effect.
                const levelNumMatch = item.key.match(/^level(\d+)_scope_rules$/);
                const enabledItem = levelNumMatch
                    ? settingsGrouped['levels']?.find((s) => s.key === `level${levelNumMatch[1]}_enabled`)
                    : undefined;
                const levelDisabled = enabledItem ? enabledItem.value === false : false;
                const disabledWarning = levelDisabled
                    ? `This level is turned off — these rules won't take effect until you enable "${enabledItem!.label || `Level ${levelNumMatch![1]}`}".`
                    : undefined;
                let moduleSetOptions: SelectOption[] | undefined;
                if (isLevel3) {
                    const definedSets: IatModuleSet[] = Array.isArray(
                        settingsGrouped['iat']?.find((s) => s.key === 'module_sets')?.value,
                    )
                        ? settingsGrouped['iat'].find((s) => s.key === 'module_sets')!.value
                        : [];
                    moduleSetOptions = definedSets
                        .filter((s) => s && s.id)
                        .map((s) => ({
                            value: String(s.id),
                            label: s.name || `Set ${s.id}`,
                            description: `${(s.moduleIds || []).length} module(s)`,
                        }));
                }
                return (
                    <ScopeRulesEditor
                        value={value}
                        isReadonly={item.isReadonly}
                        eyebrow={eyebrow}
                        heading="Who receives this level"
                        helpText={isLevel3
                            ? "Empty selections match everyone. For each rule, optionally pick an IAT Module Set — candidates matching that rule receive that set's modules (in the set's order). Modules in no routed set are given to everyone. Define sets first in 'IAT Module Sets'."
                            : "A registration matches when ANY selected condition matches — program, department, department-degree, or board (OR, not AND). Leave all fields empty to apply this level to everyone."}
                        programOptions={programOptions}
                        departmentOptions={departmentOptions}
                        departmentDegreeOptions={departmentDegreeOptions}
                        moduleSetOptions={moduleSetOptions}
                        disabledWarning={disabledWarning}
                        loading={iatOptionsLoading}
                        onChange={(next) => handleValueChange(item.category, item.key, next)}
                    />
                );
            }

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

                                        // Wide editors (e.g. the distribution table) render full-width,
                                        // stacked below the label — not squeezed into the side input column.
                                        // The Claude/Gemini model pickers pair a dropdown with a Refresh
                                        // button, which gets clipped in the narrow side column — give them
                                        // the full-width treatment too.
                                        const isModelSelect = (item.category === 'metaphor' || item.category === 'iat')
                                            && (item.key === 'claude_report_model' || item.key === 'gemini_model');
                                        const isFullWidth = isModelSelect || (item.valueType === 'json'
                                            && (
                                                (item.category === 'assessment' && item.key === 'open_question_distribution')
                                                || (item.category === 'metaphor' && (item.key === 'stt_provider' || item.key === 'supported_languages'))
                                            ));

                                        return (
                                        <div key={item.id} className={`${isFullWidth ? 'flex flex-col gap-4' : 'flex flex-col sm:flex-row sm:items-center justify-between gap-6'} pb-8 border-b border-gray-50 dark:border-white/[0.02] last:border-0 last:pb-0 transition-opacity duration-200 ${isDimmed ? 'opacity-40 pointer-events-none' : ''}`}>
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
                                        <div className={isFullWidth ? 'w-full' : 'mt-2 sm:mt-0 flex-shrink-0 w-full sm:w-auto sm:max-w-[300px]'}>
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

            {activeMarkdownSkill && (
                <MarkdownSkillModal
                    item={settingsGrouped[activeMarkdownSkill.category]?.find((s) => s.key === activeMarkdownSkill.key) || activeMarkdownSkill}
                    onClose={() => setActiveMarkdownSkill(null)}
                    onChange={(next) => handleValueChange(activeMarkdownSkill.category, activeMarkdownSkill.key, next)}
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

function SettingsSelect({
    value,
    options,
    onChange,
    placeholder = 'Select',
    disabled = false,
    size = 'md',
}: {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
}) {
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const selected = options.find((option) => option.value === value);

    const close = () => setOpen(false);

    const updatePosition = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const gap = 6;
        const maxHeight = Math.min(280, Math.max(160, window.innerHeight - rect.bottom - gap - 12));
        const opensUp = maxHeight < 180 && rect.top > window.innerHeight - rect.bottom;
        const usableHeight = opensUp
            ? Math.min(280, Math.max(160, rect.top - gap - 12))
            : maxHeight;

        setMenuStyle({
            position: 'fixed',
            left: rect.left,
            top: opensUp ? undefined : rect.bottom + gap,
            bottom: opensUp ? window.innerHeight - rect.top + gap : undefined,
            width: rect.width,
            maxHeight: usableHeight,
            // Above the rule/module-set modals (z-[10000]/[10020]) so the menu
            // is visible when rendered inside one of them.
            zIndex: 10050,
        });
    };

    useEffect(() => {
        if (!open) return;
        updatePosition();

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
            close();
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };
        const handleViewportChange = () => updatePosition();

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [open]);

    const choose = (next: string) => {
        onChange(next);
        close();
    };

    const padding = size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2.5';

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setOpen((next) => !next);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border-0 bg-gray-50 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:ring-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:ring-white/20 sm:text-sm ${padding} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
                <span className="min-w-0 truncate">
                    {selected?.label || value || placeholder}
                </span>
                <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            {open && ReactDOM.createPortal(
                <div
                    ref={menuRef}
                    style={menuStyle}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#202820] dark:ring-white/10"
                >
                    <div className="max-h-[inherit] overflow-y-auto py-1 custom-scrollbar">
                        {options.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {placeholder}
                            </div>
                        ) : (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => choose(option.value)}
                                    className={`flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                        value === option.value
                                            ? 'bg-brand-green text-white'
                                            : 'text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{option.label}</span>
                                        {option.description && (
                                            <span className={`mt-0.5 block line-clamp-2 text-xs ${
                                                value === option.value ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {option.description}
                                            </span>
                                        )}
                                    </span>
                                    {value === option.value && (
                                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}

// ------------------------------------------------------------------
// Editor for the open-question distribution setting.
// Value shape: [{ questionType: string|null, count: number, selection: 'random'|'set_sequential' }, ...]
// Lives next to ArrayChipInput so we don't proliferate components.
// ------------------------------------------------------------------
interface DistributionRow {
    questionType: string | null;
    count: number;
    selection: 'random' | 'set_random' | 'set_sequential';
}

function DistributionEditor({
    value,
    isReadonly,
    onChange,
}: {
    value: DistributionRow[];
    isReadonly: boolean;
    onChange: (next: DistributionRow[]) => void;
}) {
    const rows: DistributionRow[] = value.map((r) => ({
        questionType: r.questionType ?? null,
        count: Number(r.count) || 0,
        selection:
            r.selection === 'set_sequential'
                ? 'set_sequential'
                : r.selection === 'set_random'
                    ? 'set_random'
                    : 'random',
    }));

    const update = (i: number, patch: Partial<DistributionRow>) => {
        const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
        onChange(next);
    };
    const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
    const add = () =>
        onChange([...rows, { questionType: '', count: 10, selection: 'random' }]);

    const total = rows.reduce((s, r) => s + (Number(r.count) || 0), 0);

    return (
        <div className="w-full max-w-5xl space-y-3">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-gray-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-3 py-2 font-medium w-[40%]">Question Type</th>
                            <th className="px-3 py-2 font-medium w-24">Count</th>
                            <th className="px-3 py-2 font-medium w-64">Selection</th>
                            <th className="px-3 py-2 font-medium w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-gray-400 dark:text-gray-500">
                                    No groups configured. Click "Add group" to pick open questions.
                                </td>
                            </tr>
                        )}
                        {rows.map((row, i) => (
                            <tr key={i} className="bg-white dark:bg-transparent">
                                <td className="px-3 py-2">
                                    <input
                                        type="text"
                                        disabled={isReadonly}
                                        value={row.questionType ?? ''}
                                        onChange={(e) =>
                                            update(i, {
                                                questionType: e.target.value === '' ? null : e.target.value,
                                            })
                                        }
                                        placeholder="e.g. OPEN, SURVEY (blank = any type)"
                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-green"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        min={0}
                                        disabled={isReadonly}
                                        value={row.count}
                                        onChange={(e) => update(i, { count: Number(e.target.value) || 0 })}
                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-green"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <SettingsSelect
                                        value={row.selection}
                                        disabled={isReadonly}
                                        options={[
                                            { value: 'random', label: 'random (N random of type)' },
                                            { value: 'set_random', label: 'set_random (one set, then N random)' },
                                            { value: 'set_sequential', label: 'set_sequential (one set, fixed order)' },
                                        ]}
                                        onChange={(next) =>
                                            update(i, {
                                                selection: next as DistributionRow['selection'],
                                            })
                                        }
                                        size="sm"
                                    />
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <button
                                        type="button"
                                        disabled={isReadonly}
                                        onClick={() => remove(i)}
                                        className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-40"
                                        title="Remove this group"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    disabled={isReadonly}
                    onClick={add}
                    className="rounded-xl bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green/20 transition-colors disabled:opacity-40"
                >
                    + Add group
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Total open questions per assessment: <strong className="text-gray-700 dark:text-gray-200">{total}</strong>
                </span>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Per-program main-question generation mode editor.
// Value shape: { [programId]: { mode, count } }
// ------------------------------------------------------------------
const GENERATION_MODES: SelectOption[] = [
    { value: 'random_set_shuffled', label: 'Random set, shuffled questions' },
    { value: 'random_set_ordered', label: 'Random set, ordered (first N)' },
    { value: 'random_all_sets', label: 'Random N from all sets' },
];

interface GenerationModeConfig {
    mode: string;
    count: number;
}

function GenerationModeEditor({
    value,
    isReadonly,
    programOptions,
    onChange,
}: {
    value: Record<string, GenerationModeConfig>;
    isReadonly: boolean;
    programOptions: SelectOption[];
    onChange: (next: Record<string, GenerationModeConfig>) => void;
}) {
    const DEFAULT: GenerationModeConfig = { mode: 'random_set_shuffled', count: 40 };

    const configFor = (programId: string): GenerationModeConfig => {
        const cfg = value?.[programId];
        return {
            mode: cfg?.mode || DEFAULT.mode,
            count: Number(cfg?.count) > 0 ? Number(cfg.count) : DEFAULT.count,
        };
    };

    const update = (programId: string, patch: Partial<GenerationModeConfig>) => {
        const current = configFor(programId);
        onChange({ ...value, [programId]: { ...current, ...patch } });
    };

    return (
        <div className="w-full max-w-5xl space-y-3">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-gray-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-3 py-2 font-medium w-[35%]">Program</th>
                            <th className="px-3 py-2 font-medium w-72">Generation Mode</th>
                            <th className="px-3 py-2 font-medium w-28">Count</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {programOptions.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-3 py-4 text-center text-gray-400 dark:text-gray-500">
                                    No programs found.
                                </td>
                            </tr>
                        )}
                        {programOptions.map((program) => {
                            const cfg = configFor(program.value);
                            return (
                                <tr key={program.value} className="bg-white dark:bg-transparent">
                                    <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                                        {program.label}
                                        {program.description && (
                                            <span className="ml-1 text-xs text-gray-400">({program.description})</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <SettingsSelect
                                            value={cfg.mode}
                                            disabled={isReadonly}
                                            options={GENERATION_MODES}
                                            onChange={(next) => update(program.value, { mode: next })}
                                            size="sm"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            min={1}
                                            disabled={isReadonly}
                                            value={cfg.count}
                                            onChange={(e) => update(program.value, { count: Number(e.target.value) || 1 })}
                                            className="w-full rounded-lg border-0 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-green"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                For the Employee program, the candidate's Level (Entry/Medium/Executive) further filters which question sets are eligible. Programs left at "Random set, shuffled" with count 40 keep the legacy behaviour.
            </p>
        </div>
    );
}

// ------------------------------------------------------------------
// Level 3 metaphor — STT provider editor (object: {provider, params})
// ------------------------------------------------------------------
const STT_PROVIDERS = [
    { value: 'web_speech', label: 'Browser Web Speech (free, Chrome/Edge)' },
    { value: 'elevenlabs', label: 'ElevenLabs (realtime, cloud)' },
    { value: 'azure', label: 'Azure Speech (cloud)' },
    { value: 'google', label: 'Google STT (cloud)' },
    { value: 'deepgram', label: 'Deepgram (cloud)' },
];

function SttProviderEditor({
    value,
    isReadonly,
    onChange,
}: {
    value: { provider?: string; params?: any };
    isReadonly: boolean;
    onChange: (next: { provider: string; params: any }) => void;
}) {
    const provider = value?.provider || 'web_speech';
    return (
        <div className="w-full max-w-lg space-y-2">
            <SettingsSelect
                value={provider}
                disabled={isReadonly}
                options={STT_PROVIDERS}
                onChange={(next) => onChange({ provider: next, params: value?.params || {} })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Cloud providers also require the API key in “STT provider API key” above. The exam page reads this and uses the matching adapter.
            </p>
        </div>
    );
}

// ------------------------------------------------------------------
// Level 3 metaphor — supported languages editor (array of {code,label,native})
// ------------------------------------------------------------------
function GeminiModelSelect({
    value,
    isReadonly,
    onChange,
}: {
    value: string;
    isReadonly: boolean;
    onChange: (next: string) => void;
}) {
    const [models, setModels] = useState<GeminiModelOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchModels = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get('/settings/metaphor/gemini-models');
            setModels(Array.isArray(data.models) ? data.models : []);
            setError(data.error || null);
        } catch (err: any) {
            setModels([]);
            setError(err.response?.data?.message || 'Failed to fetch Gemini models.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchModels();
    }, []);

    const options = [...models];
    if (value && !options.some((model) => model.value === value)) {
        options.unshift({ value, label: `${value} (current)` });
    }

    return (
        <div className="w-full max-w-lg space-y-2">
            <div className="flex gap-2">
                <SettingsSelect
                    value={value}
                    disabled={isReadonly || loading || options.length === 0}
                    options={options}
                    placeholder="No Gemini models available"
                    onChange={onChange}
                />
                <button
                    type="button"
                    disabled={isReadonly || loading}
                    onClick={() => void fetchModels()}
                    className="rounded-xl bg-brand-green/10 px-4 py-2.5 text-sm font-medium text-brand-green hover:bg-brand-green/20 transition-colors disabled:opacity-40"
                >
                    {loading ? 'Loading' : 'Refresh'}
                </button>
            </div>
            {error && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function ClaudeModelSelect({
    value,
    isReadonly,
    onChange,
}: {
    value: string;
    isReadonly: boolean;
    onChange: (next: string) => void;
}) {
    const [models, setModels] = useState<ModelOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchModels = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get('/settings/metaphor/claude-models');
            setModels(Array.isArray(data.models) ? data.models : []);
            setError(data.error || null);
        } catch (err: any) {
            setModels([]);
            setError(err.response?.data?.message || 'Failed to fetch Claude models.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchModels();
    }, []);

    const options = [...models];
    if (value && !options.some((model) => model.value === value)) {
        options.unshift({ value, label: `${value} (current)` });
    }

    return (
        <div className="w-full max-w-lg space-y-2">
            <div className="flex gap-2">
                <SettingsSelect
                    value={value}
                    disabled={isReadonly || loading || options.length === 0}
                    options={options}
                    placeholder="No Claude models available"
                    onChange={onChange}
                />
                <button
                    type="button"
                    disabled={isReadonly || loading}
                    onClick={() => void fetchModels()}
                    className="rounded-xl bg-brand-green/10 px-4 py-2.5 text-sm font-medium text-brand-green hover:bg-brand-green/20 transition-colors disabled:opacity-40"
                >
                    {loading ? 'Loading' : 'Refresh'}
                </button>
            </div>
            {error && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function MarkdownSkillModal({
    item,
    onClose,
    onChange,
}: {
    item: SettingItem;
    onClose: () => void;
    onChange: (next: string) => void;
}) {
    const [tab, setTab] = useState<'edit' | 'preview'>('edit');
    const value = String(item.value || '');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onMouseDown={onClose}>
            <div
                className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#19211C]"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 dark:border-white/10 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{item.label}</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-white/5">
                            {(['edit', 'preview'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setTab(mode)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                                        tab === mode
                                            ? 'bg-white text-gray-900 shadow-sm dark:bg-[#273127] dark:text-white'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    {tab === 'edit' ? (
                        <textarea
                            disabled={item.isReadonly}
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            className={`min-h-[58vh] w-full resize-y rounded-xl border-0 bg-gray-50 px-4 py-3 font-mono text-sm leading-6 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green dark:bg-white/5 dark:text-white dark:ring-white/10 ${item.isReadonly ? 'cursor-not-allowed opacity-60' : 'hover:ring-gray-300 dark:hover:ring-white/20'}`}
                        />
                    ) : (
                        <MarkdownPreview markdown={value} />
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}

const MarkdownPreview = ({ markdown }: { markdown: string }) => {
    const lines = markdown.split(/\r?\n/);
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700 dark:border-white/10 dark:bg-black/10 dark:text-gray-200">
            <div className="space-y-3">
                {lines.map((raw, index) => {
                    const line = raw.trim();
                    if (!line) return <div key={index} className="h-1" />;
                    if (/^-{3,}$/.test(line)) return <div key={index} className="my-4 border-t border-gray-200 dark:border-white/10" />;
                    if (line.startsWith('### ')) return <h4 key={index} className="pt-2 text-sm font-semibold text-gray-900 dark:text-white">{line.slice(4)}</h4>;
                    if (line.startsWith('## ')) return <h3 key={index} className="pt-3 text-base font-semibold text-[#150089] dark:text-white">{line.slice(3)}</h3>;
                    if (line.startsWith('# ')) return <h2 key={index} className="text-lg font-semibold text-[#150089] dark:text-white">{line.slice(2)}</h2>;
                    const ordered = line.match(/^(\d+)\.\s+(.*)$/);
                    if (ordered) {
                        return (
                            <div key={index} className="flex gap-3">
                                <span className="w-5 font-semibold text-brand-green">{ordered[1]}.</span>
                                <p className="leading-6">{ordered[2]}</p>
                            </div>
                        );
                    }
                    if (line.startsWith('- ')) {
                        return (
                            <div key={index} className="flex gap-3">
                                <span className="text-brand-green">-</span>
                                <p className="leading-6">{line.slice(2)}</p>
                            </div>
                        );
                    }
                    return <p key={index} className="whitespace-pre-wrap leading-6">{line}</p>;
                })}
            </div>
        </div>
    );
};

const SCHOOL_BOARD_OPTIONS: SelectOption[] = [
    { value: 'CBSE', label: 'CBSE' },
    { value: 'ICSE', label: 'ICSE' },
    { value: 'State Board', label: 'State Board' },
    { value: 'IB', label: 'IB' },
    { value: 'IGCSE', label: 'IGCSE' },
    { value: 'Other', label: 'Other' },
];

function ScopeRulesEditor({
    value,
    isReadonly,
    programOptions,
    departmentOptions,
    departmentDegreeOptions,
    moduleSetOptions,
    loading,
    onChange,
    eyebrow = 'IAT Gen',
    heading = 'Level 2 replacement routing',
    helpText = 'A student matches when ANY selected condition matches — program, department, department-degree, or board (OR, not AND). Leave all fields empty to match everyone.',
    disabledWarning,
}: {
    value: IatRuleConfig;
    isReadonly: boolean;
    programOptions: SelectOption[];
    departmentOptions: SelectOption[];
    departmentDegreeOptions: SelectOption[];
    moduleSetOptions?: SelectOption[];
    loading: boolean;
    onChange: (next: IatRuleConfig) => void;
    eyebrow?: string;
    heading?: string;
    helpText?: string;
    // When set, this level's enable toggle is OFF — the rules won't take effect.
    disabledWarning?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const rules = Array.isArray(value?.rules) ? value.rules : [];
    const showSets = Array.isArray(moduleSetOptions);

    const normalizeRule = (rule: IatRule): IatRule => ({
        programIds: (rule.programIds || []).map(String),
        departmentDegreeIds: (rule.departmentDegreeIds || []).map(String),
        departmentIds: (rule.departmentIds || []).map(String),
        studentBoards: (rule.studentBoards || []).map(String),
        ...(showSets ? { moduleSetId: rule.moduleSetId ? String(rule.moduleSetId) : '' } : {}),
    });

    const updateRule = (index: number, patch: Partial<IatRule>) => {
        const nextRules = rules.map((rule, idx) =>
            idx === index ? { ...normalizeRule(rule), ...patch } : normalizeRule(rule),
        );
        onChange({ rules: nextRules });
    };

    const addRule = () => {
        onChange({
            rules: [
                ...rules.map(normalizeRule),
                { programIds: [], departmentDegreeIds: [], departmentIds: [], studentBoards: [], ...(showSets ? { moduleSetId: '' } : {}) },
            ],
        });
    };

    const removeRule = (index: number) => {
        onChange({ rules: rules.filter((_, idx) => idx !== index).map(normalizeRule) });
    };

    const editor = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onMouseDown={() => setIsOpen(false)}>
            <div
                className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#19211C]"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 dark:border-white/10 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">{eyebrow}</p>
                        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{heading}</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                            {helpText}
                        </p>
                        {disabledWarning && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                                <span aria-hidden>⚠</span>
                                <span>{disabledWarning}</span>
                            </div>
                        )}
                        {loading && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading program and department options...</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={isReadonly}
                            onClick={addRule}
                            className="rounded-xl bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green/20 disabled:opacity-40"
                        >
                            Add rule
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    {rules.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                            No scope rules configured — applies to everyone.
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {rules.map((rawRule, index) => {
                                const rule = normalizeRule(rawRule);
                                return (
                                    <div key={index} className="rounded-xl border border-gray-200 p-5 dark:border-white/10">
                                        <div className="mb-5 flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Rule {index + 1}</p>
                                            <button
                                                type="button"
                                                disabled={isReadonly}
                                                onClick={() => removeRule(index)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            <MultiCheckboxGroup
                                                label="Programs"
                                                emptyLabel="All programs"
                                                values={rule.programIds || []}
                                                options={programOptions}
                                                disabled={isReadonly}
                                                onChange={(next) => updateRule(index, { programIds: next })}
                                            />
                                            <MultiCheckboxGroup
                                                label="Department / Degree"
                                                emptyLabel="All department-degree rows"
                                                values={rule.departmentDegreeIds || []}
                                                options={departmentDegreeOptions}
                                                disabled={isReadonly}
                                                onChange={(next) => updateRule(index, { departmentDegreeIds: next })}
                                            />
                                            <MultiCheckboxGroup
                                                label="Departments"
                                                emptyLabel="All departments"
                                                values={rule.departmentIds || []}
                                                options={departmentOptions}
                                                disabled={isReadonly}
                                                onChange={(next) => updateRule(index, { departmentIds: next })}
                                            />
                                            <MultiCheckboxGroup
                                                label="Boards"
                                                emptyLabel="All boards"
                                                values={rule.studentBoards || []}
                                                options={SCHOOL_BOARD_OPTIONS}
                                                disabled={isReadonly}
                                                onChange={(next) => updateRule(index, { studentBoards: next })}
                                            />
                                            {showSets && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Module Set</p>
                                                    <SettingsSelect
                                                        value={rule.moduleSetId || ''}
                                                        disabled={isReadonly}
                                                        placeholder="Select a module set"
                                                        options={[{ value: '', label: 'None' }, ...(moduleSetOptions || [])]}
                                                        onChange={(next) => updateRule(index, { moduleSetId: next })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-4 dark:border-white/10">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Close this popup, then use Save Changes to persist the setting.</p>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl bg-brand-green px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-start gap-2">
            <button
                type="button"
                disabled={isReadonly}
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-green/10 px-4 py-2.5 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-green/40 disabled:opacity-40"
            >
                Configure rules
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {rules.length === 0 ? 'No rules configured' : `${rules.length} rule${rules.length === 1 ? '' : 's'} configured`}
            </p>
            {disabledWarning && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">⚠ {disabledWarning}</p>
            )}
            {isOpen ? ReactDOM.createPortal(editor, document.body) : null}
        </div>
    );
}

// Editor for iat.module_sets — named, reusable collections of IAT modules.
// A module belongs to AT MOST ONE set: modules already used by another set are
// hidden from this set's picker. Module selection happens in a modal.
function ModuleSetsEditor({
    value,
    isReadonly,
    moduleOptions,
    onChange,
}: {
    value: IatModuleSet[];
    isReadonly: boolean;
    moduleOptions: SelectOption[];
    onChange: (next: IatModuleSet[]) => void;
}) {
    const sets: IatModuleSet[] = Array.isArray(value) ? value : [];
    const [isOpen, setIsOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const newId = () => {
        try {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        } catch { /* ignore */ }
        return `set_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    };

    const update = (i: number, patch: Partial<IatModuleSet>) =>
        onChange(sets.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    const remove = (i: number) => onChange(sets.filter((_, idx) => idx !== i));
    const add = () => onChange([...sets, { id: newId(), name: '', moduleIds: [] }]);

    const labelFor = (id: string) =>
        moduleOptions.find((o) => String(o.value) === String(id))?.label || `Module ${id}`;

    // Module ids claimed by sets OTHER than `exceptIndex`.
    const usedByOtherSets = (exceptIndex: number) => {
        const used = new Set<string>();
        sets.forEach((s, idx) => {
            if (idx === exceptIndex) return;
            (s.moduleIds || []).forEach((m) => used.add(String(m)));
        });
        return used;
    };

    const toggleModule = (setIndex: number, moduleId: string) => {
        const current = (sets[setIndex].moduleIds || []).map(String);
        const next = current.includes(moduleId)
            ? current.filter((x) => x !== moduleId)
            : [...current, moduleId];
        update(setIndex, { moduleIds: next });
    };

    const closeModal = () => { setEditingIndex(null); setSearch(''); };

    const editingSet = editingIndex != null ? sets[editingIndex] : null;
    const selectedInEditing = new Set((editingSet?.moduleIds || []).map(String));
    const availableForEditing = editingIndex == null
        ? []
        : moduleOptions
            .filter((o) => !usedByOtherSets(editingIndex).has(String(o.value)))
            .filter((o) => !search.trim() ||
                o.label.toLowerCase().includes(search.trim().toLowerCase()) ||
                (o.description || '').toLowerCase().includes(search.trim().toLowerCase()));

    const modal = editingIndex != null && editingSet ? (
        <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onMouseDown={closeModal}>
            <div
                className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#19211C]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="border-b border-gray-200 px-6 py-4 dark:border-white/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Module Set</p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        Select modules — {editingSet.name || 'Untitled set'}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {selectedInEditing.size} selected. Modules already used by another set are not shown.
                    </p>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search modules…"
                        className="mt-3 w-full rounded-lg border-0 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-green"
                    />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {availableForEditing.length === 0 ? (
                        <p className="px-2 py-8 text-center text-sm text-gray-400">
                            {moduleOptions.length === 0 ? 'No IAT modules available.' : 'No modules match — others may be assigned to different sets.'}
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {availableForEditing.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    <input
                                        type="checkbox"
                                        disabled={isReadonly}
                                        checked={selectedInEditing.has(String(option.value))}
                                        onChange={() => toggleModule(editingIndex, String(option.value))}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green disabled:opacity-40"
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate text-gray-800 dark:text-gray-100">{option.label}</span>
                                        {option.description && (
                                            <span className="block truncate text-xs text-gray-400">{option.description}</span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-white/10">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-xl bg-brand-green px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    const setsList = (
        <div className="space-y-4">
            {sets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                    No module sets yet. Add one, then assign it to scopes in "IAT Module Routing".
                </div>
            ) : (
                <div className="space-y-4">
                    {sets.map((set, i) => {
                        const ids = (set.moduleIds || []).map(String);
                        return (
                            <div key={set.id || i} className="rounded-xl border border-gray-200 p-5 dark:border-white/10">
                                <div className="mb-4 flex items-end justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Set name</p>
                                        <input
                                            type="text"
                                            disabled={isReadonly}
                                            value={set.name || ''}
                                            onChange={(e) => update(i, { name: e.target.value })}
                                            placeholder="e.g. Core Bias"
                                            className="w-full max-w-sm rounded-lg border-0 bg-gray-50 dark:bg-white/5 px-3 py-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-green"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isReadonly}
                                        onClick={() => remove(i)}
                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Modules in this set ({ids.length})
                                    </p>
                                    <button
                                        type="button"
                                        disabled={isReadonly}
                                        onClick={() => { setSearch(''); setEditingIndex(i); }}
                                        className="rounded-lg bg-brand-green/10 px-3 py-1.5 text-xs font-medium text-brand-green transition-colors hover:bg-brand-green/20 disabled:opacity-40"
                                    >
                                        {ids.length === 0 ? 'Select modules' : 'Edit modules'}
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {ids.length === 0 ? (
                                        <span className="text-xs text-gray-400">No modules selected.</span>
                                    ) : (
                                        ids.map((id) => (
                                            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-white/10 dark:text-gray-200">
                                                {labelFor(id)}
                                                {!isReadonly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleModule(i, id)}
                                                        className="text-gray-400 hover:text-red-500"
                                                        aria-label="Remove module"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <button
                type="button"
                disabled={isReadonly}
                onClick={add}
                className="rounded-xl bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green/20 disabled:opacity-40"
            >
                + Add module set
            </button>
        </div>
    );

    const totalModules = sets.reduce((n, s) => n + (s.moduleIds || []).length, 0);

    const setsModal = isOpen ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onMouseDown={() => setIsOpen(false)}>
            <div
                className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#19211C]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-white/10">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">IAT Gen</p>
                        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">IAT Module Sets</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                            Named, reusable collections of IAT modules. A module belongs to at most one set. Assign sets to scopes in "IAT Module Routing".
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        Close
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-6">{setsList}</div>
                <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-4 dark:border-white/10">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Close this popup, then use Save Changes to persist the setting.</p>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl bg-brand-green px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className="flex flex-col items-start gap-2">
            <button
                type="button"
                disabled={isReadonly}
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-green/10 px-4 py-2.5 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-green/40 disabled:opacity-40"
            >
                Configure module sets
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {sets.length === 0 ? 'No sets configured' : `${sets.length} set${sets.length === 1 ? '' : 's'}, ${totalModules} module${totalModules === 1 ? '' : 's'}`}
            </p>
            {setsModal ? ReactDOM.createPortal(setsModal, document.body) : null}
            {modal ? ReactDOM.createPortal(modal, document.body) : null}
        </div>
    );
}

function MultiCheckboxGroup({
    label,
    emptyLabel,
    values,
    options,
    disabled,
    onChange,
}: {
    label: string;
    emptyLabel: string;
    values: string[];
    options: SelectOption[];
    disabled?: boolean;
    onChange: (next: string[]) => void;
}) {
    const selected = new Set(values.map(String));
    const toggle = (value: string) => {
        if (selected.has(value)) {
            onChange(values.filter((item) => String(item) !== value));
        } else {
            onChange([...values, value]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                <button
                    type="button"
                    disabled={disabled || values.length === 0}
                    onClick={() => onChange([])}
                    className="text-xs font-medium text-brand-green disabled:text-gray-400"
                >
                    {values.length === 0 ? emptyLabel : 'Clear'}
                </button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-black/10">
                {options.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-gray-400">No options available.</p>
                ) : (
                    <div className="space-y-1">
                        {options.map((option) => (
                            <label
                                key={option.value}
                                className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <input
                                    type="checkbox"
                                    disabled={disabled}
                                    checked={selected.has(option.value)}
                                    onChange={() => toggle(option.value)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green disabled:opacity-40"
                                />
                                <span className="min-w-0">
                                    <span className="block truncate text-gray-800 dark:text-gray-100">{option.label}</span>
                                    {option.description && (
                                        <span className="block truncate text-xs text-gray-400">{option.description}</span>
                                    )}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface LangRow { code: string; label: string; native: string }

function LanguagesEditor({
    value,
    isReadonly,
    onChange,
}: {
    value: LangRow[];
    isReadonly: boolean;
    onChange: (next: LangRow[]) => void;
}) {
    const rows: LangRow[] = value.map((r) => ({
        code: r.code || '',
        label: r.label || '',
        native: r.native || '',
    }));
    const update = (i: number, patch: Partial<LangRow>) =>
        onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
    const add = () => onChange([...rows, { code: '', label: '', native: '' }]);

    return (
        <div className="w-full max-w-3xl space-y-3">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                <table className="w-full text-sm min-w-[480px]">
                    <thead className="bg-gray-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-3 py-2 font-medium w-40">Code (BCP-47)</th>
                            <th className="px-3 py-2 font-medium">Label</th>
                            <th className="px-3 py-2 font-medium">Native</th>
                            <th className="px-3 py-2 font-medium w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {rows.length === 0 && (
                            <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400">No languages configured.</td></tr>
                        )}
                        {rows.map((row, i) => (
                            <tr key={i}>
                                <td className="px-3 py-2">
                                    <input type="text" disabled={isReadonly} value={row.code} placeholder="en-IN"
                                        onChange={(e) => update(i, { code: e.target.value })}
                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-green" />
                                </td>
                                <td className="px-3 py-2">
                                    <input type="text" disabled={isReadonly} value={row.label} placeholder="English"
                                        onChange={(e) => update(i, { label: e.target.value })}
                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-green" />
                                </td>
                                <td className="px-3 py-2">
                                    <input type="text" disabled={isReadonly} value={row.native} placeholder="English"
                                        onChange={(e) => update(i, { native: e.target.value })}
                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-green" />
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <button type="button" disabled={isReadonly} onClick={() => remove(i)}
                                        className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-40">Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button type="button" disabled={isReadonly} onClick={add}
                className="rounded-xl bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green/20 transition-colors disabled:opacity-40">+ Add language</button>
        </div>
    );
}
