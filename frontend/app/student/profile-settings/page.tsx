'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../../lib/aws-amplify-config';
import RequireStudent from '../../../components/auth/RequireStudent';
import { studentService } from '../../../lib/services/student.service';
import { ArrowRightWithoutLineIcon, PhoneIcon, EmailIcon, LockIcon } from '../../../components/icons';
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
                            mobile_number: profile.mobile_number || profile.metadata?.phone || profile.phone
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
            <div className="bg-white dark:bg-white/[0.08] rounded-2xl p-6 shadow-md dark:shadow-none border border-gray-200 dark:border-white/[0.08] mb-6 relative">
                {/* Change Password Button */}
                <button 
                    onClick={() => router.push('/student/change-password')}
                    className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-[#1ED36A]/10 hover:bg-[#1ED36A]/20 text-[#1ED36A] rounded-xl transition-all text-sm font-semibold group"
                >
                    <LockIcon className="w-4 h-4" />
                    <span>Change Password</span>
                </button>

                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div 
                        className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0"
                        style={{ backgroundColor: `#${getAvatarColor(user?.name || 'S')}` }}
                    >
                        {getInitials(user?.name)}
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1 h-28 flex flex-col justify-center">
                        <h2 className="text-2xl font-semibold text-[#19211C] dark:text-white mb-2">
                            {capitalizeWords(user?.name) || 'Student'}
                        </h2>
                        
                        <div className="flex items-center mb-3">
                            <div className="px-4 py-[5px] rounded-lg border border-[#FEF000] text-white text-sm font-medium bg-[#FEF000]/5 whitespace-nowrap">
                                Trait: {traitName}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-8 text-white">
                            <div className="flex items-center gap-2.5">
                                <PhoneIcon className="w-4 h-4 text-[#1ED36A] relative -top-[2px]" />
                                <span className="text-[15px] font-medium">{user?.mobile_number || '99876543321'}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <EmailIcon className="w-[19px] h-[19px] text-[#1ED36A]" />
                                <span className="text-[15px] font-medium">{user?.email || ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
