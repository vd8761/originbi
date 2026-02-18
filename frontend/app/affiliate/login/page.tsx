'use client';

import React from 'react';
import AffiliateLogin from '../../../components/affiliate/AffiliateLogin';
import { useRouter } from 'next/navigation';

export default function AffiliateLoginPage() {
    const router = useRouter();

    const handleLoginSuccess = () => {
        router.push('/affiliate/dashboard');
    };

    const handleBack = () => {
        router.back();
    };

    return <AffiliateLogin onLoginSuccess={handleLoginSuccess} onBack={handleBack} />;
}
