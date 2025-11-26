// components/ConfirmSignUp.tsx

'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import {
  confirmSignUp,
  resendSignUpCode,
} from 'aws-amplify/auth';

interface AmplifyAuthError extends Error {
  name: string;
  message: string;
}

interface ConfirmSignUpProps {
  username: string; // The user's email address
  onConfirmationSuccess: () => void;
}

const ConfirmSignUp: React.FC<ConfirmSignUpProps> = ({
  username,
  onConfirmationSuccess,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const isUsernameValid = !!username && username.trim() !== '';

  // Only handle the "missing username" case here
  useEffect(() => {
    if (!isUsernameValid) {
      setError('Account details are missing. Please sign up again.');
    }
  }, [isUsernameValid]);

  const inputClasses = (isInvalid: boolean) =>
    `
      bg-brand-light-secondary dark:bg-brand-dark-tertiary border 
      text-brand-text-light-primary dark:text-brand-text-primary 
      placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary 
      text-sm rounded-full block w-full p-4 transition-colors duration-300 
      ${
        isInvalid
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
          : 'border-brand-light-tertiary dark:border-brand-dark-tertiary focus:ring-brand-green focus:border-brand-green'
      }
    `;

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isUsernameValid) {
      setError('Cannot confirm. Account details are missing.');
      return;
    }

    if (code.length === 0) {
      setError('Verification code cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);

      await confirmSignUp({
        username,
        confirmationCode: code,
      });

      onConfirmationSuccess();
    } catch (err: unknown) {
      console.error('Confirmation Error:', err);

      let message = 'An unknown error occurred during confirmation.';

      if (err && typeof err === 'object' && 'message' in err) {
        const amplifyError = err as AmplifyAuthError;

        if (amplifyError.name === 'CodeMismatchException') {
          message =
            'The confirmation code is incorrect or expired. Please check your email or resend the code.';
        } else {
          message = amplifyError.message.replace('username', 'email');
        }
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setResendStatus('Sending...');

    if (!isUsernameValid) {
      setError('Cannot resend code. Account details are missing.');
      setResendStatus('Failed');
      return;
    }

    try {
      await resendSignUpCode({ username });

      setResendStatus('Code successfully resent! Check your inbox.');
      setTimeout(() => setResendStatus(''), 5000);
    } catch (err: unknown) {
      console.error('Resend Code Error:', err);
      setResendStatus('Failed');

      let message = 'Failed to resend code. Please try again later.';

      if (err && typeof err === 'object' && 'name' in err) {
        const amplifyError = err as AmplifyAuthError;

        if (amplifyError.name === 'UserAlreadyConfirmedException') {
          message =
            'This user is already confirmed. Please proceed to Log In.';
        } else if (amplifyError.name === 'LimitExceededException') {
          message =
            'You have exceeded the resend limit. Please try again later.';
        } else if (amplifyError.name === 'UserNotFoundException') {
          message = 'The email address provided is not registered.';
        } else {
          message = amplifyError.message.replace('username', 'email');
        }
      }

      setError(message);
    }
  };

  const isActionDisabled = isSubmitting || !isUsernameValid;

  return (
    <form className="space-y-6" onSubmit={handleConfirm} noValidate>
      <h2 className="text-2xl font-bold text-brand-text-primary">
        Verify Your Account
      </h2>

      <p className="text-brand-text-secondary">
        We sent a verification code to{' '}
        <span className="font-semibold">
          {isUsernameValid ? username : 'your email address'}
        </span>
        . Please enter the 6-digit code below.
      </p>

      {/* Verification Code Input */}
      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-brand-text-secondary mb-2"
        >
          Verification Code
        </label>
        <input
          type="text"
          name="code"
          id="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.trim());
            setError('');
          }}
          className={inputClasses(!!error)}
          placeholder="e.g., 123456"
          required
          maxLength={6}
          inputMode="numeric"
          disabled={isActionDisabled}
        />
      </div>

      {/* Error & Resend Status Display */}
      {error && (
        <div className="mt-4 text-sm text-white bg-red-600 p-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {resendStatus && resendStatus !== 'Failed' && (
        <div
          className={`mt-4 text-sm text-white ${
            resendStatus.toLowerCase().includes('success')
              ? 'bg-green-600'
              : 'bg-blue-600'
          } p-3 rounded-lg text-center`}
        >
          {resendStatus}
        </div>
      )}

      <button
        type="submit"
        disabled={isActionDisabled || code.length < 6}
        className="w-full text-white bg-brand-green cursor-pointer hover:bg-brand-green/90 focus:ring-4 focus:outline-none focus:ring-brand-green/30 font-medium rounded-full text-lg px-5 py-4 text-center transition-colors duration-300 disabled:bg-brand-green/50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Verifying...' : 'Confirm Account'}
      </button>

      <div className="text-center pt-2">
        <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isActionDisabled || resendStatus === 'Sending...'}
            className="text-brand-green font-medium hover:text-brand-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resend Code
          </button>
        </p>
      </div>
    </form>
  );
};

export default ConfirmSignUp;
