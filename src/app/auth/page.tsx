"use client";

import "./auth.css";

import { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPassword";

export default function AuthPage() {
  const [formType, setFormType] = useState<
    "login" | "signup" | "forgotPassword"
  >("login"); // Default to 'login'

  const navigateTo = (page: "login" | "signup" | "forgotPassword") => {
    setFormType(page);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Conditional Rendering Based on the Current Form */}
        {formType === "login" && <LoginForm navigateTo={navigateTo} />}
        {formType === "signup" && <SignUpForm navigateTo={navigateTo} />}
        {formType === "forgotPassword" && (
          <ForgotPasswordForm navigateTo={navigateTo} />
        )}
      </div>
    </div>
  );
}
