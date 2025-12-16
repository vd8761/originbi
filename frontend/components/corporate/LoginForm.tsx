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
  portalMode = 'corporate',
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
    // if (password.length < 8) return 'Password must be at least 8 characters long.'; 
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

      // 🧹 0️⃣ Ensure no old session is hanging around
      try {
        await signOut();
      } catch {
        // ignore signOut errors
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

      const idTokenJwt = tokens.idToken.toString(); // Renamed from idTokenJwt to avoid confusion with idToken variable below
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

      // 3️⃣ Required group based on portal
      let requiredGroup = '';
      if (portalMode === 'admin') requiredGroup = 'ADMIN';
      if (portalMode === 'student') requiredGroup = 'STUDENT';
      if (portalMode === 'corporate') requiredGroup = 'CORPORATE';

      // 4️⃣ Client-side group restriction
      if (requiredGroup && !groups.includes(requiredGroup)) {
        await signOut();
        setGeneralError('You are not allowed to access this portal with these credentials.');
        return;
      }

      const accessToken = tokens.accessToken.toString();
      const idToken = tokens.idToken.toString();

      // Store basic info matching CorporateDashboard requirements
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('idToken', idToken);
      sessionStorage.setItem('userEmail', values.email);

      // Also keep this for consistency with other parts if needed
      localStorage.setItem('originbi_id_token', idTokenJwt);

      // 5️⃣ Call backend to verify token + role?
      // For Corporate, we skip explicit backend verification for now or we could add it later.
      // The previous implementation utilized onLoginSuccess immediately.
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

  const focusColorClass = 'focus:ring-brand-green focus:border-brand-green';
  const iconColorClass = 'text-brand-green';

  return (
    <form
      className="space-y-6 animate-fade-in"
      style={{ animationDelay: '100ms' }}
      onSubmit={handleSubmit}
      noValidate
    >
      {/* General Error Message */}
      {generalError && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
          {generalError}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1"
        >
          {portalMode === 'corporate'
            ? 'Work Email'
            : portalMode === 'admin'
              ? 'Admin ID / Email'
              : 'Email ID'}
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`bg-white dark:bg-[#24272B] border text-brand-text-light-primary dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm rounded-full block w-full p-4 transition-all duration-300 outline-none ${isEmailInvalid
            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
            : `border-gray-200 dark:border-white/10 ${focusColorClass} focus:ring-1 focus:ring-opacity-50`
            }`}
          placeholder={
            portalMode === 'corporate'
              ? 'name@company.com'
              : 'Example@gmail.com'
          }
          required
          disabled={isSubmitting}
          aria-invalid={isEmailInvalid}
        />
        {isEmailInvalid && (
          <p className="ml-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1"
        >
          Password
        </label>
        <div className="relative">
          <input
            type={passwordVisible ? 'text' : 'password'}
            name="password"
            id="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your password"
            className={`bg-white dark:bg-[#24272B] border text-brand-text-light-primary dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm rounded-full block w-full p-4 pr-12 transition-all duration-300 outline-none ${isPasswordInvalid
              ? 'border-red-500 focus:ring-1 focus:ring-red-500'
              : `border-gray-200 dark:border-white/10 ${focusColorClass} focus:ring-1 focus:ring-opacity-50`
              }`}
            required
            disabled={isSubmitting}
            aria-invalid={isPasswordInvalid}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors duration-200"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? (
              <EyeIcon className={`h-5 w-5 ${iconColorClass}`} />
            ) : (
              <EyeOffIcon className={`h-5 w-5 ${iconColorClass}`} />
            )}
          </button>
        </div>
        {isPasswordInvalid && (
          <p className="ml-1 text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Forgot Password Link (Hidden for Admin) */}
      {portalMode !== 'admin' && (
        <div className="flex justify-end pt-1">
          <a
            href="#"
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors"
          >
            Forgot Password?
          </a>
        </div>
      )}

      {/* Login Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full text-white font-bold rounded-full text-base px-5 py-4 text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-[0.99] flex justify-center items-center ${buttonClass}`}
      >
        {isSubmitting ? (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          'Login'
        )}
      </button>
    </form>
  );
};

export default LoginForm;
