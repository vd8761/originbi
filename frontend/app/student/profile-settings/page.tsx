'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../../lib/aws-amplify-config';
import RequireStudent from '../../../components/auth/RequireStudent';
import { studentService } from '../../../lib/services/student.service';
import { ArrowRightWithoutLineIcon } from '../../../components/icons';

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
                            personalityTrait: profile.personalityTrait
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
            <div className="bg-white dark:bg-white/[0.08] rounded-2xl p-6 shadow-md dark:shadow-none border border-gray-200 dark:border-white/[0.08] mb-6">
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-[#1ED36A] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1">
                        <h2 className="text-2xl font-semibold text-[#19211C] dark:text-white mb-1">{user?.name || 'Student'}</h2>
                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-32">Origin ID</span>
                                <span className="text-sm font-medium text-[#19211C] dark:text-white">{user?.personalityTrait?.id || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-32">Personality</span>
                                <span className="text-sm font-medium text-[#1ED36A]">{traitName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-32">Email</span>
                                <span className="text-sm font-medium text-[#19211C] dark:text-white">{user?.email || ''}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-32">Phone</span>
                                <span className="text-sm font-medium text-[#19211C] dark:text-white">N/A</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
