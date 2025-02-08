"use client";

import "./auth.css";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SignUpForm({
  navigateTo,
}: {
  navigateTo: (page: "login" | "signup" | "forgotPassword") => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/"); // Redirect to homepage after sign up
    } catch (err: any) {
      setError("Error creating account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="auth-title">Sign Up</h1>
      {error && <p className="auth-error">{error}</p>}

      <div className="auth-form-group">
        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          placeholder="Enter your email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="auth-form-group">
        <label className="auth-label">Password</label>
        <input
          className="auth-input"
          placeholder="Create a password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="auth-form-group">
        <label className="auth-label">Confirm Password</label>
        <input
          className="auth-input"
          placeholder="Re-enter password to confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button className="auth-button" onClick={handleSignUp} disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>
      <div className="link-container">
        <p>Already have an account?</p>
        <p className="auth-link" onClick={() => navigateTo("login")}>
          Login
        </p>
      </div>
    </div>
  );
}
