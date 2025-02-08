"use client";

import "./auth.css";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  navigateTo: (page: "login" | "signup" | "forgotPassword") => void;
}

export default function LoginForm({ navigateTo }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Store user in localStorage after login
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/"); // Redirect after successful login
    } catch (err: any) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="auth-title">Login</h1>
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
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button className="auth-button" onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      <div className="link-container">
        <p>Don't have an account? </p>
        <p className="auth-link" onClick={() => navigateTo("signup")}>
          Sign up
        </p>
      </div>

      <p className="auth-link" onClick={() => navigateTo("forgotPassword")}>
        Forgot Password?
      </p>
    </div>
  );
}
