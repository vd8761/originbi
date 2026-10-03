"use client";

import React, { useState } from "react";
import CorporateIntegrationsConfig from "../../../components/corporate/CorporateIntegrationsConfig";
import ComingSoon from '../../../components/ui/ComingSoon';

type SettingsTab = 'general' | 'integrations' | 'billing' | 'security';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');

    const SettingsIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );

    const tabs = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'integrations', label: 'App Integrations', icon: SettingsIcon },
        { id: 'billing', label: 'Billing & Plans', icon: SettingsIcon },
        { id: 'security', label: 'Security', icon: SettingsIcon },
    ];

    return (
        <div className="h-full flex flex-col md:flex-row bg-gray-50/50 dark:bg-[#121814]">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#19211C] p-4 flex flex-col shrink-0 min-h-screen">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6 px-2">Settings</h1>
                
                <nav className="space-y-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as SettingsTab)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    isActive 
                                    ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-green' : 'text-gray-400 dark:text-gray-500'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'integrations' && <CorporateIntegrationsConfig />}
                {activeTab === 'general' && <ComingSoon title="General Settings" description="Update your company profile and preferences." />}
                {activeTab === 'billing' && <ComingSoon title="Billing & Plans" description="Manage your subscription and invoices." />}
                {activeTab === 'security' && <ComingSoon title="Security" description="Manage access controls and password policies." />}
            </div>
        </div>
    );
}
