'use client';

import React, { Suspense } from 'react';
import CounsellingRunner from '../../../components/counselling/CounsellingRunner';

export default function CounsellingStartPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
            <CounsellingRunner />
        </Suspense>
    );
}
