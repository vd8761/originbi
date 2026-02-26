'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentAssistantPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect old assistant route to the new AI Counsellor
        router.replace('/student/counsellor');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark-primary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        </div>
    );
}
