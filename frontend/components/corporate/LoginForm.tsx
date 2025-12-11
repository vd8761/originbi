
'use client';

import React, { useState, FormEvent, FocusEvent } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

interface LoginFormProps {
  onLoginSuccess: () => void;
  buttonClass?: string;
  portalMode?: 'student' | 'corporate' | 'admin';
}

const LoginForm: React.FC<LoginFormProps> = ({ 
    onLoginSuccess, 
    buttonClass = "bg-brand-green hover:bg-brand-green/90 focus:ring-brand-green/30",
    portalMode = 'student'
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const validateEmail = (email: string) => {
    if (!email) {
      return 'Email ID is required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Password is required.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });

    if (touched[name as keyof typeof touched]) {
        if (name === 'email') {
            setErrors({ ...errors, email: validateEmail(value) });
        }
        if (name === 'password') {
            setErrors({ ...errors, password: validatePassword(value) });
        }
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });

    if (name === 'email') {
        setErrors({ ...errors, email: validateEmail(value) });
    }
    if (name === 'password') {
        setErrors({ ...errors, password: validatePassword(value) });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(values.email);
    const passwordError = validatePassword(values.password);

    setErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });

    if (!emailError && !passwordError) {
      //console.log('Form submitted successfully:', values);
      onLoginSuccess();
    }
  };
  
  const isEmailInvalid = touched.email && !!errors.email;
  const isPasswordInvalid = touched.password && !!errors.password;
  
  const focusColorClass = 'focus:ring-brand-green focus:border-brand-green';
  const iconColorClass = 'text-brand-green';
  const linkHoverClass = 'hover:text-brand-green';

  return (
    <form className="space-y-2.5 animate-fade-in" style={{ animationDelay: '100ms' }} onSubmit={handleSubmit} noValidate>
      
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1">
          {portalMode === 'corporate' ? 'Work Email' : portalMode === 'admin' ? 'Admin ID / Email' : 'Email ID'}
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`bg-white dark:bg-[#24272B] border text-brand-text-light-primary dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm rounded-full block w-full p-4 transition-all duration-300 outline-none ${isEmailInvalid ? 'border-red-500 focus:ring-1 focus:ring-red-500' : `border-gray-200 dark:border-white/10 ${focusColorClass} focus:ring-1 focus:ring-opacity-50`}`}
          placeholder={portalMode === 'corporate' ? "name@company.com" : "Example@gmail.com"}
          required
          aria-invalid={isEmailInvalid}
        />
        {isEmailInvalid && <p className="ml-1 text-xs text-red-500">{errors.email}</p>}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-brand-text-light-secondary dark:text-gray-400 ml-1">
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
            className={`bg-white dark:bg-[#24272B] border text-brand-text-light-primary dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm rounded-full block w-full p-4 pr-12 transition-all duration-300 outline-none ${isPasswordInvalid ? 'border-red-500 focus:ring-1 focus:ring-red-500' : `border-gray-200 dark:border-white/10 ${focusColorClass} focus:ring-1 focus:ring-opacity-50`}`}
            required
            aria-invalid={isPasswordInvalid}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200`}
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            {passwordVisible ? <EyeIcon className={`h-5 w-5 ${iconColorClass}`}/> : <EyeOffIcon className={`h-5 w-5 ${iconColorClass}`} />}
          </button>
        </div>
        {isPasswordInvalid && <p className="ml-1 text-xs text-red-500">{errors.password}</p>}
      </div>
      
      {/* Forgot Password Link (Hidden for Admin) */}
      {portalMode !== 'admin' && (
        <div className="flex justify-end pt-1">
            <a href="#" className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${linkHoverClass} transition-colors`}>Forgot Password?</a>
        </div>
      )}

      {/* Login Button */}
      <button
        type="submit"
        className={`w-full text-white font-bold rounded-full text-base px-5 py-4 text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-[0.99] ${buttonClass}`}
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;
