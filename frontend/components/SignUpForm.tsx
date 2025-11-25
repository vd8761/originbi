// components/SignUpForm.tsx
"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { signUp } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/aws-amplify-config";
import { COUNTRY_CODES } from "@src/utils/countryCodes";

interface SignUpFormProps {
  onSignUpSuccess: (email: string) => void;
}

interface AmplifyAuthError extends Error {
  name: string;
  message: string;
}

const INDIA_CODE =
  COUNTRY_CODES.find((c) => c.code === "IN") || COUNTRY_CODES[0];

type FieldError = "name" | "email" | "password" | "mobile" | "gender";

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUpSuccess }) => {
  useEffect(() => {
    configureAmplify();
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [mobileNumberDigits, setMobileNumberDigits] = useState("");
  const [countryCode, setCountryCode] = useState(INDIA_CODE.dial_code);

  const [generalError, setGeneralError] = useState("");
  const [fieldError, setFieldError] = useState<Record<FieldError, string>>({
    name: "",
    email: "",
    password: "",
    mobile: "",
    gender: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*])(?=.{8,})/;

  const inputClasses = (fieldName: FieldError) => {
    const isInvalid = fieldError[fieldName];
    return `
      bg-brand-light-secondary dark:bg-brand-dark-tertiary border 
      text-brand-text-light-primary dark:text-brand-text-primary 
      placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary 
      text-sm rounded-full block w-full p-4 transition-colors duration-300 
      ${
        isInvalid
          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
          : "border-brand-light-tertiary dark:border-brand-dark-tertiary focus:ring-brand-green focus:border-brand-green"
      }
    `;
  };

  const selectClasses = (fieldName: FieldError) =>
    `${inputClasses(fieldName)} appearance-none`;

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();

    setGeneralError("");
    setFieldError({
      name: "",
      email: "",
      password: "",
      mobile: "",
      gender: "",
    });

    const cleanedMobileNumber = mobileNumberDigits.trim().replace(/\s|-/g, "");
    let hasError = false;

    if (!name.trim()) {
      setFieldError((prev) => ({
        ...prev,
        name: "Please enter your full name.",
      }));
      hasError = true;
    }

    if (!emailRegex.test(email)) {
      setFieldError((prev) => ({
        ...prev,
        email: "Please enter a valid email address.",
      }));
      hasError = true;
    }

    if (!passwordRegex.test(password)) {
      setFieldError((prev) => ({
        ...prev,
        password:
          "Password must be at least 8 characters long and contain 1 uppercase letter, 1 lowercase letter, and 1 number or special character.",
      }));
      hasError = true;
    }

    if (cleanedMobileNumber.length < 6) {
      setFieldError((prev) => ({
        ...prev,
        mobile: "Please enter a valid mobile number.",
      }));
      hasError = true;
    }

    if (!gender) {
      setFieldError((prev) => ({
        ...prev,
        gender: "Please select your gender.",
      }));
      hasError = true;
    }

    if (hasError) {
      setGeneralError("Please fix the errors below to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      const fullPhoneNumber = `${countryCode}${cleanedMobileNumber}`;

      const response = await signUp({
        username: email.trim(),
        password,
        options: {
          userAttributes: {
            email: email.trim(),
            name: name.trim(),
            given_name: name.trim().split(" ")[0] || "",
            phone_number: fullPhoneNumber,
            gender,
          },
        },
      });

      if (response.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        onSignUpSuccess(email.trim());
      } else if (response.nextStep.signUpStep === "DONE") {
        alert("Account created and confirmed! Please proceed to log in.");
      }
    } catch (err: unknown) {
      console.error("Sign Up Error:", err);

      let message = "An unexpected error occurred during sign up.";

      if (err && typeof err === "object" && "message" in err) {
        const amplifyError = err as AmplifyAuthError;

        if (amplifyError.name === "UsernameExistsException") {
          message = "This email address is already registered.";
          setFieldError((prev) => ({ ...prev, email: message }));
        } else if (amplifyError.name === "InvalidPasswordException") {
          message =
            "Invalid password. Must be at least 8 characters long and contain 1 uppercase letter, 1 lowercase letter, and 1 number or special character.";
          setFieldError((prev) => ({ ...prev, password: message }));
        } else if (amplifyError.message.includes("phone_number")) {
          message = "The mobile number format is invalid.";
          setFieldError((prev) => ({ ...prev, mobile: message }));
        } else {
          message = amplifyError.message.replace("username", "email");
          setGeneralError(message);
        }
      } else {
        setGeneralError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSignUp} noValidate>
      {/* Professional General Error Banner */}
      {generalError && (
        <div className="text-sm text-red-100 bg-red-800/80 border border-red-500 p-4 rounded-lg text-center font-medium transition-opacity duration-300">
          {generalError}
        </div>
      )}

      {/* --- Name Input --- */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-brand-text-secondary mb-2"
        >
          Full Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFieldError((prev) => ({ ...prev, name: "" }));
            setGeneralError("");
          }}
          className={inputClasses("name")}
          placeholder="John Doe"
          required
          disabled={isSubmitting}
        />
        {fieldError.name && (
          <p className="text-xs text-red-400 mt-2 ml-4 transition-opacity duration-300">
            {fieldError.name}
          </p>
        )}
      </div>

      {/* --- Email Input --- */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-brand-text-secondary mb-2"
        >
          Email Address
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldError((prev) => ({ ...prev, email: "" }));
            setGeneralError("");
          }}
          className={inputClasses("email")}
          placeholder="you@example.com"
          required
          disabled={isSubmitting}
        />
        {fieldError.email && (
          <p className="text-xs text-red-400 mt-2 ml-4 transition-opacity duration-300">
            {fieldError.email}
          </p>
        )}
      </div>

      {/* --- Password Input --- */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-brand-text-secondary mb-2"
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldError((prev) => ({ ...prev, password: "" }));
            setGeneralError("");
          }}
          className={inputClasses("password")}
          placeholder="••••••••"
          required
          disabled={isSubmitting}
        />
        {fieldError.password && (
          <p className="text-xs text-red-400 mt-2 ml-4 transition-opacity duration-300">
            {fieldError.password}
          </p>
        )}
      </div>

      {/* --- Mobile Number Combined Input --- */}
      <div>
        <label
          htmlFor="mobile"
          className="block text-sm font-medium text-brand-text-secondary mb-2"
        >
          Mobile Number
        </label>

        <div
          className={`flex relative rounded-full border 
                    ${
                      fieldError.mobile
                        ? "border-red-500"
                        : "border-brand-light-tertiary dark:border-brand-dark-tertiary"
                    }
                    bg-brand-light-secondary dark:bg-brand-dark-tertiary
                `}
        >
          {/* Country Code Selector */}
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={isSubmitting}
            className="bg-transparent text-sm p-4 pr-0 w-[110px] appearance-none 
                            text-brand-text-light-primary dark:text-brand-text-primary 
                            focus:outline-none focus:ring-0 focus:border-0 relative z-20"
          >
            {COUNTRY_CODES.map((country) => (
              <option key={country.code} value={country.dial_code}>
                {country.code} ({country.dial_code})
              </option>
            ))}
          </select>

          {/* Divider */}
          <div className="w-[1px] bg-brand-light-tertiary dark:bg-brand-dark-secondary my-2"></div>

          {/* Mobile Digits Input */}
          <input
            type="tel"
            name="mobile"
            id="mobile"
            value={mobileNumberDigits}
            onChange={(e) => {
              setMobileNumberDigits(e.target.value);
              setFieldError((prev) => ({ ...prev, mobile: "" }));
              setGeneralError("");
            }}
            className="flex-grow bg-transparent text-sm p-4 
                            text-brand-text-light-primary dark:text-brand-text-primary 
                            placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary 
                            focus:outline-none focus:ring-0 focus:border-0 border-none"
            placeholder="80000 80000"
            required
            disabled={isSubmitting}
            inputMode="numeric"
          />
        </div>
        {fieldError.mobile && (
          <p className="text-xs text-red-400 mt-2 ml-4 transition-opacity duration-300">
            {fieldError.mobile}
          </p>
        )}
      </div>

      {/* --- Gender Dropdown --- */}
      <div>
        <label
          htmlFor="gender"
          className="block text-sm font-medium text-brand-text-secondary mb-2"
        >
          Gender
        </label>
        <select
          name="gender"
          id="gender"
          value={gender}
          onChange={(e) => {
            setGender(e.target.value);
            setFieldError((prev) => ({ ...prev, gender: "" }));
            setGeneralError("");
          }}
          className={selectClasses("gender")}
          required
          disabled={isSubmitting}
        >
          <option value="" disabled>
            Select your gender
          </option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {fieldError.gender && (
          <p className="text-xs text-red-400 mt-2 ml-4 transition-opacity duration-300">
            {fieldError.gender}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-white bg-brand-green cursor-pointer hover:bg-brand-green/90 focus:ring-4 focus:outline-none focus:ring-brand-green/30 font-medium rounded-full text-lg px-5 py-4 text-center transition-colors duration-300 disabled:bg-brand-green/50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating Account..." : "Sign Up"}
      </button>
    </form>
  );
};

export default SignUpForm;
