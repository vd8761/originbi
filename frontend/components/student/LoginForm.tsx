"use client";

import React, { useState, FormEvent, FocusEvent } from "react";
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { signIn } from "aws-amplify/auth";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const validateEmail = (email: string) => {
    if (!email) return "Email ID is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required.";
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number.";
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      return "Password must contain at least one special character.";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    if (touched[name as keyof typeof touched]) {
      if (name === "email") {
        setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
      }
      if (name === "password") {
        setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
      }
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
    if (name === "password") {
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

      await signIn({
        username: values.email,
        password: values.password,
      });

      onLoginSuccess();
    } catch (err: unknown) {
      console.error("Cognito signIn error:", err);

      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : "Login failed. Please check your credentials.";

      setErrors({
        email: "",
        password: message,
      });
      setTouched({ email: true, password: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailInvalid = touched.email && !!errors.email;
  const isPasswordInvalid = touched.password && !!errors.password;

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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
          className={`bg-brand-light-secondary dark:bg-brand-dark-tertiary border text-brand-text-light-primary dark:text-brand-text-primary placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary text-sm rounded-full block w-full p-4 transition-colors duration-300 ${
            isEmailInvalid
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-brand-light-tertiary dark:border-brand-dark-tertiary focus:ring-brand-green focus:border-brand-green"
          }`}
          placeholder="Example@gmail.com"
          required
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
            className={`bg-brand-light-secondary dark:bg-brand-dark-tertiary border text-brand-text-light-primary dark:text-brand-text-primary placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary text-sm rounded-full block w-full p-4 pr-12 transition-colors duration-300 ${
              isPasswordInvalid
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-brand-light-tertiary dark:border-brand-dark-tertiary focus:ring-brand-green focus:border-brand-green"
            }`}
            required
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

      <div className="flex justify-end -mt-4 pb-4">
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
        className="w-full text-white bg-brand-green cursor-pointer hover:bg-brand-green/90 focus:ring-4 focus:outline-none focus:ring-brand-green/30 font-medium rounded-full text-lg px-5 py-4 text-center transition-colors duration-300 disabled:bg-brand-green/50 disabled:cursor-not-allowed"
      >
        Login
      </button>

      {/* <div className="text-center pt-2">
        <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
          Don't have an account?{" "}
          <a
            href="/student/signup"
            className="text-brand-green font-medium hover:text-brand-green/80 transition-colors"
          >
            Sign Up
          </a>
        </p>
      </div> */}
    </form>
  );
};

export default LoginForm;
