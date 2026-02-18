'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { configureAmplify } from '../../lib/aws-amplify-config';

configureAmplify();

interface RequireAffiliateProps {
    children: React.ReactNode;
}

const RequireAffiliate: React.FC<RequireAffiliateProps> = ({ children }) => {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAffiliate = async () => {
            try {
                // 1. Check Cognito Session
                const session = await fetchAuthSession();
                const tokens = session.tokens;

                if (!tokens) {
                    throw new Error('No tokens found');
                }

                // 2. Check Role/Group is AFFILIATE
                const accessToken = tokens.accessToken;
                const groups = (accessToken.payload['cognito:groups'] as string[]) || [];

                if (!groups.includes('AFFILIATE')) {
                    throw new Error('User does not have AFFILIATE role');
                }

                // 3. Verify affiliate_user data exists in localStorage
                const storedUser = localStorage.getItem('affiliate_user');
                if (!storedUser) {
                    throw new Error('No affiliate user data found');
                }

                const user = JSON.parse(storedUser);
                if (!user.id || user.id === 'aff_001') {
                    // If still using mock ID, force re-login
                    throw new Error('Invalid affiliate ID — re-login required');
                }

                setChecking(false);
            } catch (err) {
                console.error('RequireAffiliate check failed:', err);
                try {
                    await signOut();
                } catch {
                    // ignore error
                }
                localStorage.removeItem('affiliate_user');
                localStorage.removeItem('affiliate_token');
                sessionStorage.clear();
                router.replace('/affiliate/login');
            }
        };

        checkAffiliate();
    }, [router]);

    if (checking) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-black">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-green"></div>
            </div>
        );
    }

    return <>{children}</>;
};

export default RequireAffiliate;
