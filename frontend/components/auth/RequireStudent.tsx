'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/aws-amplify-config';

configureAmplify();

interface RequireStudentProps {
    children: React.ReactNode;
}

const RequireStudent: React.FC<RequireStudentProps> = ({ children }) => {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkStudent = async () => {
            try {
                // 1. Check Session
                const session = await fetchAuthSession();
                const tokens = session.tokens;

                if (!tokens) {
                    throw new Error('No tokens found');
                }

                // 2. Check Role/Group
                const accessToken = tokens.accessToken;
                const groups = (accessToken.payload['cognito:groups'] as string[]) || [];

                // Role is STUDENT
                if (!groups.includes('STUDENT')) {
                    throw new Error('User does not have STUDENT role');
                }

                setChecking(false);
            } catch (err) {
                console.error('RequireStudent check failed:', err);
                try {
                    await signOut();
                } catch {
                    // ignore error
                }
                router.replace('/student/login');
            }
        };

        checkStudent();
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

export default RequireStudent;
