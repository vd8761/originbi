import React, { Suspense } from 'react';
import ResetPassword from '../../../components/corporate/ResetPassword';

export default function CorporateResetPasswordPage() {
    return (
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
            <ResetPassword />
        </Suspense>
    );
}
