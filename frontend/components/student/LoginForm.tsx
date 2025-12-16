'use client';

import React, { useState, FormEvent, FocusEvent } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { signIn, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/aws-amplify-config.js';

configureAmplify(); // ensure Amplify is configured

interface LoginFormProps {
  onLoginSuccess: () => void;
  buttonClass?: string;
  portalMode?: 'student' | 'corporate' | 'admin';
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  buttonClass = 'bg-brand-green hover:bg-brand-green/90 focus:ring-brand-green/30',
  portalMode = 'student',
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const validateEmail = (email: string) => {
    if (!email) return 'Email ID is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required.';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setGeneralError('');

    if (touched[name as keyof typeof touched]) {
      if (name === 'email') {
        setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
      }
      if (name === 'password') {
        setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
      }
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
    if (name === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(values.email);
    const passwordError = validatePassword(values.password);

    setErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });

    if (emailError || passwordError) return;

    try {
      setIsSubmitting(true);
      setGeneralError('');

      // 🧹 Ensure no old session is hanging around
      try {
        await signOut();
      } catch {
        // ignore
      }

      // 1️⃣ Sign in with Cognito
      const signInResult = await signIn({
        username: values.email,
        password: values.password,
      });

      if (!signInResult.isSignedIn) {
        setGeneralError('Your account login needs an additional step. Please contact support.');
        return;
      }

      // 2️⃣ Get tokens & groups
      const session = await fetchAuthSession();
      const { tokens } = session;

      if (!tokens || !tokens.accessToken || !tokens.idToken) {
        setGeneralError('Login session could not be created. Please try again.');
        return;
      }

      const idTokenJwt = tokens.idToken.toString();
      if (!idTokenJwt) {
        setGeneralError('Could not read login token. Please try again.');
        return;
      }

      const idGroups =
        (tokens.idToken?.payload['cognito:groups'] as string[] | undefined) || [];
      const accessGroups =
        (tokens.accessToken?.payload['cognito:groups'] as string[] | undefined) ||
        [];

      const groups = [...new Set([...idGroups, ...accessGroups])];

      // 3️⃣ Required group
      const requiredGroup = 'STUDENT';

      // 4️⃣ Client-side group restriction
      if (!groups.includes(requiredGroup)) {
        await signOut();
        setGeneralError('You are not allowed to access the Student Portal.');
        return;
      }

      // 5️⃣ Store Session
      const accessToken = tokens.accessToken.toString();
      const idToken = tokens.idToken.toString();

      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('idToken', idToken);
      sessionStorage.setItem('userEmail', values.email);
      // Legacy support if needed
      localStorage.setItem('originbi_id_token', idTokenJwt);

      onLoginSuccess();

    } catch (err: unknown) {
      console.error('Cognito signIn error:', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as any).message)
          : 'Login failed. Please check your credentials.';
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailInvalid = touched.email && !!errors.email;
  const isPasswordInvalid = touched.password && !!errors.password;

  return (
    <form className="flex flex-col gap-[clamp(1rem,1.5vw,1.5rem)]" onSubmit={handleSubmit} noValidate>

      {generalError && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
          {generalError}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-brand-text-light-secondary dark:text-brand-text-secondary mb-2"
        >
          Email ID
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`bg-brand-light-secondary dark:bg-brand-dark-tertiary border text-brand-text-light-primary dark:text-brand-text-primary placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary text-[clamp(0.875rem,1vw,1rem)] rounded-full block w-full transition-colors duration-300 ${isEmailInvalid
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-brand-light-tertiary dark:border-brand-dark-tertiary focus:ring-brand-green focus:border-brand-green"
            }`}
          style={{ padding: 'clamp(0.875rem, 1.1vw, 1.125rem)' }}
          placeholder="Example@gmail.com"
          required
          disabled={isSubmitting}
          aria-invalid={isEmailInvalid}
        />
        {isEmailInvalid && (
          <p className="mt-2 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-brand-text-light-secondary dark:text-brand-text-secondary mb-2"
        >
          Password
        </label>
        <div className="relative">
          <input
            type={passwordVisible ? "text" : "password"}
            name="password"
            id="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your password"
            className={`bg-brand-light-secondary dark:bg-brand-dark-tertiary border text-brand-text-light-primary dark:text-brand-text-primary placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary text-[clamp(0.875rem,1vw,1rem)] rounded-full block w-full pr-12 transition-colors duration-300 ${isPasswordInvalid
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-brand-light-tertiary dark:border-brand-dark-tertiary focus:ring-brand-green focus:border-brand-green"
              }`}
            style={{ padding: 'clamp(0.875rem, 1.1vw, 1.125rem)' }}
            required
            disabled={isSubmitting}
            aria-invalid={isPasswordInvalid}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 cursor-pointer flex items-center pr-4 text-brand-text-light-secondary hover:text-brand-text-light-primary dark:text-brand-text-secondary dark:hover:text-white transition-colors duration-300"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            {passwordVisible ? (
              <EyeIcon className="h-5 w-5 text-brand-green" />
            ) : (
              <EyeOffIcon className="h-5 w-5 text-brand-green" />
            )}
          </button>
        </div>
        {isPasswordInvalid && (
          <p className="mt-2 text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      <div className="flex justify-end -mt-2">
        <a
          href="/forgot-password"
          className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-green transition-colors font-medium"
        >
          Forgot Password?
        </a>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ padding: 'clamp(0.875rem, 1.1vw, 1.125rem)' }}
        className="w-full text-white bg-brand-green cursor-pointer hover:bg-brand-green/90 focus:ring-4 focus:outline-none focus:ring-brand-green/30 font-medium rounded-full text-[clamp(1.125rem,1.3vw,1.375rem)] text-center transition-colors duration-300 disabled:bg-brand-green/50 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {isSubmitting ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : 'Login'}
      </button>

    </form>
  );
};

export default LoginForm;
