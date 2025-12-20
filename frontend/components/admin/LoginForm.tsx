'use client';

import React, { useState, FormEvent, FocusEvent } from 'react';
import Link from 'next/link';
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

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const validateEmail = (email: string) => {
    if (!email) {
      return portalMode === 'admin' ? 'Username is required.' : 'Email ID is required.';
    }
    // Admin login allows usernames that are not emails
    if (portalMode === 'admin') {
      return '';
    }
    // Student/Corporate must be valid email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

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

      // 🧹 0️⃣ Ensure no old session is hanging around
      try {
        await signOut(); // or signOut({ global: true }) if you want to clear all devices
      } catch {
        // ignore signOut errors (e.g., no user signed in)
      }

      // 1️⃣ Sign in with Cognito
      const signInResult = await signIn({
        username: values.email,
        password: values.password,
      });

      //console.log('signInResult:', signInResult);

      if (!signInResult.isSignedIn) {
        setErrors({
          email: '',
          password:
            'Your account login needs an additional step (like password change). Please contact the administrator.',
        });
        return;
      }

      // 2️⃣ Get tokens & groups
      const session = await fetchAuthSession();
      //console.log('full session:', session);

      const { tokens } = session;

      if (!tokens) {
        setErrors({
          email: '',
          password: 'Login session could not be created. Please try again.',
        });
        return;
      }

      const idTokenJwt = tokens.idToken?.toString();
      if (!idTokenJwt) {
        setErrors({
          email: '',
          password: 'Could not read login token. Please try again.',
        });
        return;
      }

      //console.log('ID TOKEN PAYLOAD', tokens.idToken?.payload);
      //console.log('ACCESS TOKEN PAYLOAD', tokens.accessToken?.payload);

      const idGroups =
        (tokens.idToken?.payload['cognito:groups'] as string[] | undefined) || [];
      const accessGroups =
        (tokens.accessToken?.payload['cognito:groups'] as string[] | undefined) ||
        [];

      const groups = [...new Set([...idGroups, ...accessGroups])];

      //console.log('Groups merged from tokens:', groups);
      //console.log('Portal mode:', portalMode);

      // 3️⃣ Required group based on portal
      let requiredGroup = '';
      if (portalMode === 'admin') requiredGroup = 'ADMIN';
      if (portalMode === 'student') requiredGroup = 'STUDENT';
      if (portalMode === 'corporate') requiredGroup = 'CORPORATE';

      //console.log('Required group for this portal:', requiredGroup);

      // 4️⃣ Client-side group restriction
      if (requiredGroup && !groups.includes(requiredGroup)) {
        await signOut();
        setErrors({
          email: '',
          password:
            'You are not allowed to access this portal with these credentials.',
        });
        return;
      }

      // 5️⃣ Call backend to verify token + role
      const apiBase =
        process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';

      let backendUrl = `${apiBase}/admin/me`;
      if (portalMode === 'student') {
        backendUrl = `${apiBase}/admin/me`; // change later when student-service is ready
      }
      if (portalMode === 'corporate') {
        backendUrl = `${apiBase}/admin/me`; // change later when corporate-service is ready
      }

      const res = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idTokenJwt}`,
        },
      });

      if (!res.ok) {
        console.error('Backend /me error status:', res.status);

        let backendMessage = 'Unable to verify your access.';
        try {
          const data = await res.json();
          if (data && typeof data.message === 'string') {
            backendMessage = data.message;
          }
        } catch {
          // ignore JSON parse errors
        }

        await signOut();
        setErrors({
          email: '',
          password: backendMessage,
        });
        return;
      }

      const data = await res.json();
      //console.log('Backend /me response:', data);

      localStorage.setItem('originbi_id_token', idTokenJwt);
      localStorage.setItem('user', JSON.stringify({
        name: data.metadata?.fullName || 'User',
        email: data.email
      }));

      onLoginSuccess();
    } catch (err: unknown) {
      console.error('Cognito signIn or backend error:', err);

      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as any).message)
          : 'Login failed. Please check your credentials.';

      setErrors({
        email: '',
        password: message,
      });
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
      {/* Email / Username Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1"
        >
          {portalMode === 'corporate'
            ? 'Work Email'
            : portalMode === 'admin'
              ? 'UsernameOrEmail'
              : 'Email ID'}
        </label>
        <input
          type={portalMode === 'admin' ? 'text' : 'email'}
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
              : portalMode === 'admin'
                ? 'Enter Username or Email'
                : 'Example@gmail.com'
          }
          required
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

      {/* Forgot Password Link */}
      <div className="flex justify-end pt-1">
        <Link
          href="/admin/forgot-password"
          className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full text-white font-bold rounded-full text-base px-5 py-4 text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-[0.99] ${buttonClass}`}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Logging in…' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
