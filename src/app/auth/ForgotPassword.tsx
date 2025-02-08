"use client";

import "./auth.css";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordForm({
  navigateTo,
}: {
  navigateTo: (page: "login" | "signup" | "forgotPassword") => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  const handlePasswordReset = async () => {
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setIsPasswordReset(true); // Inform user that email was sent
    } catch (err: any) {
      setError("Error sending password reset email.");
    }
  };

  return (
    <div>
      <h1 className="auth-title">Forgot Password</h1>
      {error && <p className="auth-error">{error}</p>}
      {!isPasswordReset ? (
        <>
          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              placeholder="Enter your email to reset password"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button className="auth-button" onClick={handlePasswordReset}>
            Reset Password
          </button>
        </>
      ) : (
        <p className="auth-success">Password reset email sent!</p>
      )}
      <div className="link-container">
        <p className="auth-link" onClick={() => navigateTo("login")}>
          Back to Login
        </p>
      </div>
    </div>
  );
}
