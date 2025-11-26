// frontend/student/app/signup/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignupForm from '@/components/student/SignUpForm';
import ConfirmSignUp from '@/components/student/ConfirmSignUp';

type AuthStage = 'SIGN_UP' | 'CONFIRM_SIGN_UP';

const SignUpPage: React.FC = () => {
  const router = useRouter();
  const [stage, setStage] = useState<AuthStage>('SIGN_UP');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSignUpSuccess = (email: string) => {
    setRegisteredEmail(email);
    setStage('CONFIRM_SIGN_UP');
  };

  const handleConfirmationSuccess = () => {
    router.push('/login?confirmed=true');
  };

  const renderContent = () => {
    switch (stage) {
      case 'SIGN_UP':
        return <SignupForm onSignUpSuccess={handleSignUpSuccess} />;
      case 'CONFIRM_SIGN_UP':
        return (
          <ConfirmSignUp
            username={registeredEmail}
            onConfirmationSuccess={handleConfirmationSuccess}
          />
        );
      default:
        return <SignupForm onSignUpSuccess={handleSignUpSuccess} />;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {stage === 'SIGN_UP' ? 'Create Your Account' : 'Verify Email'}
      </h1>

      {renderContent()}

      <div className="text-center mt-6">
        {stage === 'SIGN_UP' && (
          <p className="text-sm">
            Already have an account?{' '}
            <a
              href="/student/login"
              className="text-brand-green font-medium hover:underline"
            >
              Log In
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
