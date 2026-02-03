"use client";

import React, { useEffect, useState } from 'react';
import CorporateProfileView from '@/components/corporate/CorporateProfileView';
import { corporateDashboardService } from '@/lib/services';
import { useRouter } from 'next/navigation';

export default function CorporateProfilePage() {
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const email = sessionStorage.getItem('userEmail');
            if (!email) {
                router.push('/corporate/login');
                return;
            }

            try {
                const data = await corporateDashboardService.getProfile(email);
                setProfileData(data);
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    return (
        <div className="h-full">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
                </div>
            ) : profileData ? (
                <CorporateProfileView data={profileData} />
            ) : (
                <div className="text-center text-red-500">Failed to load profile.</div>
            )}
        </div>
    );
}
